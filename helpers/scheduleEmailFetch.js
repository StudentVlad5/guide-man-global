import cron from 'node-cron';
import { fetchEmails } from '../pages/api/pdf/fetchEmails';

// Перевірка пошти кожні 5 хвилин
export const scheduleEmailFetch = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('Перевірка нових листів...');
    try {
      await fetchEmails();
      console.log('Перевірка завершена успішно.');
    } catch (error) {
      console.error('Помилка під час перевірки пошти:', error);
    }
  });
};
