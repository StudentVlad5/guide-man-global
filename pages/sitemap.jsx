import { useTranslation } from "next-i18next";
import { Layout } from "../components/Layout";
import { PageNavigation } from "../components/PageNavigation";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";

import styles from '../styles/itemPage.module.scss'
import { getTitleOfPosts, getTitleOfServices } from "../helpers/firebaseControl";
import { useContext } from "react";
import { AppContext } from "../components/AppProvider";

export default function Sitemap ({ 
    servicesTitles,
    citizenshipTitles,
    newsTitles,
    explanationsTitles,
    questionsTitles,
 }) {

    const { t } = useTranslation();
    return (
        <Layout
          type='sitemap page'
          title={t('pageNavigation.sitemap')}
        >
          <div className="container">
            <PageNavigation />
          </div>
          <div className="page page-bigBottom">
            <div className="container">
            <h1 className={`page__title ${styles.itemPage__title}`}>
              {t('pageNavigation.sitemap')}
            </h1>
              <ul>
                <li className="firstLevel">
                  <Link href="/" className="linkWithUnderline" >
                  {t('pageNavigation.main')}
                  </Link>
                </li>
                <li className="firstLevel">
                  <Link href="/" className="linkWithUnderline" >
                  {t('navbar.services')}
                  </Link>
                  <ul> 
                    {servicesTitles.map(el => {
                      return (
                        <li className="secondLevel" key={el[2]}>  
                          {el[2] === 'lehalizatsiia-v-ukraini-hromadianstvo'
                          ? (
                            <>
                            <Link href="/services/citizenship" className="linkWithUnderline">
                              {el[0]}
                            </Link>
                            <ul>
                              {citizenshipTitles.map(e => {
                                return (
                                  <li className="thirdLevel" key={e[2]}>
                                    <Link href={`/services/citizenship/${e[2]}`} className="linkWithUnderline">
                                      {e[0]}
                                    </Link>
                                  </li>
                                )
                              })}
                            </ul>
                            </>
                          )
                          : (
                            <Link href={`/services/${el[2]}`} className="linkWithUnderline" >
                               {el[0]}
                            </Link>
                          )}
                         
                        </li>   
                      )
                    })}
                  </ul>
                </li>
                <li className="firstLevel">
                  <Link href="/chat" className="linkWithUnderline" >
                  {t('navbar.chat')}
                  </Link>
                </li>
                <li className="firstLevel">
                  <Link href="/about" className="linkWithUnderline" >
                  {t('navbar.about')}
                  </Link>
                </li>
                <li className="firstLevel">
                  <Link href="/news" className="linkWithUnderline" >
                  {t('navbar.news')}
                  </Link>
                  <ul> 
                    {newsTitles.map(el => {
                      return (
                        <li className="secondLevel" key={el[2]}>  
                         <Link href={`/news/${el[2]}`}    className="linkWithUnderline" >
                               {el[0]}
                            </Link>
                        </li>   
                      )
                    })}
                  </ul>
                </li>
                <li className="firstLevel">
                  <Link href="/explanations" className="linkWithUnderline" >
                  {t('navbar.explanations')}
                  </Link>
                  <ul> 
                    {explanationsTitles.map(el => {
                      return (
                        <li className="secondLevel" key={el[2]}>  
                         <Link href={`/explanations/${el[2]}`}    className="linkWithUnderline" >
                               {el[0]}
                            </Link>
                        </li>   
                      )
                    })}
                  </ul>
                </li>
                <li className="firstLevel">
                  <p>
                  {t('homePage.faq')}
                  </p>
                  <ul> 
                    {questionsTitles.map(el => {
                      return (
                        <li className="secondLevel" key={el[2]}>  
                         <Link href={`/questions/${el[2]}`}    className="linkWithUnderline" >
                               {el[0]}
                            </Link>
                        </li>   
                      )
                    })}
                  </ul>
                </li>
              </ul>
            
            </div>
        </div>

        </Layout>
    );
};

export async function getServerSideProps({ locale }) {   
    const servicesTitles = await getTitleOfServices(locale);
    const citizenshipTitles = await getTitleOfPosts('citizenship', locale);
    const newsTitles = await getTitleOfPosts('news', locale);
    const explanationsTitles = await getTitleOfPosts('explanations', locale);
    const questionsTitles = await getTitleOfPosts('questions', locale);
    return { props: {servicesTitles, citizenshipTitles, newsTitles, explanationsTitles, questionsTitles,
      ...await serverSideTranslations(locale, ['common'])
    } };
  }