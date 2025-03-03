import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';
import path from 'path';

const db = getFirestore();
const storage = getStorage();

// Завантаження всіх ордерів у Firestore та Storage
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не дозволений' });
  }

  try {
    console.log('Запуск uploadOrdersToFirestore');

    const ordersFolder = path.join(process.cwd(), 'public/orders');
    const orderFiles = fs
      .readdirSync(ordersFolder)
      .filter(file => file.endsWith('.pdf'));

    for (let fileName of orderFiles) {
      const orderId = fileName.replace('.pdf', '');
      const filePath = path.join(ordersFolder, fileName);
      const fileBuffer = fs.readFileSync(filePath);

      // Завантаження у Firebase Storage
      const storageRef = ref(storage, `orders/${fileName}`);
      await uploadBytes(storageRef, fileBuffer);
      const fileUrl = await getDownloadURL(storageRef);

      // Додавання у Firestore
      const orderData = {
        orderId,
        status: 'free', // Вільний ордер
        assignedTo: null,
        userData: null,
        pdfUrl: fileUrl,
      };

      await setDoc(doc(collection(db, 'orders'), orderId), orderData);
      console.log(`Ордер ${orderId} завантажено.`);
    }

    res.status(200).json({ message: 'Усі ордери успішно завантажено!' });
  } catch (error) {
    console.error('Помилка під час завантаження ордерів:', error);
    res.status(500).json({ error: 'Помилка під час завантаження ордерів' });
  }
}
