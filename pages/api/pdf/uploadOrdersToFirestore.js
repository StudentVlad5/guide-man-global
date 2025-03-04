import { getFirestore, getDoc, setDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false, // Вимикаємо автоматичний bodyParser, бо працюємо з FormData
    sizeLimit: '10mb', // Збільшуємо обмеження
  },
};

const db = getFirestore();
const storage = getStorage();

// Завантаження всіх ордерів у Firestore та Storage
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не дозволений' });
  }

  const form = formidable({ multiples: true, keepExtensions: true });

  try {
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    if (!files || !files.files) {
      return res.status(400).json({ error: 'Файли не передані' });
    }

    const uploadedFiles = Array.isArray(files.files)
      ? files.files
      : [files.files];
    let uploadedOrders = 0;

    for (let file of uploadedFiles) {
      const filePath = file.filepath || file.path;
      const fileBuffer = await fs.promises.readFile(filePath);
      const fileName = file.originalFilename;
      const id = fileName.replace('.pdf', ''); // Використовуємо ім'я файлу як ID

      // Перевіряємо, чи ордер вже є в Firestore
      const orderRef = doc(db, 'orders', id);
      const orderSnapshot = await getDoc(orderRef);

      if (orderSnapshot.exists()) {
        console.log(`Ордер ${id} вже існує, пропускаємо.`);
        continue;
      }

      // Завантажуємо в Firebase Storage
      const storageRef = ref(storage, `orders/${fileName}`);
      await uploadBytes(storageRef, fileBuffer);
      const fileUrl = await getDownloadURL(storageRef);

      // Додаємо запис у Firestore
      const orderData = {
        id,
        status: 'free',
        assignedTo: null,
        userData: null,
        pdfUrl: fileUrl,
      };

      await setDoc(orderRef, orderData);
      console.log(`Ордер ${id} завантажено.`);
      uploadedOrders++;
    }

    res.status(200).json({
      message: `Успешно добавлено ${uploadedOrders} новых ордеров!`,
    });
  } catch (error) {
    console.error('Помилка завантаження файлів:', error);
    res.status(500).json({ error: 'Помилка завантаження файлів' });
  }
}
