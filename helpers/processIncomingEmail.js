import {
  getCollectionWhereKeyValue,
  updateDocumentInCollection,
} from './firebaseControl';
import { sendEmail } from './prepareAttachments';
import { format } from 'date-fns';

export const processIncomingEmail = async email => {
  try {
    const subject = email.subject || '';
    const body = email.text || '';
    const attachments = email.attachments || [];

    console.log('Отримано новий лист:', { subject, body, attachments });

    // Вилучення ідентифікатора запиту
    const regex = /REQ\s*\d+/i;
    const match = subject.match(regex) || body.match(regex);

    if (!match) {
      console.log('Ідентифікатор запиту не знайдено.');
      return;
    }

    const requestId = match[0].trim();
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

    console.log(`Знайдено запит у Firestore: ${JSON.stringify(userRequest)}`);

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
      <p>Ми отримали відповідь на ваш запит (${subject}):</p>
      <blockquote>${body}</blockquote>
      <p>З повагою, адвокат<br/>В.Ф.Строгий</p>
    `;

    await sendEmail({
      to: userEmail,
      subject: `Відповідь на запит ${requestId}`,
      text: `Вітаємо! Ми отримали відповідь на ваш запит ${subject}.`,
      html: emailContent,
      attachments,
    });

    // console.log(`Лист із запитом ${requestId} успішно відправлено.`);
  } catch (error) {
    console.error('Помилка під час обробки листа:', error);
  }
};
