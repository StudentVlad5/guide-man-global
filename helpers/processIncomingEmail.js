import { getCollectionWhereKeyValue } from './firebaseControl';
import sendEmail from '../pages/api/sendEmail';

export const processIncomingEmail = async email => {
  try {
    const subject = email.subject || '';
    const body = email.text || '';
    const attachments = email.attachments || [];

    // Вилучення ідентифікатора запиту
    const regex = /REQ\d+/;
    const match = subject.match(regex) || body.match(regex);

    if (!match) {
      console.log('Запит не знайдено в темі або вмісті.');
      return;
    }

    const requestId = match[0];

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

    console.log(`Лист із запитом ${requestId} успішно відправлено.`);
  } catch (error) {
    console.error('Error processing email:', error);
  }
};
