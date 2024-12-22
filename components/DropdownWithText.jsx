import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';

import Link from 'next/link'
import { useTranslation } from 'next-i18next';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { getRightData } from '../helpers/rightData';
import { useRouter } from 'next/router';

import styles from '../styles/dropdownWithText.module.scss'; 

export const DropdownWithText = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t }  = useTranslation();

  const { locale } =  useRouter();

  const refDropWithText = useRef();

  useOnClickOutside(refDropWithText, () => setIsOpen(false));

  const toggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.dropdownWithText} ref={refDropWithText}>
      <label>
        <div className={clsx(
          [styles.dropdownWithText__body], {[styles.dropdownWithText__body__open] : isOpen}
        )}
        >
          <button 
            className={`${styles.dropdownWithText__button} onMobile`} 
            onClick={toggle}
          >
            <img 
              src={'../middleChoice.svg'} 
              alt="select" 
              className={clsx(
                {[styles.dropdownWithText__icon__rotate]: isOpen,
                })}
            />
          </button>
          <h3 className="page__title-2">
            {getRightData(item, locale, 'title')}
          
          </h3>
          <button 
            className={`${styles.dropdownWithText__button} onDesktop`} 
            onClick={toggle}
          >
            <img 
              src={'../middleChoice.svg'} 
              alt="select" 
              className={clsx(
                {[styles.dropdownWithText__icon__rotate] : isOpen,
                })}
              
            />
          </button>
        </div>
        {isOpen && (
          <div className={styles.dropdownWithText__text}>
             {getRightData(item, locale, 'preview')}
            <button className={`button ${styles.dropdownWithText__text__button}`}>
              <Link href={`/questions/${item.path}`}>
                <p>
                  {t('homePage.knowMore')}
                </p>
              </Link>
              
            </button>
          </div>
        )}
      </label>
    </div>
  );
};

DropdownWithText.propType = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string,
};