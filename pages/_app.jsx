import Head from 'next/head';
import i18n from 'i18next';
import { appWithTranslation } from 'next-i18next';
import { initReactI18next } from 'react-i18next';
import nextI18NextConfig from '../next-i18next.config.js';
import NextNProgress from 'nextjs-progressbar';

require('dotenv').config();
import '../styles/global.scss';
import { AppProvider } from '../components/AppProvider';

i18n.use(initReactI18next).init(nextI18NextConfig);

function MyApp({ Component, pageProps }) {
  return (
    <AppProvider>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <NextNProgress
        color="#000"
        startPosition={0.3}
        stopDelayMs={200}
        height={3}
        showOnShallow={true}
      />
      <Component {...pageProps} />
    </AppProvider>
  );
}

export default appWithTranslation(MyApp);
