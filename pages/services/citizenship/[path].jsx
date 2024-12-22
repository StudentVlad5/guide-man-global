import { useTranslation } from 'next-i18next';
import { ItemPage } from '../../../components/ItemPage';
import { PageNavigation } from '../../../components/PageNavigation';
import { getCollectionWhereKeyValue } from '../../../helpers/firebaseControl';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getRightData, getRightURL } from '../../../helpers/rightData';
import { useRouter } from 'next/router';
import { Layout } from '../../../components/Layout';
import { BASE_URL } from '../../sitemap.xml';
import ErrorPage from '../../404';

export default function CitizenshipItemPage ({ citizenshipItem }) {

  const { t }  = useTranslation();
  const { locale, pathname } = useRouter();

  return citizenshipItem[0] ? (
    <Layout
      type='serviceItem page'
      title={getRightData(citizenshipItem[0], locale, 'title')}
      desctiption={`${getRightData(citizenshipItem[0], locale, 'title')} - ${t('head.service.desc1')}${getRightData(citizenshipItem[0], locale, 'title')} - ${t('head.service.desc2')}`}
      script={`[
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": {
            "@type": "Question",
            "name": "${getRightData(citizenshipItem[0], locale, 'title')}",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "${getRightData(citizenshipItem[0], locale, 'text')}"
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
                    "@id": "${getRightURL(locale, pathname.split('/').slice(0, pathname.split('/').length - 2).join('/'))}",
                    "name": "${t('navbar.services')}"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "item":
                  {
                    "@id": "${getRightURL(locale, pathname.split('/').slice(0, pathname.split('/').length - 1).join('/'))}",
                    "name": "${t('citizenship.button')}"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 4,
                  "item":
                  {
                    "@id": "${getRightURL(locale, pathname.split('/').slice(0, pathname.split('/').length - 1).join('/'))}/${citizenshipItem[0].path}",
                    "name": "${getRightData(citizenshipItem[0], locale, 'title')}"
                  }
                }

              ]
          }]`}
    >
      <div className="container">
        <PageNavigation title={getRightData(citizenshipItem[0], locale, 'title')} />
      </div>
      <div className="page page-bigBottom">
        <div className="container">
          <ItemPage 
            buttonName={t('services.allServices')} 
            item={citizenshipItem[0]} 
            linkPath="/services"
          />
        </div>
      </div>
    </Layout>
  ) : <ErrorPage/> ;
};

export async function getServerSideProps({ params, locale, query }) {
  const citizenshipItem = await getCollectionWhereKeyValue('citizenship', 'path', query.q ? query.q : params.path);
  return { props: { citizenshipItem,
    ...await serverSideTranslations(locale, ['common'])
  }};
}