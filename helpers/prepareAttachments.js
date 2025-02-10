import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import { updateDocumentInCollection } from './firebaseControl';

export const prepareAttachments = async pdfFiles => {
  try {
    return Promise.all(
      pdfFiles.map(async file => {
        if (file.url) {
          // Завантаження файлу через URL
          try {
            const response = await fetch(file.url);
            if (!response.ok) {
              throw new Error(`Не вдалося отримати файл за URL: ${file.url}`);
            }
            const buffer = await response.arrayBuffer();
            return {
              filename: file.name,
              content: Buffer.from(buffer),
              encoding: 'base64',
            };
          } catch (error) {
            console.error(`Помилка при завантаженні файлу ${file.url}:`, error);
            throw error;
          }
        } else if (file.path) {
          // Завантаження локального файлу
          try {
            const buffer = fs.readFileSync(file.path);
            return {
              filename: file.name,
              content: buffer,
              encoding: 'base64',
            };
          } catch (error) {
            console.error(
              `Помилка при читанні локального файлу ${file.path}:`,
              error
            );
            throw error;
          }
        } else {
          throw new Error('Файл не має валідного URL або шляху.');
        }
      })
    );
  } catch (error) {
    console.error('Помилка під час підготовки вкладень:', error);
    throw error;
  }
};

export const parseAttachments = emailBody => {
  const attachments = [];
  const regex =
    /Content-Disposition: attachment;\s*filename="([^"]+)"\s*Content-Transfer-Encoding: base64\s*\n([\s\S]*?)\n--/g;
  let match;

  while ((match = regex.exec(emailBody)) !== null) {
    const filename = match[1].trim();
    const base64Content = match[2].replace(/\n/g, '').trim();

    attachments.push({
      filename,
      content: Buffer.from(base64Content, 'base64'),
      encoding: 'base64',
    });
  }

  return attachments;
};

import { Buffer } from 'buffer';

export const parseEmailBody = emailBody => {
  let cleanBody = emailBody;
  const attachments = [];

  // 🔍 Регулярний вираз для пошуку вкладень у Base64
  const attachmentRegex =
    /Content-Type:\s*([\w\/\-\.\+]+);\s*name="(.*?)"\s*Content-Disposition:\s*attachment;\s*filename="(.*?)"\s*Content-Transfer-Encoding:\s*base64\s*\n([\s\S]*?)\n--/g;
  let match;

  while ((match = attachmentRegex.exec(emailBody)) !== null) {
    const mimeType = match[1].trim(); // MIME-тип (наприклад, application/pdf)
    let filename = match[2].trim(); // Оригінальна назва файлу
    const base64Content = match[4].replace(/\n/g, '').trim(); // Вміст файлу у Base64

    // 📝 Декодуємо `=?utf-8?B?...?=` у нормальну назву
    if (filename.includes('=?utf-8?B?')) {
      try {
        filename = Buffer.from(
          filename.replace(/=\?utf-8\?B\?|=\?/g, ''),
          'base64'
        ).toString('utf-8');
      } catch (err) {
        console.error(`❌ Помилка декодування назви файлу: ${filename}`, err);
      }
    }

    // ✂️ Скорочуємо довгі назви
    if (filename.length > 30) {
      const ext = filename.split('.').pop(); // Отримуємо розширення
      filename = filename.substring(0, 25) + '...' + ext; // Обрізаємо назву
    }

    attachments.push({
      filename,
      content: Buffer.from(base64Content, 'base64'),
      encoding: 'base64',
      mimeType,
    });

    // 🔥 Видаляємо вкладення з `body`, залишаючи тільки текст
    cleanBody = cleanBody.replace(match[0], '');
  }

  // 🧹 Видаляємо службові заголовки
  cleanBody = cleanBody
    .replace(/--[\w\d:-]+\n/g, '')
    .replace(/Content-Type:.*\n/g, '')
    .replace(/Content-Disposition:.*\n/g, '')
    .replace(/Content-Transfer-Encoding:.*\n/g, '')
    .trim();

  return { cleanBody, attachments };
};

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  attachments,
  requestId,
}) => {
  try {
    // Налаштування Nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // SMTP-сервер Gmail
      port: 465, // Порт SSL
      secure: true, // Використання SSL
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Налаштування листа
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to,
      subject,
      text,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Лист успішно відправлено: ${info.messageId}`);

    // Після успішної відправки оновлюємо статус у Firestore
    if (requestId) {
      await updateDocumentInCollection(
        'userRequests',
        { status: 'sent' },
        requestId
      );
      console.log(`Статус запиту ${requestId} оновлено на 'sent'`);
    }

    return info;
  } catch (error) {
    console.error('Помилка при відправленні листа:', error);
    throw error;
  }
};
