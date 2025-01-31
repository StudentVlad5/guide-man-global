import cron from 'node-cron';
import { fetchEmails } from './fetchEmails.js';

let taskStarted = false;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Метод не дозволено' });
  }

  // Запускаємо планувальник тільки один раз
  if (!taskStarted) {
    console.log('Запуск планувальника перевірки пошти...');
    cron.schedule('*/5 * * * *', async () => {
      console.log('Виконується перевірка пошти...');
      try {
        await fetchEmails(); // Викликаємо функцію перевірки пошти
        console.log('Перевірка пошти завершена успішно.');
      } catch (error) {
        console.error('Помилка під час перевірки пошти:', error.message);
      }
    });
    taskStarted = true;
  }

  res.status(200).json({ success: true, message: 'Планувальник запущено!' });
}
