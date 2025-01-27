import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { processIncomingEmail } from '../../../helpers/processIncomingEmail';

const imapConfig = {
  imap: {
    user: process.env.SMTP_EMAIL,
    password: process.env.SMTP_PASSWORD,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 3000,
    tlsOptions: { rejectUnauthorized: false },
  },
};

let activeConnections = 0;
const MAX_CONNECTIONS = 10; // Обмеження на кількість одночасних з'єднань

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const fetchEmails = async () => {
  if (activeConnections >= MAX_CONNECTIONS) {
    console.warn("Досягнуто ліміту одночасних з'єднань. Очікування...");
    await delay(1000); // Затримка 1 секунда
    return fetchEmails(); // Рекурсивний виклик після затримки
  }

  activeConnections++;

  try {
    console.log('Підключення до IMAP-сервера...');
    const connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');

    console.log('Підключення до INBOX успішне.');
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };

    const messages = await connection.search(searchCriteria, fetchOptions);

    for (const message of messages) {
      const email = await simpleParser(message.parts[0].body);
      await processIncomingEmail(email);
      console.log('Отримано листи:', messages);
    }

    connection.end();
  } catch (error) {
    console.error('Error fetching emails:', error);
    res
      .status(500)
      .json({ error: 'Помилка при отриманні листів', details: error.message });
  } finally {
    activeConnections--;
  }
};
