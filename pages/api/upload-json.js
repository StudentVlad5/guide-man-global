import { db } from '../../firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  runTransaction,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не дозволено' });
  }

  try {
    const { fileName, collectionName } = req.body;
    // Перевірка вхідних параметрів
    if (!fileName || !collectionName) {
      return res
        .status(400)
        .json({ error: 'Необхідно вказати fileName та collectionName' });
    }

    // Завантаження JSON-файлу
    const filePath = path.join(process.cwd(), 'api', fileName);

    // Перевірка існування файлу
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `Файл ${fileName} не знайдено` });
    }

    // Читання JSON-файлу
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Отримання колекції
    const collectionRef = collection(db, collectionName);

    // Додавання документів із транзакціями
    const promises = Object.keys(jsonData).map(async key => {
      const data = jsonData[key];

      await runTransaction(db, async transaction => {
        // Перевірка існування документа з таким самим `id`
        if (data.id) {
          const q = doc(collectionRef, data.id); // Використання `id` як ключа документа
          const docSnap = await transaction.get(q);

          if (!docSnap.exists()) {
            // Якщо документ не існує, додаємо його
            const newDocRef = doc(collectionRef); // Генерація унікального `idPost`
            transaction.set(q, { ...data, idPost: newDocRef.id }); // Додаємо дані з унікальним `idPost`
          } else {
            console.log(`Документ із id "${data.id}" вже існує. Пропускаємо.`);
          }
        } else {
          // Якщо `id` відсутнє, додаємо з автоматичним ключем
          const newDocRef = doc(collectionRef);
          transaction.set(newDocRef, { ...data, idPost: newDocRef.id });
        }
      });
    });

    await Promise.all(promises);

    // // Додавання документів із перевіркою на дублювання
    // const promises = Object.keys(jsonData).map(async key => {
    //   const data = jsonData[key];

    //   if (data.id) {
    //     // Перевірка дублювання за полем `id`
    //     const q = query(collectionRef, where('id', '==', data.id));
    //     const querySnapshot = await getDocs(q);

    //     if (querySnapshot.empty) {
    //       // Додавання нового документа з автоматично згенерованим Document ID
    //       const docRef = await addDoc(collectionRef, { ...data });

    //       // Оновлення поля idPost (Document ID)
    //       await updateDoc(doc(db, collectionName, docRef.id), {
    //         idPost: docRef.id,
    //       });
    //     } else {
    //       console.log(`Документ із id "${data.id}" вже існує. Пропускаємо.`);
    //     }
    //   } else {
    //     // Якщо id відсутнє, просто додаємо документ із унікальним Document ID
    //     const docRef = await addDoc(collectionRef, { ...data });

    //     // Оновлення idPost
    //     await updateDoc(doc(db, collectionName, docRef.id), {
    //       idPost: docRef.id,
    //     });
    //   }
    // });

    // await Promise.all(promises);

    return res.status(200).json({
      message: `Дані з файлу ${fileName} успішно завантажено в колекцію ${collectionName}`,
    });
  } catch (error) {
    console.error('Помилка під час завантаження даних:', error);
    return res
      .status(500)
      .json({ error: 'Помилка під час завантаження даних' });
  }
}
