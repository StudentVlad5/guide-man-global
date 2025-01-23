import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';

export async function prepareAttachments(pdfFiles) {
  return Promise.all(
    pdfFiles.map(async file => {
      if (file.url) {
        const response = await fetch(file.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${file.url}`);
        }
        const buffer = await response.arrayBuffer();
        return {
          filename: file.name,
          content: Buffer.from(buffer),
        };
      } else if (file.path) {
        const buffer = fs.readFileSync(file.path);
        return {
          filename: file.name,
          content: buffer,
        };
      }
    })
  );
}

export async function sendEmail({ to, subject, text, attachments }) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to,
      subject,
      text,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
