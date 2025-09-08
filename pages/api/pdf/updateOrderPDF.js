import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

export async function updateOrderPDF(fileUrl, formData, lawyerData) {
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

    const pdfHeader = Buffer.from(buffer).toString('utf-8', 0, 5);
    if (!pdfHeader.startsWith('%PDF-')) {
      throw new Error('Завантажений файл НЕ є дійсним PDF!');
    }

    const uint8Array = new Uint8Array(buffer);
    const pdfDoc = await PDFDocument.load(uint8Array);

    // Реєструємо fontkit для роботи з кастомними шрифтами
    pdfDoc.registerFontkit(fontkit);

    // Завантаження кастомного шрифту з підтримкою кирилиці
    // const fontPath = path.resolve('./public/fonts/Roboto-Regular.ttf');
    const fontPath = path.join(
      process.cwd(),
      'public/fonts/Roboto-Regular.ttf'
    );

    const fontBytes = await fs.promises.readFile(fontPath);
    if (!fontBytes || fontBytes.length === 0) {
      console.error('Помилка: файл шрифту не завантажився або пустий!');
    }

    const customFont = await pdfDoc.embedFont(fontBytes, { subset: true });

    // Отримуємо доступ до форми у PDF
    const form = pdfDoc.getForm();

    // Функція для встановлення тексту у поле з використанням кастомного шрифту
    const setTextField = (fieldName, text, alignment = 'center') => {
      const field = form.getTextField(fieldName);
      if (!field) {
        console.warn(`Поле '${fieldName}' відсутнє у PDF.`);
        return;
      }

      // Вирівнювання тексту
      if (alignment === 'left') {
        field.setAlignment(0); // Вирівнювання по лівому краю
      } else if (alignment === 'center') {
        field.setAlignment(1); // Центрування
      } else if (alignment === 'right') {
        field.setAlignment(2); // Вирівнювання по правому краю
      }

      field.setText(text, { font: customFont });
      field.updateAppearances(customFont);
    };

    const PIB = () =>
      [formData?.surname, formData?.name, formData?.fatherName || '']
        .filter(i => i)
        .join(' ');

    // Отримати [day, month, year] з різних форматів або повернути сьогоднішню дату
    const getDMY = dateValue => {
      if (!dateValue) {
        const d = new Date();
        return [
          String(d.getDate()).padStart(2, '0'),
          String(d.getMonth() + 1).padStart(2, '0'),
          String(d.getFullYear()),
        ];
      }
      if (typeof dateValue === 'string') {
        if (dateValue.includes('.')) {
          const parts = dateValue.split('.');
          if (parts.length === 3) return parts;
        }
        if (dateValue.includes('-')) {
          const parts = dateValue.split('-');
          if (parts.length >= 3) return [parts[2], parts[1], parts[0]];
        }
        const parsed = new Date(dateValue);
        if (!Number.isNaN(parsed.getTime())) {
          return [
            String(parsed.getDate()).padStart(2, '0'),
            String(parsed.getMonth() + 1).padStart(2, '0'),
            String(parsed.getFullYear()),
          ];
        }
      } else if (
        dateValue instanceof Date &&
        !Number.isNaN(dateValue.getTime())
      ) {
        return [
          String(dateValue.getDate()).padStart(2, '0'),
          String(dateValue.getMonth() + 1).padStart(2, '0'),
          String(dateValue.getFullYear()),
        ];
      }
      // fallback
      const d = new Date();
      return [
        String(d.getDate()).padStart(2, '0'),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getFullYear()),
      ];
    };

    const [day, month, year] = getDMY(formData?.dateCreating);
    const currentYear = String((year || '').slice(-2));

    const birthdayRaw = formData?.birthday ?? '';
    const birthday = birthdayRaw ? String(birthdayRaw).replace(/-/g, '.') : '';

    const formatCertificateMonths = dateString => {
      if (!dateString) return '';
      const months = [
        'січня',
        'лютого',
        'березня',
        'квітня',
        'травня',
        'червня',
        'липня',
        'серпня',
        'вересня',
        'жовтня',
        'листопада',
        'грудня',
      ];
      const parts = String(dateString).split('.');
      if (parts.length !== 3) return dateString;
      const monthIndex = parseInt(parts[1], 10) - 1;
      if (monthIndex < 0 || monthIndex > 11) return dateString;
      return months[monthIndex];
    };

    const [dayCertificate, monthCertificate, yearCertificate] =
      getDMY(lawyerData?.certificate?.date) || [];

    function setTextFieldWithWrap(fieldNames, text, maxLengthPerField) {
      let textParts = [];
      let currentPart = '';

      text.split(' ').forEach(word => {
        if ((currentPart + ' ' + word).trim().length > maxLengthPerField) {
          textParts.push(currentPart.trim());
          currentPart = word;
        } else {
          currentPart += ' ' + word;
        }
      });
      textParts.push(currentPart.trim());

      textParts.forEach((part, index) => {
        if (fieldNames[index]) {
          setTextField(fieldNames[index], part);
        }
      });
    }

    // Заповнюємо поля форми
    setTextField('firstname1', PIB());
    setTextField('firstname2', `${birthday} року народження`);
    setTextField('legal_assistance[number]', 'БН');
    setTextField('legal_assistance[day]', day);
    setTextField('legal_assistance[month]', month);
    setTextField('legal_assistance[year]', year);
    setTextFieldWithWrap(
      ['organs[0]', 'organs[1]'],
      formData.recipient.name,
      75
    );
    setTextField(
      'certificate[number]',
      lawyerData?.certificate?.number || '278'
    );
    setTextField('certificate[day]', dayCertificate || '18');
    setTextField(
      'certificate[month]',
      formatCertificateMonths(lawyerData?.certificate?.date) || 'липня'
    );
    setTextField('certificate[year]', yearCertificate || '2005');
    setTextField(
      'ra[title]',
      lawyerData?.certificate?.agency || 'Чернігівською обласною КДКА',
      'left',
      {
        size: '10px',
      }
    );
    setTextField('current[day]', day);
    setTextField('current[month]', month);
    setTextField('current[year]', currentYear);

    // const pages = pdfDoc.getPages();
    // const firstPage = pages[0];
    // firstPage.drawText('', {
    //   x: 400,
    //   y: 75,
    //   size: 12,
    //   font: customFont,
    //   color: rgb(1, 1, 1),
    // });

    form.flatten(); // Фіксуємо заповнені поля

    // Повертаємо оновлений PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error('Помилка оновлення PDF ордеру:', error);
    throw error;
  }
}
