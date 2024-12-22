import { useTranslation } from 'next-i18next';
import { ItemPage } from '../../components/ItemPage';
import { PageNavigation } from '../../components/PageNavigation';
import { getCollectionWhereKeyValue } from '../../helpers/firebaseControl';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getRightData, getRightURL } from '../../helpers/rightData';
import { useRouter } from 'next/router';
import { Layout } from '../../components/Layout';

import { BASE_URL } from '../sitemap.xml';
import { useEffect } from 'react';
import ErrorPage from '../404';

export default function NewsItemPage ({ newItem }) {
  const { t }  = useTranslation();
  const { locale, pathname } = useRouter();

  return newItem[0] ? (
    
    <Layout
      type='news page'
      title={getRightData(newItem[0], locale, 'title')}
      desctiption={`${t('head.news.new')} ${getRightData(newItem[0], locale, 'title')} ${t('head.news.inSite')}`}
      script={`[
        {
          "@context": "http://schema.org",
          "@type": "Article",
          "name": "${getRightData(newItem[0], locale, 'title')}",
          "author": "Global Guide Service",
          "articleBody": "${getRightData(newItem[0], locale, 'text')}",
          "description": "${getRightData(newItem[0], locale, 'preview')}",
          "about": "${t('microdatas.newsAbout')}",
          ${newItem[0].image.length > 0 && `"image": "${newItem[0].image}"`},
          "dateModified": "${newItem[0].dateCreating}"
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
                    "name": "${t('navbar.news')}"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "item":
                  {
                    "@id": "${getRightURL(locale, pathname.split('/').slice(0, pathname.split('/').length - 1).join('/'))}/${newItem[0].path}",
                    "name": "${getRightData(newItem[0], locale, 'title')}"
                  }
                }

              ]
          }]`}

    >
      <div className="container">
        <PageNavigation title={getRightData(newItem[0], locale, 'title')} />
      </div>
      <div className="page page-bigBottom">
        <div className="container">
          <ItemPage 
            buttonName={t('newsPage.button')} 
            item={newItem[0]} 
            linkPath="/news"
          />
        </div>
      </div>
    </Layout>
  ) : <ErrorPage />;
};

export async function getServerSideProps({ params, locale, query }) {

  const newItem = await getCollectionWhereKeyValue('news', 'path', query.q ? query.q : params.path);
 
  return { props: { newItem,
    ...await serverSideTranslations(locale, ['common'])
  }};
}