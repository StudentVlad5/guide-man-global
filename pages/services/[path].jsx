import { useTranslation } from 'next-i18next';
import { ItemPage } from '../../components/ItemPage';
import { PageNavigation } from '../../components/PageNavigation';
import { getCollectionWhereKeyValue } from '../../helpers/firebaseControl';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getRightData, getRightURL } from '../../helpers/rightData';
import { useRouter } from 'next/router';
import { Layout } from '../../components/Layout';
import { BASE_URL } from '../sitemap.xml';
import ErrorPage from '../404';

export default function ServiceItemPage ({ serviceItem }) {

  const { t }  = useTranslation();
  const { locale, pathname } = useRouter();

  return serviceItem[0] ? (
    <Layout
      type='serviceItem page'
      title={`${serviceItem[0].serviceType[locale]}: ${getRightData(serviceItem[0], locale, 'title')}`}
      desctiption={`${serviceItem[0].serviceType[locale]}: ${getRightData(serviceItem[0], locale, 'title')} - ${t('head.service.desc1')}${getRightData(serviceItem[0], locale, 'title')} - ${t('head.service.desc2')}`}
      script={`[
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": {
            "@type": "Question",
            "name": "${serviceItem[0].serviceType[locale]}: ${getRightData(serviceItem[0], locale, 'title')}",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "${getRightData(serviceItem[0], locale, 'text')}"
            }
        }
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
                    "@id": "${getRightURL(locale, pathname.split('/').slice(0, pathname.split('/').length - 1).join('/'))}",
                    "name": "${t('navbar.services')}"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "item":
                  {
                    "@id": "${getRightURL(locale, pathname.split('/').slice(0, pathname.split('/').length - 1).join('/'))}/${serviceItem[0].path}",
                    "name": "${serviceItem[0].serviceType[locale]}: ${getRightData(serviceItem[0], locale, 'title')}"
                  }
                }

              ]
          }]`}

    >
      <div className="container">
        <PageNavigation title={`${serviceItem[0].serviceType[locale]}: ${getRightData(serviceItem[0], locale, 'title')}`} />
      </div>
      <div className="page page-bigBottom">
        <div className="container">
          <ItemPage 
            buttonName={t('services.allServices')} 
            item={serviceItem[0]} 
            linkPath="/services"
          />
        </div>
      </div>
    </Layout>
  ) : <ErrorPage />;
};

export async function getServerSideProps({ params, locale, query }) {
  const serviceItem = await getCollectionWhereKeyValue('services', 'path', query.q ? query.q : params.path);
  return { props: { serviceItem,
    ...await serverSideTranslations(locale, ['common'])
  }};
}