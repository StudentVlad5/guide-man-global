import PropTypes from 'prop-types';

import Link from 'next/link';

import { useTranslation } from 'next-i18next';
import { getRightData } from '../helpers/rightData';
import { useRouter } from 'next/router';
import Image from 'next/image';

import styles from '../styles/newsItem.module.scss';

export const NewsItem = ({ item, isNews }) => {
  const { t }  = useTranslation();
  const { locale } = useRouter();

  return (
    <>
      <div className={`${styles.newsItem} onDesktop`}>
         {item.image.length > 0 && (
        <div className={styles.newsItem__img}>
            <Image 
              title={`Image for information article | image-${item[locale].title}`}
              src={item.image} 
              alt={`Article - globalguide.com | image-${item[locale].title}`}
              width={575}
              height={170}
              priority
            />
        </div>
        )}
        <div className={styles.newsItem__body}>
          <div className={`page__title-2 ${styles.newsItem__title}`}>
            {getRightData(item, locale, 'title')}
          </div>
          <p className={styles.newsItem__text}>
            {getRightData(item, locale, 'preview')}
          </p>
          <button className={`button ${styles.newsItem__button} onDesktop`}>
            {isNews ? (
              <Link 
              href='/news/[path]' as={`/news/${item.path}`}
            >
              <p>{t('explanations.readMore')}</p>
            </Link>
            ) : (
              <Link 
              href='/services/citizenship/[path]' as={`/services/citizenship/${item.path}`}
            >
              <p>{t('explanations.readMore')}</p>
            </Link>
            )}
            
          </button>
        </div>


      </div>
      
      
      <div className={`${styles.newsItem} onMobile`}>
      {isNews ? (
        <Link
        href={'/news/[path]'} as={`/news/${item.path}`}
      >
        {item.image.length > 0 && 
       <div className={styles.newsItem__img}>
         
          <Image
            src={item.image} 
            alt="img" 
            width={320}
            height={160}
            priority
          />
       </div>
        }
       <div className={styles.newsItem__body}>
         <div className={`page__title-2 ${styles.newsItem__title}`}>
           {getRightData(item, locale, 'title')}
         </div>
         <p className={styles.newsItem__text}>
         {getRightData(item, locale, 'preview')}
         </p>
       </div>
     </Link>
      ) : (
        <Link
          href='/services/citizenship/[path]' as={`/services/citizenship/${item.path}`}
         >
        {item.image.length > 0 && 
          <div className={styles.newsItem__img}>
            
            <Image
              src={item.image} 
              alt="img" 
              width={320}
              height={160}
              priority
          />
          </div>
        }
          <div className={styles.newsItem__body}>
            <div className={`page__title-2 ${styles.newsItem__title}`}>
              {getRightData(item, locale, 'title')}
            </div>
            <p className={styles.newsItem__text}>
            {getRightData(item, locale, 'preview')}
            </p>
          </div>
        </Link>
      )}
      </div>
    
    </>
  );
};

NewsItem.propType = {
  newsItem: PropTypes.object.isRequired,
};