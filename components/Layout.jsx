import Head from "next/head";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useTranslation } from 'next-i18next';

import styles from '../styles/layout.module.scss'; 

export const Layout = ({ children, title, type, desctiption, h1, script }) => {
  const { t }  = useTranslation();
  const titleExpression = () => {
    switch (type) {
      case 'home': 
        return `Global Guide Service - ${title}`;

      case 'service page':
        return h1 ? `${h1} • Global Guide Service` : `${title} • Global Guide Service`;

      case 'news page':
        return `${title} • ${t('head.news.new')} Global Guide Service`;

      case 'post page':
        return `${title} • ${t('head.post.title')} Global Guide Service`;

      case 'serviceItem page':
        return `${title} • ${t('head.service.title')} | Global Guide Service`;

      default: 
        return `${title} | Global Guide Service`;
    } 
  };

  const addJsonLd = () => {
    return {
      __html: script,
    }
  };
  
    return (
        <>
            <Head>
                <title>{titleExpression()}
                </title>
                {type !== 'sitemap page' &&
                 <meta name="description" content={desctiption} />
                }
               
                {type === 'sitemap page' && 
                <meta name="robots" content="noindex, follow, noarchive" />
                }
                {script && (
                  <script 
                    type="application/ld+json" 
                    dangerouslySetInnerHTML={addJsonLd()}
                />
                )}
                 
            </Head>
            <Header />
            <main>
              <h1 className={styles.layout__title}>{h1}</h1>
              {children}
            </main>
            <Footer />
        </>
    );
};
