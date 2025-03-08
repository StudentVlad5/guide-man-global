import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

export async function updateOrderPDF(fileUrl, formData) {
  try {
    // Завантажуємо оригінальний PDF ордеру
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`Не вдалося завантажити PDF. Статус: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();

    if (!buffer || buffer.byteLength === 0 || isNaN(buffer.byteLength)) {
      throw new Error('Отриманий PDF порожній або пошкоджений.');
    }

    console.log('📥 Завантажений файл:', fileUrl);
    console.log('Перші байти файлу:', new Uint8Array(buffer).slice(0, 10));
    const pdfHeader = Buffer.from(buffer).toString('utf-8', 0, 5);
    if (!pdfHeader.startsWith('%PDF-')) {
      throw new Error('❌ Завантажений файл НЕ є дійсним PDF!');
    }

    // const pdfDoc = await PDFDocument.load(buffer);
    const uint8Array = new Uint8Array(buffer);
    const pdfDoc = await PDFDocument.load(uint8Array);

    // Отримуємо доступ до форми у PDF
    const form = pdfDoc.getForm();
    // console.log(
    //   'Form fields:',
    //   form.getFields().map(f => f.getName())
    // );

    // Реєструємо fontkit для роботи з кастомними шрифтами
    pdfDoc.registerFontkit(fontkit);

    // Завантаження кастомного шрифту з підтримкою кирилиці
    // const fontPath = path.resolve('./public/fonts/Roboto-Regular.ttf');
    const fontPath = path.join(
      process.cwd(),
      'public/fonts/Roboto-Regular.ttf'
    );
    const fontBytes = fs.readFileSync(fontPath);
    const customFont = await pdfDoc.embedFont(fontBytes, { subset: false });

    // Функція для встановлення тексту у поле з використанням кастомного шрифту
    const setTextField = (fieldName, text) => {
      const field = form.getTextField(fieldName);
      if (!field) {
        console.warn(`Поле '${fieldName}' відсутнє у PDF.`);
        return;
      }
      field.updateAppearances(customFont);
      field.setText(text);
    };

    const PIB = () =>
      [formData?.surname, formData?.name, formData?.fatherName || '']
        .filter(i => i)
        .join(' ');
    const date = new Date(formData.dateCreating);
    const formattedMonth = String(date.getMonth() + 1).padStart(2, '0');
    const currentYear = String(date.getFullYear()).slice(-2);

    // Заповнюємо поля форми
    setTextField('firstname1', `${PIB}`);
    setTextField('firstname2', `${formData.birthday} року народження`);
    setTextField('legal_assistance[number]', 'БН');
    setTextField('legal_assistance[day]', String(date.getDate()));
    setTextField('legal_assistance[month]', formattedMonth);
    setTextField('legal_assistance[year]', String(date.getFullYear()));
    setTextField('organs[0]', formData.recipient.name);
    // setTextField('organs[1]', formData.recipient.name);
    setTextField('certificate[number]', '278');
    setTextField('certificate[day]', '18');
    setTextField('certificate[month]', 'липня');
    setTextField('certificate[year]', '2005');
    setTextField('ra[title]', 'Чернігівською обласною КДКА');
    setTextField('current[day]', String(date.getDate()));
    setTextField('current[month]', formattedMonth);
    setTextField('current[year]', currentYear);

    form.flatten(); // Фіксуємо заповнені поля

    // Повертаємо оновлений PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error('Помилка оновлення PDF ордеру:', error);
    throw error;
  }
}
