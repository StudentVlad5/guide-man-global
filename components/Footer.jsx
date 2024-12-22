import Link from 'next/link';

import { useTranslation } from 'next-i18next';

import LogoWhite from '../public/logo_white.svg';
import Fb from '../public/fb.svg';
import Insta from '../public/insta.svg';
import Tg from '../public/tg.svg';
import Mail from '../public/mail.svg';

import styles from '../styles/footer.module.scss';

export const Footer = () => {
  const { t }  = useTranslation();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footer__content}>
          <section className={styles.footer__section}>
            <Link href="/">
              <LogoWhite
                alt="logo" 
                className={`${styles.footer__logo} logo--footer`} />
            </Link>
            
            <p className={styles.footer__text}>
            {t('footer.content')}
            </p>
          </section>
          <section className={`${styles.footer__section} ${styles.footer__section__2}`}>
            <Link href="/" className={styles.footer__link}>
              {t('pageNavigation.main')}
            </Link>
            <Link href="/services" className={styles.footer__link}>
              {t('navbar.services')}
            </Link>
            <Link href="/sitemap" className={styles.footer__link}>
              {t('pageNavigation.sitemap')}
            </Link>
          </section>
          <section className={`${styles.footer__section} ${styles.footer__section__3}`}>

            <div className={styles.footer__socialMedia}>
              <a href="https://www.facebook.com/">
                <Fb alt="fb" />
              </a>
              <a href="https://www.instagram.com/">
                <Insta alt="insta" />
              </a>
              <a href="https://t.me/">
                <Tg alt="tg" />
              </a>
            </div>
            <h3 className={styles.footer__section__title}>
              {t('footer.support')}
            </h3>
            <a 
              href="mailto:Guidepro.ua@gmail.com" 
              className={styles.footer__link}
            >
              <Mail className={styles.footer__link__logo} />
              <p>Guidepro.ua@gmail.com</p>
            </a>
          </section>

          <section className={styles.footer__endMobile}>
            Created by Noname Digital
          </section>
        </div>

        <section className={styles.footer__endDesktop}>
          <p>Created by Noname Digital</p>
          <p>Privacy Policy</p>
        </section>
      </div>
    </footer>
  );
};