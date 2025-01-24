import cron from 'node-cron';
import { fetchEmails } from './fetchEmails';

// Перевірка пошти кожні 5 хвилин
export const scheduleEmailFetch = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('Перевірка нових листів...');
    await fetchEmails();
  });
};

// Запускаємо планувальник
scheduleEmailFetch();
