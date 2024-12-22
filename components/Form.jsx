import { useState } from 'react';
import PropTypes from 'prop-types';

import Link from 'next/link';
import { useTranslation } from 'next-i18next';

import { clsx } from 'clsx';

import styles from '../styles/form.module.scss';

export const Form = ({ 
  formFunction, 
  isRegistration,
  handleSubmit,
  handleResetPassword,
}) => { 
  const [validError, setValidError] = useState({
    email: false, 
    password: false,
    phoneNumber: false,
  });

  const [phoneNumberValidError, setPhoneNumberValidError] = useState(false);
  const [emailValidError, setEmailValidError] = useState(false);
  const [passwordValidError, setPasswordValidError] = useState(false);

  const [regInfo, setRegInfo] = useState({
    email: '', 
    password: '',
    phoneNumber: '',
  });


  const { t }  = useTranslation();

  const handleChange = (fieldName, newValue) => {
    const newRegInfo = {
      ...regInfo,
      [fieldName]: newValue,
    };

    setRegInfo(newRegInfo);
  };

  const handleBlur = (fieldName, value) => {
    if (value.length === 0) {
      setValidError({
        ...validError,
        [fieldName]: true,
      });
    }

    if ((fieldName === 'phoneNumber' 
      && !/^(\s*)?(\+)?([- _():=+]?\d[- _():=+]?){10,14}(\s*)?$/.test(regInfo.phoneNumber))
      && regInfo.phoneNumber.length !== 0) {
        setPhoneNumberValidError(true);
      }

    if ((fieldName === 'email' 
      && !/^([a-z0-9_-]+\.)*[a-z0-9_-]+@[a-z0-9_-]+(\.[a-z0-9_-]+)*\.[a-z]{2,6}$/.test(regInfo.email))
      && regInfo.email.length !== 0) {
        setEmailValidError(true);
      }

    if (fieldName === 'password' 
      && regInfo.password.length < 6
      && regInfo.password.length !== 0) {
        setPasswordValidError(true);
      }
  }

  const handleFocus = (fieldName) => {
    setValidError({
      ...validError,
      [fieldName]: false,
    });
    if (fieldName === 'phoneNumber') {
      setPhoneNumberValidError(false); 
    }
    if (fieldName === 'email') {
        setEmailValidError(false);
    }
    if (fieldName === 'password') {
      setPasswordValidError(false);
    }
  }


  return (
    <form className={styles.form}>
      <div className={styles.form__buttons}>
        <Link href="/account" className={clsx(
          [styles.form__toggle__button], 
          {[styles.form__toggle__button__active] : formFunction === 'account'}
        )}>
          <p>{t('form.entry')}</p> 
        </Link>

        <Link href="/registration"
          className={clsx(
            [styles.form__toggle__button], 
          {[styles.form__toggle__button__active] : formFunction === 'registration'}
          )}
        >
          <p>{t('form.register')}</p> 
        </Link>
      </div>
      <div className={styles.form__inputs}>
        {isRegistration && (
          <div className={styles.form__inputContainer}>
            <input
              type="tel"
              className={clsx(
                {
                  [styles.form__input]: !validError.phoneNumber,
                  [styles.form__input__danger]: validError.phoneNumber || phoneNumberValidError
                }
              )}
              placeholder={t('form.phone')}
              onChange={(event) => handleChange('phoneNumber', event.target.value)}
              onBlur={(event) => handleBlur('phoneNumber', event.target.value)} 
              onFocus={() => handleFocus('phoneNumber')}
            />
              {validError.phoneNumber &&  
              <div className={styles.form__validError}>{t('validForm.fillField')}</div>
              } 
              {phoneNumberValidError &&  
              <div className={styles.form__validError}>{t('validForm.phoneNomber')}</div>
              } 
              
          </div>
        )}

         <div className={styles.form__inputContainer}>
        <input 
          type="email" 
          className={clsx(
            {
              [styles.form__input]: !validError.email,
              [styles.form__input__danger]: validError.email || emailValidError
            }
          )}
          placeholder="Email"  
          onChange={(event) => handleChange('email', event.target.value)}
          onBlur={(event) => handleBlur('email', event.target.value)}
          onFocus={() => handleFocus('email')}
        />
        {validError.email &&  
          <div className={styles.form__validError}>{t('validForm.fillField')}</div>
        } 
        {emailValidError &&  
          <div className={styles.form__validError}>{t('validForm.email')}</div>
        } 
        </div>

        <div className={styles.form__inputContainer}>
        <input 
          type="password" 
          className={clsx(
            {
              [styles.form__input]: !validError.password,
              [styles.form__input__danger]: validError.password || passwordValidError
            }
          )}  
          placeholder={t('form.password')} 
          onChange={(event) => handleChange('password', event.target.value)}
          onBlur={(event) => handleBlur('password', event.target.value)}
          onFocus={() => handleFocus('password')}
        />

        {validError.password &&  
          <div className={styles.form__validError}>{t('validForm.fillField')}</div>
        } 
        {passwordValidError &&  
          <div className={styles.form__validError}>{t('validForm.password')}</div>
        } 
        </div>
      </div>
      
      {!isRegistration && (
        <label className={styles.form__checkbox__label}>
          <input type="checkbox" />
          <span>{t('form.rememberMe')} </span>
        </label>
      )}
      
      <button 
        type="submit" 
        className={`button ${styles.form__button}`}
        onClick={(e) => {
          handleSubmit(e, regInfo);
        }}
        disabled={Object.values(validError).some(el => el) || passwordValidError || phoneNumberValidError || emailValidError}
      >
        {isRegistration ? t('form.signUp') : t('form.logIn')}
      </button>

      {!isRegistration && (
        <button 
          type='button'
          className={styles.form__forget}
          onClick={() => handleResetPassword(regInfo)}
        >
          <p>{t('form.forget')}</p> 
        </button>
      )}
      
    </form>
  );
};

Form.propType = {
  formFunction: PropTypes.string.isRequired , 
  isRegistration : PropTypes.bool, 
  handleSubmit: PropTypes.func.isRequired,
};