import Link from 'next/link';
import { useTranslation } from 'next-i18next';

import { getRightData, rightTitle } from '../helpers/rightData';
import { useRouter } from 'next/router';

import styles from '../styles/explanation.module.scss'; 

export const Explanation = ({ item }) => {
  const { pathname, locale }= useRouter();
  const { t }  = useTranslation();


  return (
    <div className={styles.explanation}>
      <div className={`page__title-2 ${styles.explanation__title}`}>
        {getRightData(item, locale, 'title')}
      </div>
      <div className={styles.explanation__text}>
        {getRightData(item, locale, 'preview')}
      </div>
      <button className={`button ${styles.explanation__button}`}>
        <Link 
          href={`/explanations/${item.path}`} >
          <p>{t('explanations.readMore')}</p>
        </Link>
      </button>
      
    </div>
  );
};