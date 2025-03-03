import { PDFDocument, rgb } from 'pdf-lib';
import fetch from 'node-fetch';

export async function updateOrderPDF(fileUrl, formData) {
  try {
    // Завантажуємо оригінальний PDF ордеру
    const existingPdfBytes = await (await fetch(fileUrl)).arrayBuffer();
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Отримуємо доступ до форми у PDF
    const form = pdfDoc.getForm();

    // Заповнюємо поля форми
    form
      .getTextField('fullName')
      .setText(
        `${formData.lastName} ${formData.firstName} ${formData.fatherName}`
      );
    form
      .getTextField('birthday')
      .setText(`${formData.birthday} року народження`);
    form.getTextField('recipientName').setText(formData.recipient.name);

    // Опціонально: зміна кольору тексту (якщо треба зробити його видимішим)
    form.getTextField('fullName').setFontColor(rgb(0, 0, 0));
    form.getTextField('birthday').setFontColor(rgb(0, 0, 0));
    form.getTextField('recipientName').setFontColor(rgb(0, 0, 0));

    form.flatten(); // Фіксуємо заповнені поля

    // Повертаємо оновлений PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error('Помилка оновлення PDF ордеру:', error);
    throw error;
  }
}
