import path from 'path';
import fs from 'fs';
import { getCollectionWhereKeyValue } from '../../../helpers/firebaseControl';
import {
  prepareAttachments,
  sendEmail,
} from '../../../helpers/prepareAttachments';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не дозволено' });
  }

  const { uid, recipient } = req.body;

  try {
    // Завантаження файлів із Firestore
    const userRequests = await getCollectionWhereKeyValue(
      'userRequests',
      'userId',
      uid
    );

    if (!userRequests || userRequests.length === 0) {
      return res
        .status(404)
        .json({ error: 'Запити не знайдено для вказаного UID' });
    }

    const { id, title, pdfLawyersRequest, pdfAgreement, order, file } =
      userRequests[0];
    // Формуємо масив файлів для відправлення
    const pdfFiles = [
      { name: 'lawyersRequest.pdf', url: pdfLawyersRequest },
      { name: 'agreement.pdf', url: pdfAgreement },
      { name: 'order.pdf', url: order },
    ];

    // Додаємо файли з поля "file" (масив або одиничний файл)
    if (Array.isArray(file)) {
      file.forEach((f, index) => {
        if (f.url) {
          pdfFiles.push({ name: `file-${index + 1}.pdf`, url: f.url });
        }
      });
    } else if (file?.url) {
      pdfFiles.push({ name: 'file.pdf', url: file.url });
    }

    const certificatePath = path.join(
      process.cwd(),
      'public',
      'images',
      'certificate.pdf'
    );
    if (fs.existsSync(certificatePath)) {
      pdfFiles.push({ name: 'certificate.pdf', path: certificatePath });
    }

    // Перевіряємо, чи є шляхи до файлів
    if (pdfFiles.length === 0) {
      return res.status(404).json({ error: 'PDF-файли не знайдено' });
    }

    // Підготовка вкладень
    const attachments = await prepareAttachments(pdfFiles);

    // Відправка листа
    await sendEmail({
      to: recipient.address,
      subject: `${title} (REQ${id})`,
      text: `Вітаю, направляю ${title} у вкладенні.`,
      attachments,
    });

    return res.status(200).json({
      success: true,
      message: `Email відправлено на ${recipient.address}`,
      // messageId: info.messageId,
    });
  } catch (error) {
    console.error('Помилка при відправленні:', error);
    return res
      .status(500)
      .json({ error: 'Не вдалося відправити email', details: error.message });
  }
}
