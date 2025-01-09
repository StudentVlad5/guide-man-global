import { renderToStream } from '@react-pdf/renderer';

export const generatePDFBuffer = async Component => {
  const pdfStream = await renderToStream(Component);

  const chunks = [];
  return new Promise((resolve, reject) => {
    pdfStream.on('data', chunk => chunks.push(chunk));
    pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
    pdfStream.on('error', reject);
  });
};
