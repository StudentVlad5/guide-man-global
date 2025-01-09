import fs from 'fs';
import path from 'path';
import { Font } from '@react-pdf/renderer';
import { generatePDFBuffer } from '../../../helpers/pdf';
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { formData, type } = req.body;

  try {
    // Зчитуємо зображення логотипу як Base64
    const imagePath = path.resolve(
      process.cwd(),
      'public',
      'images',
      'gerb.png'
    );
    if (!fs.existsSync(imagePath)) {
      throw new Error('Logo image not found at "public/images/gerb.png"');
    }
    const imageBuffer = fs.readFileSync(imagePath);
    const emblemBase64 = `data:image/png;base64,${imageBuffer.toString(
      'base64'
    )}`;

    // Додаємо Base64-рядок у дані
    formData.emblemBase64 = emblemBase64;

    let pdfBuffer;

    if (type === 'lawyersRequest') {
      pdfBuffer = await generatePDFBuffer(<LawyersRequest data={formData} />);
    } else if (type === 'agreement') {
      pdfBuffer = await generatePDFBuffer(<Agreement data={formData} />);
    } else if (type === 'contract') {
      pdfBuffer = await generatePDFBuffer(<Contract data={formData} />);
    } else {
      throw new Error('Unknown document type');
    }
    res.status(200).json({ pdfBase64: pdfBuffer.toString('base64') });
  } catch (err) {
    console.error(`Error generating ${type} PDF:`, err);
    res.status(500).json({ error: `Failed to generate ${type} PDF preview` });
  }
}
