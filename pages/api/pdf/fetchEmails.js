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
    tlsOptions: { rejectUnauthorized: false, servername: 'imap.gmail.com' }, // Додаємо серверне ім'я
  },
};

let activeConnections = 0;
const MAX_CONNECTIONS = 5; // Обмеження на кількість одночасних з'єднань
const CHECK_INTERVAL = 5 * 60 * 1000; // Перевірка раз на 5 хвилин
let lastCheckTime = 0; // Час останнього запуску

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const fetchEmails = async () => {
  const now = Date.now();

  if (now - lastCheckTime < CHECK_INTERVAL) {
    console.warn(
      `Чекати перед наступним викликом: ${
        (CHECK_INTERVAL - (now - lastCheckTime)) / 1000
      } сек.`
    );
    return;
  }

  if (activeConnections >= MAX_CONNECTIONS) {
    console.warn("Досягнуто ліміту одночасних з'єднань. Очікування...");
    await delay(30000); // Затримка 30 секунд перед повторною спробою
    return fetchEmails(); // Рекурсивний виклик після затримки
  }

  activeConnections++;
  lastCheckTime = Date.now(); // Оновлюємо час останнього запиту

  let connection;
  try {
    console.log('Підключення до IMAP-сервера...');
    connection = await imaps.connect(imapConfig); // Підключення до IMAP

    const mailboxes = await connection.getBoxes();
    console.log('Доступні папки:', Object.keys(mailboxes));

    await connection.openBox('INBOX', { readOnly: false }); // Відкриття INBOX
    console.log('Підключення до INBOX успішне.');

    // Пошук лише непрочитаних листів
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      // bodies: ['HEADER', 'TEXT', 'BODY[]'],
      bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)', 'TEXT'],
      struct: true, // Отримуємо структуру листа
      markSeen: true, // Позначати як прочитані
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`Отримано ${messages.length} повідомлень.`);

    for (const message of messages) {
      try {
        console.log(`Обробка листа UID: ${message.attributes.uid}`);

        const bodyPart = message.parts.find(
          part =>
            part.which === 'HEADER.FIELDS (FROM SUBJECT DATE)' ||
            part.which === 'TEXT'
          // ||
          // part.which === 'BODY[]'
        );
        if (!bodyPart || !bodyPart.body) {
          console.warn('Частини листа для парсингу не знайдено.');
          console.log('Структура листа:', JSON.stringify(message, null, 2));
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
    console.error('Помилка при отриманні листів:', error);
    throw new Error(`Помилка при отриманні листів: ${error.message}`); // Проброс помилки
  } finally {
    if (connection && connection.state !== 'disconnected') {
      connection.end();
      console.log("З'єднання IMAP закрито.");
    }
    activeConnections--;
  }
};

// **Автоматичний виклик через інтервал**
setInterval(fetchEmails, CHECK_INTERVAL);
