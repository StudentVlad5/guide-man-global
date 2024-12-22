import { useState, useRef } from 'react';

import PropTypes from 'prop-types';

import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { clsx } from 'clsx';

import styles from '../styles/bannerDropdown.module.scss'; 


export const BannerDropdown = ({
  title, 
  values, 
  dropdownValue, 
  setDropdownValue, 
}) => {
  const ref = useRef();
  const [isOpen, setIsOpen] = useState(false);

  useOnClickOutside(ref, () => setIsOpen(false));

  const toggle = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (event) => {
    if (event.keyCode === 27 && isOpen) {
      setIsOpen(false);
    }
  };


  return (
    <div className={styles.bannerDropdown} ref={ref}>
      <label className={styles.bannerDropdown__label}>
        <div className={clsx(
          [styles.bannerDropdown__body], {[styles.bannerDropdown__body__active]: isOpen}
        )}>
          <p className={dropdownValue.length > 0 
            ? styles.bannerDropdown__value__checked
            : styles.bannerDropdown__value}
          >
            {dropdownValue.length > 0 ? dropdownValue : title}
          </p>
          <button 
            className={styles.bannerDropdown__button} 
            onClick={toggle}
            onKeyDown={handleKeyDown}
          >
            <img src={'../bigChoice.svg'} alt="select" />
          </button>
          
        </div>
        {isOpen && (
          <div className={styles.bannerDropdown__values}>
            {values.map(el => (
              <li
                key={el}
                onClick={() => {
                  setDropdownValue(el);
                }}
                className={styles.bannerDropdown__item}
              >
                {el}
              </li>
            ))}
          </div>
        )}
      </label>
    </div>
  );
};

BannerDropdown.propTypes = {
  title: PropTypes.string.isRequired,
  values: PropTypes.arrayOf(PropTypes.string),
  dropdownValue: PropTypes.string, 
  setDropdownValue: PropTypes.func,
};