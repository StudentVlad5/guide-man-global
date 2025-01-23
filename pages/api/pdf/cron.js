import { scheduleEmailFetch } from '../../../helpers/scheduleEmailFetch';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    scheduleEmailFetch();
    return res.status(200).json({ message: 'Cron job запущено!' });
  }
  res.status(405).json({ error: 'Метод не дозволено' });
}
