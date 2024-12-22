import { useContext, useRef, useState } from 'react';

import Link from 'next/link';
import { useTranslation } from 'next-i18next';

import { PageNavLink } from './PageNavLink';

import styles from '../styles/navbar.module.scss';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { useWindowSize } from '../hooks/useWindowSize';
import { AppContext } from './AppProvider';

import LogoDark from '../public/logo_dark.svg';
import Cross from '../public/cross.svg';

import { auth } from '../helpers/firebaseControl';
import { signOut } from 'firebase/auth';

export const Navbar = ({ 
  style,
  handleMenu,  
  setHideOrSwow, 
  setIsOpenMenu 
}) => {

  const { t } = useTranslation();
  const { width } = useWindowSize();

  const refNavbar = useRef();
  useOnClickOutside(refNavbar, () => {
    if (width < 769) {
      setIsOpenMenu(false);
      setHideOrSwow(() => {
    return { transform: 'translateX(100%)'};
    })};
    }
  );
 
  const { user } = useContext(AppContext);

  const handleSignOut = () => {
    signOut(auth).then(() => {
      setUser(null);

    }).catch((error) => {
      console.log(error);
    });
  };

  return (
      <div className={styles.navbar} style={style} ref={refNavbar}>

        <div className={styles.navbar__container}>
       
          <div  className={`${styles.navbar__container__between} onMobile`} />
          <Link href="/">
            <LogoDark
              className="logo--header" onClick={handleMenu} />
          </Link>
          <Cross 
            className={`${styles.navbar__cross} onMobile`}
            onClick={handleMenu}
          />
        </div>

        
        <div className={styles.navbar__container}>
          
          <li className={styles.navbar__item} onClick={handleMenu}>
            <PageNavLink href="/services" text={t('navbar.services')} />
          </li>
          <li className={styles.navbar__item} onClick={handleMenu}>
            <PageNavLink href="/chat" text={t('navbar.chat')} />
          </li>
          <li className={styles.navbar__item} onClick={handleMenu}>
            <PageNavLink href="/explanations" text={t('navbar.explanations')} />
          </li>
          <li className={styles.navbar__item} onClick={handleMenu}>
            <PageNavLink href="/news" text={t('navbar.news')} />
          </li>
          <li className={styles.navbar__item} onClick={handleMenu}>
            
             <PageNavLink href="/about" text={t('navbar.about')} />
          </li>
        </div>

        <div className={`${styles.navbar__container} ${styles.navbar__container__large}`}>
          {!user ? (
            <li className={styles.navbar__item}>
              <PageNavLink href="/registration" text={t('navbar.register')} />
            </li>
          ) : (
            <li  className={styles.navbar__item}>
              <button 
                className={styles.navbar__logout}
                onClick={handleSignOut}
            >
              {t('logOut')}
            </button>
            </li>
            
          )}
          
          <li className={styles.navbar__item__account}>
            <Link 
              href="/account" 
              className={styles.navbar__link}
            >
              <p>{user ? t('navbar.account') : t('navbar.cabinet')}</p>  
            </Link>
          </li>
        </div>

        <div className={`${styles.navbar__container} ${styles.navbar__container__small}`}>

          <li className={styles.navbar__item} onClick={handleMenu}>
            <Link 
              href="/account" 
              className={styles.navbar__link}
            >
              <p>{user ?  t('navbar.account') : t('navbar.login')}</p> 
            </Link>
          </li>
          {!user ? (
            <li className={styles.navbar__item} onClick={handleMenu}>
            <Link 
              href="/registration"
              className={styles.navbar__link}
            >
              <p>{t('navbar.register_mobile')}</p> 
            </Link>
          </li>
          ) : (
            <li className={styles.navbar__item} onClick={handleMenu}>
            <button 
                className={styles.navbar__logout}
                onClick={handleSignOut}
            >
              {t('logOut')}
            </button>
          </li>
          )}
          
        </div>

      </div>
  );
};

