import path from 'path';
import fs from 'fs';
import {
  getCollectionWhereKeyValue,
  updateDocumentInCollection,
} from '../../../helpers/firebaseControl';
import {
  prepareAttachments,
  sendEmail,
} from '../../../helpers/prepareAttachments';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не дозволено' });
  }

  const { id, status, userEmail, recipient } = req.body;

  try {
    // Завантаження файлів із Firestore
    const userRequests = await getCollectionWhereKeyValue(
      'userRequests',
      'id',
      id
    );

    if (!userRequests || userRequests.length === 0) {
      return res
        .status(404)
        .json({ error: 'Запити не знайдено для вказаного UID' });
    }

    const { title, pdfLawyersRequest, pdfAgreement, pdfOrder, requesterFile } =
      userRequests[0];
    // Формуємо масив файлів для відправлення
    // const pdfFiles = [
    //   { name: 'lawyersRequest.pdf', url: pdfLawyersRequest },
    //   { name: 'agreement.pdf', url: pdfAgreement },
    //   { name: 'order.pdf', url: pdfOrder },
    // ];

    // Визначаємо, які файли відправляти
    const pdfFiles = [{ name: 'lawyersRequest.pdf', url: pdfLawyersRequest }];

    if (status === 'sent') {
      pdfFiles.push(
        { name: 'agreement.pdf', url: pdfAgreement },
        { name: 'order.pdf', url: pdfOrder }
      );

      // Додаємо файли з поля "file" (масив або одиничний файл)
      if (Array.isArray(requesterFile)) {
        requesterFile.forEach((f, index) => {
          if (f.url) {
            pdfFiles.push({ name: `file-${index + 1}.pdf`, url: f.url });
          }
        });
      } else if (requesterFile?.url) {
        pdfFiles.push({ name: 'file.pdf', url: requesterFile.url });
      }

      // const certificatePath = path.join(
      //   process.cwd(),
      //   'public',
      //   'images',
      //   'certificate.pdf'
      // );
      // if (fs.existsSync(certificatePath)) {
      //   pdfFiles.push({ name: 'certificate.pdf', path: certificatePath });
      // }

      try {
        const lawyers = await getCollectionWhereKeyValue(
          'lawyers',
          'status',
          'active'
        );

        const activeLawyer = lawyers && lawyers.length > 0 ? lawyers[0] : null;

        if (activeLawyer && activeLawyer.certificate?.fileUrl) {
          pdfFiles.push({
            name: 'certificate.pdf',
            url: activeLawyer.certificate?.fileUrl,
          });
          console.log(`Додано сертифікат адвоката: ${activeLawyer.surname}`);
        } else {
          console.warn('Сертифікат адвоката не знайдено або URL відсутній.');
        }
      } catch (e) {
        console.error('Помилка отримання даних адвоката для сертифікату:', e);
      }
    }

    // Перевіряємо, чи є шляхи до файлів
    if (pdfFiles.length === 0) {
      return res.status(404).json({ error: 'PDF-файли не знайдено' });
    }

    // Підготовка вкладень
    const attachments = await prepareAttachments(pdfFiles);

    // Визначаємо текст повідомлення для клієнта в залежності від статусу запиту
    let emailContent = '';
    if (status === 'paid') {
      emailContent = `Ваш адвокатський запит "${title}" ID ${id} прийнято.`;
    } else if (status === 'signed') {
      emailContent = `Ваш адвокатський запит "${title}" ID ${id} підписано та направлено до ${recipient.name}. Очікуйте на відповідь.`;
    } else if (status === 'sent') {
      emailContent = `Вітаю, направляю ${title} ID ${id}.`;
    }

    // Оновлюємо статус у Firestore
    if (id) {
      let newStatus = status;
      if (status === 'signed') {
        newStatus = 'sent'; // Оновлюємо статус тільки після підписання та надсилання
      }
      await updateDocumentInCollection(
        'userRequests',
        { status: newStatus },
        id
      );
      console.log(`Статус запиту ${id} оновлено на '${newStatus}'`);
    }

    // Кому надсилати?
    const recipientEmail = status === 'sent' ? recipient?.address : userEmail;
    if (!recipientEmail) {
      throw new Error('Не знайдено email отримувача.');
    }

    // Відправка листа
    await sendEmail({
      to: recipientEmail,
      subject: `${title} ID ${id}`,
      text: emailContent,
      attachments,
      requestId: id, // Передаємо ID для оновлення статусу
    });

    return res.status(200).json({
      success: true,
      message: `Email відправлено на ${recipientEmail}`,
      // messageId: info.messageId,
    });
  } catch (error) {
    console.error('Помилка при відправленні:', error);
    return res
      .status(500)
      .json({ error: 'Не вдалося відправити email', details: error.message });
  }
}
