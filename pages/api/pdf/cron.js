import cron from 'node-cron';
import { scheduleEmailFetch } from '../../../helpers/scheduleEmailFetch';

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
      await scheduleEmailFetch();
    });
    taskStarted = true;
  }

  res.status(200).json({ success: true, message: 'Планувальник запущено!' });
}
