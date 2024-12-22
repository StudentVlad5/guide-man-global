import { useTranslation } from 'next-i18next';
import { Explanation } from '../components/Explanation';
import { PageNavigation } from '../components/PageNavigation';

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Layout } from '../components/Layout';

import styles from '../styles/homePage.module.scss';
import { getCollection } from '../helpers/firebaseControl';
import { getRightURL } from '../helpers/rightData';

import { BASE_URL } from './sitemap.xml';
import { useRouter } from 'next/router';

export default function ExplanationsPage ({  explanations }) {

  const { t }  = useTranslation();
  const { locale, pathname } = useRouter();
  

  return (
    <Layout
      type='service page'
      title={t('navbar.explanations')}
      desctiption={`⭐${t('navbar.explanations')}⭐ ${t('head.home.description')}`}
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
                    "name": "${t('navbar.explanations')}"
                  }
                }
              ]
          }`}
    >
      <div className="container">
        <PageNavigation />
      </div>

      <div className="page"> 
        <div className="container">
          <h1 className="page__title page__titleWithBottom">
            {t('explanations.explanations')}
          </h1>
          <div className={styles.homePage__explanation}>
            
            {explanations.map(explanation => 
              <Explanation 
                item={explanation}
                key={explanation.id}
              />
            )}
          </div>
          
        </div>
      </div>
    </Layout>
  );
};

export async function getStaticProps({ locale }) {
  const explanations = await getCollection('explanations');
	return {
		props: { explanations,
			...(await serverSideTranslations(locale, ['common'])),
		},
    revalidate: 10,
	}
}