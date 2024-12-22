import Head from 'next/head';
import { appWithTranslation } from 'next-i18next';
import NextNProgress from 'nextjs-progressbar';

require('dotenv').config();
import '../styles/global.scss';
import { AppProvider } from '../components/AppProvider';

function MyApp({ Component, pageProps }) {
   
    return (
      <AppProvider>
        <Head>
		      <link rel='icon' href="/favicon.ico" />
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
    )
  }

  export default appWithTranslation(MyApp);