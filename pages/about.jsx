import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { PageNavigation } from '../components/PageNavigation';

import aboutPage from '../api/aboutPage.json';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Layout } from '../components/Layout';

import styles from '../styles/itemPage.module.scss';
import { getRightData } from '../helpers/rightData';

import { BASE_URL } from './sitemap.xml';

import { getRightURL } from '../helpers/rightData';
import { ButtonUp } from '../components/ButtonUp';

export default function AboutPage () {
  const { t }  = useTranslation();

  const { locale, pathname } = useRouter();
  const router = useRouter();

  console.log(router);

  
  return (
    <Layout
      type='service page'
      title={t('navbar.about')}
      desctiption={`⭐${t('navbar.about')}⭐ ${t('head.home.description')}`}
      script={`[
      {
        "@context": "http://schema.org",
        "@type": "Article",
        "name": "${getRightData(aboutPage, locale, 'title')}",
        "author": "Global Guide Service",
        "articleBody": "${getRightData(aboutPage, locale, 'text')}"
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
                  "name": "${t('navbar.about')}"
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
              {getRightData(aboutPage, locale, "title")}
            </h1>
            <article 
              className={styles.itemPage__text}
              dangerouslySetInnerHTML={{ __html:  getRightData(aboutPage, locale, 'text')}}
            />
          </div>
          <button className="button-extension button-extension--down">
            <Link href="/news">
              <p>{t('newsPage.button')}</p>
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