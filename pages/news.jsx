import { PageNavigation } from '../components/PageNavigation';
import { NewsItem } from '../components/NewsItem';

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Layout } from '../components/Layout';
import { useTranslation } from 'next-i18next';

import styles from '../styles/newsPage.module.scss';
import { getCollection } from '../helpers/firebaseControl';

import { BASE_URL } from './sitemap.xml';
import { useRouter } from 'next/router';
import { getRightURL } from '../helpers/rightData';

export default function NewsPage ({ news }) {
  const { t }  = useTranslation();

  const { locale, pathname } = useRouter();

  return (
    <Layout
      type='service page'
      desctiption={`⭐${t('navbar.news')}⭐ ${t('head.home.description')}`  }
      h1={t('navbar.news')}
      script={`
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
                    "name": "${t('navbar.news')}"
                  }
                }
              ]
          }`}
    >
      <div className="container">
        <PageNavigation />
      </div>

      <div className="page page-bigBottom">
        <div className="container">
          <div className={styles.newsPage}>
            {news.map(el => {
              return (
                <NewsItem item={el} key={el.id} isNews={true} />
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};


export async function getStaticProps({ locale }) {

  const news = await getCollection('news');
  return { props: { news,
    ...await serverSideTranslations(locale, ['common'])
  },
  revalidate: 10,
 };
}