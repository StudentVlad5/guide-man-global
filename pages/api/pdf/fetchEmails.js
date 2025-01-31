import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { processIncomingEmail } from '../../../helpers/processIncomingEmail.js';

const imapConfig = {
  imap: {
    user: process.env.SMTP_EMAIL,
    password: process.env.SMTP_PASSWORD,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 10000,
    tlsOptions: { rejectUnauthorized: false },
    tlsOptions: { servername: 'imap.gmail.com' }, // Додаємо серверне ім'я
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
    const connection = await imaps.connect(imapConfig); // Підключення до IMAP
    await connection.openBox('INBOX'); // Відкриття INBOX
    console.log('Підключення до INBOX успішне.');

    // Виводимо список UID-листів перед отриманням їх вмісту
    const messageUids = await connection.search(['ALL'], { bodies: ['UID'] });

    if (messageUids.length === 0) {
      console.log('Немає листів у INBOX.');
      return;
    }

    console.log(
      'UID знайдених листів:',
      messageUids.map(m => m.attributes.uid)
    );

    const searchCriteria = ['UNSEEN']; // Пошук непрочитаних листів
    const fetchOptions = {
      // bodies: ['HEADER', 'TEXT', '1', '1.1'],
      bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)'], // Отримуємо тільки заголовки
      struct: true, // Отримуємо структуру листа
      markSeen: true, // Позначати як прочитані
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`Отримано ${messages.length} повідомлень.`);

    for (const message of messages) {
      try {
        console.log(`Обробка листа UID: ${message.attributes.uid}`);

        const bodyPart = message.parts.find(
          part => part.which === 'TEXT'
          // || part.which === '1' || part.which === '1.1'
        );
        if (!bodyPart || !bodyPart.body) {
          console.warn('Частини листа для парсингу не знайдено.');
          continue;
        }

        const email = await simpleParser(bodyPart.body); // Парсинг обраної частини
        console.log('Розібраний лист:', email.subject || 'Без теми');

        // Додатково логувати вкладення
        if (email.attachments && email.attachments.length > 0) {
          console.log(`Вкладень: ${email.attachments.length}`);
        }

        await processIncomingEmail(email);
      } catch (err) {
        console.error('Помилка при обробці листа:', err.message);
      }
    }

    connection.end(); // Закриття з'єднання
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw new Error(`Помилка при отриманні листів: ${error.message}`); // Проброс помилки
  } finally {
    activeConnections--;
  }
};
