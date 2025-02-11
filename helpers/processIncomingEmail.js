import {
  getCollectionWhereKeyValue,
  updateDocumentInCollection,
} from './firebaseControl.js';
import {
  sendEmail,
  parseEmailBody,
  decodeMimeFilename,
} from './prepareAttachments.js';
import { format } from 'date-fns';

export const processIncomingEmail = async email => {
  try {
    const subject = email.subject || '';
    const body = email.text || '';
    let attachments = email.attachments || [];

    console.log('Отримано новий лист:', { subject, body, attachments });

    // Парсимо вкладення та очищуємо body
    const parsedData = parseEmailBody(body) || {
      cleanedBody: '',
      extractedAttachments: [],
    };
    const cleanedBody = parsedData?.cleanedBody || '';
    const extractedAttachments = parsedData?.extractedAttachments || [];

    const parsedAttachments = (extractedAttachments || []).map(file => ({
      filename: decodeMimeFilename(file.filename || 'file'),
      content: file.content,
      encoding: 'base64',
    }));

    attachments = [...attachments, ...parsedAttachments];

    console.log('Оброблені вкладення:', attachments);

    // Вилучення ідентифікатора запиту
    const regex = /ID[:\s]*([\d]+)/i;
    const match = subject.match(regex) || cleanedBody.match(regex);
    const hasId = !!match; // true, якщо ID знайдено
    const hasAttachments = email.attachments && email.attachments.length > 0;

    if (!match) {
      console.log(
        `Ідентифікатор запиту не знайдено у листі (UID: ${email.messageId}).`
      );
      return;
    }

    const requestId = match[1].trim();
    console.log(`Знайдено ідентифікатор запиту: ${requestId}`);

    // Знаходимо відповідний запит у Firestore
    const [userRequest] = await getCollectionWhereKeyValue(
      'userRequests',
      'id',
      requestId
    );

    if (!userRequest) {
      console.log(`Запит із ID ${requestId} не знайдено.`);
      return;
    }

    // Захист від подвійної обробки
    if (userRequest.status === 'done') {
      console.log(`Запит ${requestId} вже оброблено. Пропускаємо.`);
      return;
    }

    // Оновлюємо статус запиту на 'done'
    await updateDocumentInCollection(
      'userRequests',
      {
        status: 'done',
        responseDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      },
      requestId
    );

    console.log(
      `Статус запиту ${requestId} оновлено на 'done'. Дата відповіді збережена.`
    );

    // Надсилання листа користувачу
    const userEmail = userRequest.userEmail;
    const emailContent = `
      <p>Шановний клієнте,</p>
      <p>Ми отримали відповідь на ваш ${userRequest.title}:</p>
      <blockquote>${cleanedBody}</blockquote>
      <p>З повагою, адвокат<br/>В.Ф.Строгий</p>
    `;

    await sendEmail({
      to: userEmail,
      subject: `Відповідь на ${userRequest.title} ${requestId}`,
      text: `Вітаємо! Ми отримали відповідь на ваш ${userRequest.title}.`,
      html: emailContent,
      attachments,
      requestId,
    });

    console.log(`Лист із запитом ${requestId} успішно відправлено.`);
  } catch (error) {
    console.error('Помилка під час обробки листа:', error);
  }
};
