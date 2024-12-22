import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { PageNavigation } from '../components/PageNavigation';

import { ServisesDropdown } from '../components/ServisesDropdown';
import { ServisesButton } from '../components/ServisesButton';
import { getRightData, getRightURL } from '../helpers/rightData';

import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Layout } from '../components/Layout';

import Menu from '../public/menu.svg';
import Control from '../public/control.svg';
import Muto from '../public/muto.svg';
import Ban from '../public/ban.svg';
import Ukr from '../public/ukr.svg';
import Earth from '../public/earth.svg';
import Dep from '../public/dep.svg';
import Leg from '../public/leg.svg';
import Doc from '../public/doc.svg';
import Monitor from '../public/monitor.svg';

import styles from '../styles/servicesPage.module.scss';
import { getCollection } from '../helpers/firebaseControl';

import { BASE_URL } from './sitemap.xml';

export default function Services({ services }) {
  const { t }  = useTranslation();
  const { locale, pathname } = useRouter();


  const borderControl = services
    .filter(service => service.serviceType[locale] === (
      t('services.borderControl')
    )).map(service => [getRightData(service, locale, "title"), service.path]);

  const customControl = services
    .filter(service =>service.serviceType[locale] === (
      t('services.customControl')
    )).map(service => [getRightData(service, locale, "title"), service.path]);

  const entryBan = services
    .filter(service => service.serviceType[locale] === (
      t('services.ban')
    )).map(service => [getRightData(service, locale, "title"), service.path]);

  const deportation = services
    .filter(service => service.serviceType[locale] === (
      t('services.deportation')
    )).map(service => [getRightData(service, locale, "title"), service.path]);
  
  const legalization = services
    .filter(service => service.serviceType[locale] === (
      t('services.legalization')
    )).map(service => [getRightData(service, locale, "title"), service.path]);

  const docService = services
    .filter(service => service.serviceType[locale] === (
      t('services.document')
    )).map(service => [getRightData(service, locale, "title"), service.path]);

  const monitoring = services
    .filter(service => service.serviceType[locale] === (
      t('services.monitoring')
    )).map(service => [getRightData(service, locale, "title"), service.path]);

  const [isAllButtons, setIsAllButtons] = useState(false);
  const [filter, setFilter] = useState(t('services.allServices'));

  const openAllButtons = () => {
    setIsAllButtons(!isAllButtons);
  };

  const changeFilter = (title) => {
    setFilter(title);
    openAllButtons();
  };

  useEffect (() => {
    setFilter(t('services.allServices'));
  }, [t]);  

  return (
    <Layout
      type='service page'
      desctiption={`⭐${t('navbar.services')}⭐ ${t('head.home.description')}`  }
      h1={t('navbar.services')}
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
                    "@id": "${getRightURL(locale, pathname)}",
                    "name": "${t('navbar.services')}"
                  }
                }
              ]
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              ${services.filter(el => el.id !== '147406030952').map(el => {
                return (
                   `{
              "@type": "Question",
              "name": "${el.serviceType[locale]}: ${getRightData(el, locale, 'title')}",
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
        <PageNavigation pageType={'servises'}/>
      </div>
      
      <div className="page page-bigBottom">
        <div className="container">
          <div className={styles.servisesPage__content}>
            <div className={styles.servisesPage__section}>
              <ServisesButton 
                Img={Menu} 
                title={filter}
                
                onClick={openAllButtons}
              />
              {(isAllButtons && filter === t('services.allServices')) && (
                <>
                  <ServisesButton 
                    Img={Ukr}  
                    title={t('services.citizens')} 
                    onClick={() => changeFilter(t('services.citizens'))}
                  />
                  <ServisesButton 
                    Img={Earth}  
                    title={t('services.foreigners')}
                    onClick={() => changeFilter(t('services.foreigners'))}
                  />
                </>
              )}
              
              {(isAllButtons && filter === t('services.foreigners')) && (
                <>
                  <ServisesButton 
                    Img={Ukr} 
                    title={t('services.citizens')} 
                    onClick={() => changeFilter(t('services.citizens'))}
                  />
                  <ServisesButton 
                    Img={Menu}
                    title={t('services.allServices')}
                    onClick={() => changeFilter(t('services.allServices'))}
                  />
                </>
              )}

              {(isAllButtons && filter === t('services.citizens')) && (
                <>
                  <ServisesButton 
                    Img={Earth}
                    title={t('services.foreigners')} 
                    onClick={() => changeFilter(t('services.foreigners'))}
                  />
                  <ServisesButton 
                    Img={Menu} 
                    title={t('services.allServices')} 
                    onClick={() => changeFilter(t('services.allServices'))}
                  />
                </>
              )}
            </div>

            <div className={styles.servisesPage__section}>

              <ServisesDropdown 
                Img={Control}
                title={t('services.borderControl')}
                values={borderControl}
              />

              <ServisesDropdown 
                Img={Muto}
                title={t('services.customControl')}
                values={customControl}
              />

              {filter !== t('services.citizens') && (
                <ServisesDropdown 
                Img={Ban} 
                  title={t('services.ban')}
                  values={entryBan}
                />
              )}
              
              {filter !== t('services.citizens') && (
                <ServisesDropdown 
                  Img={Dep}
                  title={t('services.deportation')}
                  values={deportation}
                />
              )}
            </div>

             <div className={styles.servisesPage__section}>
              {filter !== t('services.citizens') && (
                <ServisesDropdown 
                  Img={Leg}
                  title={t('services.legalization')}
                  values={legalization}
                />
              )}
              

              <ServisesDropdown 
                Img={Doc} 
                title={t('services.document')}
                values={docService}
              />

              <ServisesDropdown 
                Img={Monitor}
                title={t('services.monitoring')}
                values={monitoring}
              />
            </div>
          </div>
        </div>
      </div>
      </Layout>
  );
};

export async function getStaticProps({ locale }) {

  const services = await getCollection('services');
  return { props: { services,
    ...await serverSideTranslations(locale, ['common'])
  },
  revalidate: 10,
 };
};