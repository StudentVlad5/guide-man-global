import { PDFDocument } from 'pdf-lib';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Збільшуємо ліміт для body, щоб обробляти великі PDF файли
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// === Крок 1: Отримання access_token від SignNow ===
async function getSignNowAccessToken() {
  const auth = Buffer.from(
    `${process.env.SIGNNOW_CLIENT_ID}:${process.env.SIGNNOW_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch('https://api.signnow.com/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: process.env.SIGNNOW_USERNAME,
      password: process.env.SIGNNOW_PASSWORD,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to get access token');
  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const {
    signerEmail,
    signerName,
    secondSignerEmail,
    secondSignerName,
    ccEmail,
    doc2File,
    doc3File,
    doc4File,
    doc5File,
  } = req.body;

  // === Крок 2: Встановлюємо значення другого підписанта ===
  const signer2Email =
    !secondSignerEmail || secondSignerEmail.trim() === ''
      ? 'info.ggs.ua@gmail.com'
      : secondSignerEmail.trim();

  const signer2Name =
    !secondSignerName || secondSignerName.trim() === ''
      ? 'Lawyer'
      : secondSignerName.trim();

  if (!signerEmail || !signerName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // === Крок 3: Отримуємо токен ===
    const accessToken = await getSignNowAccessToken();

    // === Крок 4: Завантажуємо PDF з URL-адрес ===
    const urls = [doc2File, doc3File, doc4File, doc5File].filter(Boolean);
    const pdfBuffers = await Promise.all(
      urls.map(async url => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Помилка при завантаженні PDF: ${url}`);
        return await res.arrayBuffer();
      })
    );

    // === Крок 5: Об'єднуємо PDF файли ===
    const mergedPdf = await PDFDocument.create();
    for (const buffer of pdfBuffers) {
      const pdf = await PDFDocument.load(buffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(p => mergedPdf.addPage(p));
    }

    const mergedPdfBytes = await mergedPdf.save();

    // === Крок 6: Завантажуємо PDF у SignNow ===
    const form = new FormData();
    form.append('file', Buffer.from(mergedPdfBytes), {
      filename: 'merged.pdf',
      contentType: 'application/pdf',
    });

    const uploadRes = await fetch('https://api.signnow.com/document', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const uploadData = await uploadRes.json();
    const documentId = uploadData.id;
    if (!documentId)
      throw new Error('Не вдалося завантажити документ в SignNow');

    // === Крок 7: Додаємо поля для підпису у документ ===
    const totalPages = mergedPdf.getPageCount();
    const pageCounts = []; // к-сть сторінок в кожному окремому документі

    // Отримуємо к-сть сторінок кожного документа
    for (const buffer of pdfBuffers) {
      const pdf = await PDFDocument.load(buffer);
      pageCounts.push(pdf.getPageCount());
    }

    // Визначаємо сторінки, що належать до останнього документу
    const pagesInLastTwoDocs = pageCounts
      .slice(-2)
      .reduce((sum, count) => sum + count, 0);
    const signer1LastPage = totalPages - pagesInLastTwoDocs;

    const fields = [];
    for (let i = 0; i < totalPages; i++) {
      // Підписувач 2 підписує всі сторінки
      fields.push({
        x: 390,
        y: 750,
        page_number: i,
        role: 'Signer 2',
        required: true,
        type: 'signature',
        height: 20,
        width: 100,
      });

      // Підписувач 1 підписує тільки сторінки, які НЕ належать до останнього документа
      if (i < signer1LastPage) {
        fields.push({
          x: 40,
          y: 790,
          page_number: i,
          role: 'Signer 1',
          required: true,
          type: 'signature',
          height: 20,
          width: 100,
        });
      }
    }

    await fetch(`https://api.signnow.com/document/${documentId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    // === Крок 8: Формуємо запрошення до підпису ===
    const toSigners = [{ email: signerEmail, role: 'Signer 1', order: 1 }];

    // Додаємо другого підписанта тільки якщо email не порожній
    if (signer2Email && signer2Email.trim() !== '') {
      toSigners.push({
        email: signer2Email,
        role: 'Signer 2',
        order: 2,
      });
    }

    const inviteRes = await fetch(
      `https://api.signnow.com/document/${documentId}/invite`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          to: toSigners,
          cc: ccEmail ? [ccEmail] : [],
          from: 'info.ggs.ua@gmail.com',
          subject: 'Підпишіть, будь ласка, документ',
          message: 'Це об’єднаний документ для підпису.',
        }),
      }
    );

    const inviteData = await inviteRes.json();
    if (!inviteRes.ok)
      throw new Error(inviteData.error || 'Помилка надсилання запрошення');

    // === Успішна відповідь ===
    return res.status(200).json({ envelopeId: inviteData.id });
  } catch (err) {
    console.error('SignNow error:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
