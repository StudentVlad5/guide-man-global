import Link from 'next/link';
import { useTranslation } from 'next-i18next';

import { useRouter } from 'next/router';

import styles from '../styles/pageNavigation.module.scss'; 

export const PageNavigation = ({ title }) => {
  const { pathname, query } = useRouter();
  const { t }  = useTranslation();

  const pathnames = pathname.split('/').filter(el => el);

  return (
    <ul className={styles.pageNavigation}>
      <li>
        <Link href="/">
          <p>{t(t('pageNavigation.main'))}</p> 
        </Link>
      </li>

      {pathnames.map((el, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const currentLocation = () => {
          switch (el) {
          case 'services':
            return t('navbar.services');

          case 'chat':
            return t('navbar.chat');

          case 'news':
            return t('navbar.news');

          case 'about':
            return t('navbar.about');

          case  'explanations':
            return t('navbar.explanations');

          case 'citizenship':
            return t('citizenship.button');

          case 'sitemap':
            return t('pageNavigation.sitemap');

          default:
            return ;
          }
        };
        return isLast ? (
          <li key={pathname + index}>
            <p>{' / '}</p>
            <p className={styles.pageNavigation__navigation}>
              {Object.values(query).length !== 0 ? `${title}` : `${currentLocation()}`}
            </p>
          </li>
        ) : (currentLocation() ? (
           <li key={pathname + index}>
            <p>
              <Link  href={routeTo}>
                {`/ ${currentLocation()}`}
              </Link>
            </p>
          </li> 
        ) : <></>);
      })}
    </ul>
  );
};