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
      attachments: attachments.map(file => ({
        filename: file.filename,
        content: file.content,
        encoding: 'base64',
      })),
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
