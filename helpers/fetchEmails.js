import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { processIncomingEmail } from './processIncomingEmail';

const imapConfig = {
  imap: {
    user: process.env.SMTP_EMAIL,
    password: process.env.SMTP_PASSWORD,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 3000,
    tlsOptions: { rejectUnauthorized: false },
  },
};

export const fetchEmails = async () => {
  try {
    const connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');

    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };

    const messages = await connection.search(searchCriteria, fetchOptions);

    for (const message of messages) {
      const email = await simpleParser(message.parts[0].body);
      await processIncomingEmail(email);
    }

    connection.end();
  } catch (error) {
    console.error('Error fetching emails:', error);
  }
};
