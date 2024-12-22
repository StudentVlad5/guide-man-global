import { PageNavigation } from '../../components/PageNavigation';

import { NewsItem } from '../../components/NewsItem';
import { getCollection } from '../../helpers/firebaseControl';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import styles from '../../styles/newsPage.module.scss';
import { Layout } from '../../components/Layout';
import { useTranslation } from 'next-i18next';
import { BASE_URL } from '../sitemap.xml';
import { getRightURL, getRightData } from '../../helpers/rightData';
import { useRouter } from 'next/router';

export default function CitizenshipPage ( { citizenship }) {

  const { t } = useTranslation();
  const { locale, pathname } = useRouter();

  return (
    <Layout
      type='service page'
      desctiption={`⭐${t('citizenship.button')}⭐ ${t('head.home.description')}`  }
      h1={t('citizenship.button')}
      script={`[
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
                    "@id": "${getRightURL(locale, pathname.split('/').slice(0, pathname.split('/').length - 1).join('/'))}",
                    "name": "${t('navbar.services')}"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "item":
                  {
                    "@id": "${getRightURL(locale, pathname)}",
                    "name": "${t('citizenship.button')}"
                  }
                }
              ]
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              ${citizenship.filter(el => el.id !== '147406030952').map(el => {
                return (
                   `{
              "@type": "Question",
              "name": "${getRightData(el, locale, 'title')}",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "${getRightData(el, locale, "text").slice(0, 250) + '...'}"
              }
            }`
                )
              })}
             ]
          }
        ]`}
    >
      <div className="container">
        <PageNavigation />
      </div>

      <div className="page page-bigBottom">
        <div className="container">
          <div className={styles.newsPage}>
            {citizenship.map(el => {
              return (
                
                <NewsItem item={el} key={el.id} />
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export async function getStaticProps({ locale }) {

    const citizenship = await getCollection('citizenship');
    return { props: { citizenship,
      ...await serverSideTranslations(locale, ['common'])
    },
  revalidate: 10,
   };
}