import { clsx } from 'clsx';
import { useState, useRef } from 'react';
import Link from 'next/link'
import PropTypes from 'prop-types';

import { useOnClickOutside } from '../hooks/useOnClickOutside';

import styles from '../styles/servisesDropdown.module.scss';

export const ServisesDropdown = ({ title, Img, values }) => {
  const [isOpen, setIsOpen] = useState(false);

  const refServisesDrop = useRef();

  useOnClickOutside(refServisesDrop, () => setIsOpen(false));

  const toggle = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (event) => {
    if (event.keyCode === 27 && isOpen) {
      setIsOpen(false);
    }
  };

  return (
    <div className={styles.servisesDropdown} ref={refServisesDrop}>
      <label className={styles.servisesDropdown__label}>
        <div className={clsx(
          [styles.servisesDropdown__body], { [styles.servisesDropdown__body__active]: isOpen}
        )}>
          <button 
            className={clsx(
              [styles.servisesDropdown__button], 
              {[styles.servisesDropdown__button__active] : isOpen}
            )}            
            onClick={toggle}
            onKeyDown={handleKeyDown}
          >
            <Img alt="icon" />
          </button>
          {title}
        </div>
        {isOpen && (
          <div className={styles.servisesDropdown__values}>
            {values.map(el => {
              return (
                <li
                  className={styles.servisesDropdown__item}
                  key={el}
                >
                  <Link 
                    href={el[1] === 'lehalizatsiia-v-ukraini-hromadianstvo' 
                      ? '/services/citizenship'
                      : `/services/${el[1]}`} 
                  >
                    {el[0]}
                  </Link>
                </li>
              );
            })}
          </div>
        )}
      </label>
    </div>
  );
};

ServisesDropdown.propTypes = {
  img: PropTypes.string,
  title: PropTypes.string.isRequired,
  values: PropTypes.arrayOf(PropTypes.string),
};