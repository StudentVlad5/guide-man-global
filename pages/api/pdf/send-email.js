import path from 'path';
import fs from 'fs';
import { getCollectionWhereKeyValue } from '../../../helpers/firebaseControl';
import { prepareAttachments } from '../../../helpers/prepareAttachments';

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
    const pdfFiles = [
      { name: 'lawyersRequest.pdf', url: pdfLawyersRequest },
      { name: 'agreement.pdf', url: pdfAgreement },
      { name: 'file.pdf', url: file },
      { name: 'order.pdf', url: order },
      {
        name: 'certificate.pdf',
        path: path.join(process.cwd(), 'public', 'images', 'certificate.pdf'),
      },
    ].filter(f => f.url || f.path);

    // const certificatePath = path.join(
    //   process.cwd(),
    //   'public',
    //   'images',
    //   'certificate.pdf'
    // );
    // if (fs.existsSync(certificatePath)) {
    //   pdfFiles.push({ name: 'certificate.pdf', path: certificatePath });
    // }

    if (pdfFiles.length === 0) {
      return res.status(404).json({ error: 'PDF-файли не знайдено' });
    }

    const attachments = await prepareAttachments(pdfFiles);

    // Налаштування Nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Налаштування листа
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: recipient.address,
      subject: `${title} (REQ${id})`,
      text: `Вітаю, направляю ${title} у вкладенні.`,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: `Email відправлено на ${recipient.address}`,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('Помилка при відправленні:', error);
    return res
      .status(500)
      .json({ error: 'Не вдалося відправити email', details: error.message });
  }
}
