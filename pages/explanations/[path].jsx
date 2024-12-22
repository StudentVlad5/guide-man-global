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

export default function ExplanationItemPage ({ explanationItem }) {

  const { t }  = useTranslation();
  const { locale, pathname } = useRouter();

  return explanationItem[0] ? (
    <Layout
      type='post page'
      title={getRightData(explanationItem[0], locale, 'title')}
      desctiption={`${t('head.post.desc')} ${getRightData(explanationItem[0], locale, 'title')} ${t('head.news.inSite')}`}
      script={`[
        {
          "@context": "http://schema.org",
          "@type": "Article",
          "name": "${getRightData(explanationItem[0], locale, 'title')}",
          "author": "Global Guide Service",
          "articleBody": "${getRightData(explanationItem[0], locale, 'text')}",
          "description": "${getRightData(explanationItem[0], locale, 'preview')}",
          "about": "${t('microdatas.explanationsAbout')}",
          "image": "${explanationItem[0].image}",
          "dateModified": "${explanationItem[0].dateCreating}"
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
                    "name": "${t('navbar.explanations')}"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "item":
                  {
                    "@id": "${getRightURL(locale, pathname.split('/').slice(0, pathname.split('/').length - 1).join('/'))}/${explanationItem[0].path}",
                    "name": "${getRightData(explanationItem[0], locale, 'title')}"
                  }
                }

              ]
          }]`}

    >
      <div className="container">
        <PageNavigation title={getRightData(explanationItem[0], locale, 'title')} />
      </div>
      <div className="page page-bigBottom">
        <div className="container">
          <ItemPage 
            buttonName={t('explanations.allExplanations')} 
            item={explanationItem[0]} 
            linkPath="/explanations"
          />
        </div>
      </div>
    </Layout>
  ) : <ErrorPage /> ;
};

export async function getServerSideProps({ params, locale, query }) {
  const explanationItem = await getCollectionWhereKeyValue('explanations', 'path', query.q ? query.q : params.path);
  return { props: { explanationItem,
    ...await serverSideTranslations(locale, ['common'])
  }};
}