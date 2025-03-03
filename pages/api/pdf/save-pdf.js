import fs from 'fs';
import path from 'path';
import { Font } from '@react-pdf/renderer';
import { db } from '../../../firebase';
import { storage } from '../../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { generatePDFBuffer } from '../../../helpers/pdf';
import {
  saveRequestToFirestore,
  uploadPDFToStorage,
} from '../../../helpers/firebaseControl';
import { assignOrderToUser } from '../../../helpers/assignOrder';
import { updateOrderPDF } from './updateOrderPDF';
import { LawyersRequest } from '../../../components/DownloadPDF';
import { Agreement } from '../../../components/Agreement';
import { Contract } from '../../../components/Contract';

Font.registerHyphenationCallback(word => [word]);
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf'),
      fontWeight: 'normal',
    },
    {
      src: path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf'),
      fontWeight: 'bold',
    },
    {
      src: path.join(process.cwd(), 'public', 'fonts', 'Roboto-Italic.ttf'),
      fontStyle: 'italic',
    },
    {
      src: path.join(process.cwd(), 'public', 'fonts', 'Roboto-BoldItalic.ttf'),
      fontStyle: 'italic',
      fontWeight: 'bold',
    },
  ],
});

export default async function handler(req, res) {
  console.log('Request received:', req.method, req.body);

  if (req.method === 'POST') {
    console.log({ message: 'The API is working!' });

    const { formData, selectedDocuments, uid } = req.body;

    try {
      console.log('Data for creating PDF:', formData);
      if (!uid) {
        console.error('Cannot save the file, please log in');
        throw new Error('UID is required to save the request');
      }

      // Зчитуємо зображення логотипу як Base64
      const imagePath = path.resolve(
        process.cwd(),
        'public',
        'images',
        'gerb.png'
      );
      const imageBuffer = fs.readFileSync(imagePath);
      const emblemBase64 = `data:image/png;base64,${imageBuffer.toString(
        'base64'
      )}`;

      // Додаємо Base64-рядок у дані
      formData.emblemBase64 = emblemBase64;

      // Генеруємо PDF-файли
      const generatedPDFs = {};
      const lawyersRequestPDF = await generatePDFBuffer(
        <LawyersRequest data={formData} />
      );
      generatedPDFs.lawyersRequest = lawyersRequestPDF;

      if (selectedDocuments.agreement) {
        const agreementPDF = await generatePDFBuffer(
          <Agreement data={formData} />
        );
        generatedPDFs.agreement = agreementPDF;
      }

      if (selectedDocuments.contract) {
        const contractPDF = await generatePDFBuffer(
          <Contract data={formData} />
        );
        generatedPDFs.contract = contractPDF;
      }

      // Отримуємо наступний доступний ордер та оновлюємо його даними користувача
      const orderData = await assignOrderToUser(uid, formData);
      if (!orderData || !orderData.pdfUrl) {
        throw new Error('Не вдалося отримати вільний ордер.');
      }

      console.log('Ордер призначено:', orderData.orderId);

      // Оновлюємо ордер із заповненими даними користувача
      const updatedOrderPdfBuffer = await updateOrderPDF(
        orderData.pdfUrl,
        formData
      );
      const uploadedOrderUrl = await uploadPDFToStorage(
        updatedOrderPdfBuffer,
        `orders/${orderData.orderId}.pdf`
      );

      console.log('Оновлений ордер збережено в Storage:', uploadedOrderUrl);

      // Завантажуємо файли в Firebase Storage
      const pdfUrls = {};

      for (const [key, pdfBuffer] of Object.entries(generatedPDFs)) {
        const fileName = `documents/${key}-${Date.now()}.pdf`;
        const fileRef = ref(storage, fileName);
        await uploadBytes(fileRef, pdfBuffer);
        const fileUrl = await getDownloadURL(fileRef);
        pdfUrls[key] = fileUrl;
      }

      // Додаємо оновлений ордер у pdfUrls
      pdfUrls.order = uploadedOrderUrl;

      console.log('Generated PDF URLs:', pdfUrls);

      // Зберігаємо запит у Firestore
      const newRequest = await saveRequestToFirestore(
        db,
        uid,
        formData,
        pdfUrls
      );

      res.status(200).json({
        message: 'PDFs saved successfully!',
        request: newRequest,
        pdfUrls,
      });
    } catch (error) {
      console.error('Error creating PDF or recording in DB:', error);
      res.status(500).json({ error: 'Failed to create PDF or save to DB' });
    }
  } else {
    res.status(405).json({ error: 'Method not supported' });
  }
}
