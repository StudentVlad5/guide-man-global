import { useMemo, useState, useEffect, useContext } from 'react';
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Layout } from "../components/Layout";
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { BannerDropdown } from '../components/BannerDropdown';
import { DropdownWithText } from '../components/DropdownWithText';
import { useRouter } from 'next/router';

import styles from '../styles/banner.module.scss'; 
import stylesHome from '../styles/homePage.module.scss'; 
import { getCollection } from '../helpers/firebaseControl';

import Separator from '../public/separator.svg';

import { BASE_URL } from './sitemap.xml';

import { getRightData } from '../helpers/rightData';

import { ButtonUp } from '../components/ButtonUp';
import { NewsItem } from '../components/NewsItem';
import { AppContext } from '../components/AppProvider';

export default function HomePage({ questions, news }) {
  const { servicesArray } = useContext(AppContext);

	const [filterValue, setFilterValue] = useState({
		serviceType: '',
		service: '',
	  });

	  const { t }  = useTranslation();
	  const { locale } = useRouter();

    const router = useRouter();

    console.log(filterValue);
	
	  const valuesServiceType =  [
			t('services.borderControl'),
			t('services.customControl'),
			t('services.ban'),
			t('services.deportation'),
			t('services.legalization'),
			t('services.document'),
			t('services.monitoring'),
		  ];
	
	  const valuesService = filterValue.serviceType.length > 0 
    ? servicesArray.filter(el => el[0].includes(filterValue.serviceType)).map(el => el[0].split(':')[1])
    : [];
	
	  useEffect(() => {

		setFilterValue({
		  serviceType: '',
		  service: '',
		});
	  }, [locale]);

  const handleTransition = () => {
    const path = servicesArray.find(el => el[0].includes(filterValue.serviceType) && el[0].includes(filterValue.service))[2];
    router.push(`/services/${path}`);
  }

	return (
	  <Layout 
      type='home'
      title={t('head.home.title')}
      desctiption={t('head.home.description')}
      h1={t('head.home.h1')}
      script={`
        [
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "url": "${BASE_URL}",
            "logo": "${BASE_URL}/logo_dark.svg"
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "url": "${BASE_URL}",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "${BASE_URL}/search?q={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          }, 
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              ${questions.map(el => {
                return (
                   `{
              "@type": "Question",
              "name": "${getRightData(el, locale, 'title')}",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "${getRightData(el, locale, "preview")}"
              }
            }`
                )
              })}
             ]
          }
        ]`}
    >
      <div className={styles.banner}>
        <div className="container">
          <h2 className={styles.banner__title}>
            {t('homePage.banner.h1')}
          </h2>
          <div className={styles.banner__dropdowns}>
            <div className={styles.banner__label}>
              <div className={styles.banner__label__title}>
                {t('homePage.banner.label_title2')}
              </div>
              <BannerDropdown
                title={t('homePage.banner.bannerDropdown.title2')}
                values={valuesServiceType}
                dropdownValue={filterValue.serviceType}
                setDropdownValue={(e) =>
                  setFilterValue({...filterValue, serviceType: e})}
              />
            </div>

            <div className={styles.banner__label}>
              <div className={styles.banner__label__title}>
                {t('homePage.banner.label_title1')}
              </div>
              <BannerDropdown
                title={t('homePage.banner.bannerDropdown.title1')}
                values={valuesService}
                dropdownValue={filterValue.service}
                setDropdownValue={(e) =>
                  setFilterValue({...filterValue, service: e})}
              />
            </div>
            <div className={`${styles.banner__label} onDesktop`}> 
            <div className={`${styles.banner__label__title} ${styles.banner__label__title__tulp}`}>fgds</div>
              <button className={`button ${styles.banner__button}`} onClick={handleTransition}  >
                <p>{t('homePage.banner.go')}</p>
              </button>
            </div>

            <button className={`button ${styles.banner__button} onMobile`} onClick={handleTransition} >
                <p>{t('homePage.banner.go')}</p>
              </button>
            
          </div>
        </div>
      </div>
      <div className={stylesHome.homePage}>
        <div className="page">
          <section className="container">
          
            <div className={`${stylesHome.homePage__title}`}>
              <h3 className="page__title">{t('homePage.faq')}</h3>
            </div>
            <div className={stylesHome.homePage__questions}>
              {questions.slice(0, 5).map(question => 
                <DropdownWithText
                  item={question}
                  key={question.id} 
                />
              )}

            </div>
          </section>
        </div>
        <div className="separator onDesktop">
          <Separator/> 
        </div>
        <div className="page"> 
          <section className="container">
            <div className={`${stylesHome.homePage__title} page__title-with-extension`}>
              <h3 className="page__title">{t('navbar.news')}</h3>
              <button className="button-extension onDesktop">
                <Link href="/news">
                  <p>{t('newsPage.button')}</p>
                </Link>
              </button>
            </div>
            <div className={stylesHome.homePage__explanation}>

            {news.slice(0, 6).map(el => {
              return (
                <NewsItem item={el} key={el.id} isNews={true} />
              );
            })}

              <button className={`button onMobile ${stylesHome.homePage__allButton}`}>
                <Link href="/news">
                  <p>{t('newsPage.button')}</p>
                </Link>
              </button>
            </div>
          
          </section>
        </div>
      </div>
       <ButtonUp />
	</Layout>
 
	);
}

export async function getStaticProps({ locale }) {

  const questions = await getCollection('questions');
  const news = await getCollection('news');
  return { props: { questions, news,
    ...await serverSideTranslations(locale, ['common'])
  },
  revalidate: 10,
 };
}
