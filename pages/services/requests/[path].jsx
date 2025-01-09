import { useTranslation } from 'next-i18next';
import { PageNavigation } from '../../../components/PageNavigation';
import { getCollectionWhereKeyValue } from '../../../helpers/firebaseControl';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getRightData, getRightURL } from '../../../helpers/rightData';
import { useRouter } from 'next/router';
import { Layout } from '../../../components/Layout';
import { BASE_URL } from '../../sitemap.xml';
import ErrorPage from '../../404';
import LawyersRequestPage from './requestPage';

export default function RequestItemPage({ requestItem }) {
  const { t } = useTranslation();
  const { locale, pathname } = useRouter();

  return requestItem[0] ? (
    <Layout
      type="requestItem page"
      title={`${requestItem[0].requestType[locale]}: ${getRightData(
        requestItem[0],
        locale,
        'title'
      )}`}
      desctiption={`${requestItem[0].requestType[locale]}: ${getRightData(
        requestItem[0],
        locale,
        'title'
      )} - ${t('head.request.desc1')}${getRightData(
        requestItem[0],
        locale,
        'title'
      )} - ${t('head.request.desc2')}`}
      script={`[
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": {
            "@type": "Question",
            "name": "${requestItem[0].requestType[locale]}: ${getRightData(
        requestItem[0],
        locale,
        'title'
      )}",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "${getRightData(requestItem[0], locale, 'text')}"
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
                    "@id": "${getRightURL(
                      locale,
                      pathname
                        .split('/')
                        .slice(0, pathname.split('/').length - 1)
                        .join('/')
                    )}",
                    "name": "${t('navbar.requests')}"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "item":
                  {
                    "@id": "${getRightURL(
                      locale,
                      pathname
                        .split('/')
                        .slice(0, pathname.split('/').length - 1)
                        .join('/')
                    )}/${requestItem[0].path}",
                    "name": "${
                      requestItem[0].requestType[locale]
                    }: ${getRightData(requestItem[0], locale, 'title')}"
                  }
                }

              ]
          }]`}
    >
      <div className="container">
        <PageNavigation
          title={`${requestItem[0].requestType[locale]}: ${getRightData(
            requestItem[0],
            locale,
            'title'
          )}`}
        />
      </div>
      <div className="page page-bigBottom">
        <div className="container">
          <LawyersRequestPage
            buttonName={t('requests.allRequests')}
            item={requestItem[0]}
            linkPath="/services/requests"
          />
        </div>
      </div>
    </Layout>
  ) : (
    <ErrorPage />
  );
}

export async function getServerSideProps({ params, locale, query }) {
  const requestItem = await getCollectionWhereKeyValue(
    'requests',
    'path',
    query.q ? query.q : params.path
  );
  return {
    props: {
      requestItem,
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
