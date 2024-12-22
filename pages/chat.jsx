import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { PageNavigation } from '../components/PageNavigation';

import chatPage from '../api/chatPage.json';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Layout } from '../components/Layout';

import styles from '../styles/itemPage.module.scss';
import { getRightData } from '../helpers/rightData';
import { BASE_URL } from './sitemap.xml';

import { getRightURL } from '../helpers/rightData';
import { ButtonUp } from '../components/ButtonUp';

export default function ChatPage () {
  const { t }  = useTranslation();

  const { locale, pathname } = useRouter();
  
  return (
    <Layout
      type='service page'
      title={t('navbar.chat')}
      desctiption={`⭐${t('navbar.chat')}⭐ ${t('head.home.description')}`}
      script={`[
        {
          "@context": "http://schema.org",
          "@type": "Article",
          "name": "${getRightData(chatPage, locale, 'title')}",
          "author": "Global Guide Service",
          "articleBody": "${getRightData(chatPage, locale, 'text')}"
        },
        {
            "@context": "http://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement":
              [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "item":
                  {
                    "@id": "${BASE_URL}",
                    "name": "${t('pageNavigation.main')}"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "item":
                  {
                    "@id": "${getRightURL(locale, pathname)}",
                    "name": "${t('navbar.chat')}"
                  }
                }
              ]
          }]`}
    >
      <div className="container">
        <PageNavigation />
      </div>
      
      <div className="page">
        <div className="container">
          <div className={styles.itemPage}>
            <h1 className={`page__title ${styles.itemPage__title}`}>
              {getRightData(chatPage, locale, 'title')}
            </h1>
            <article 
              className={styles.itemPage__text}
              dangerouslySetInnerHTML={{ __html:  getRightData(chatPage, locale, 'text')}}
            />
          </div>
          <button className="button-extension  chatPage__button">
            <Link href="/">
              <p>{t('chatPage.button')}</p>
            </Link>
          </button>
        </div>
      </div>
      <ButtonUp />
    </Layout>
  );
};

export async function getStaticProps({ locale }) {
	return {
		props: {
			...(await serverSideTranslations(locale, ['common'])),
		},
	}
}