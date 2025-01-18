'use client';
import dynamic from 'next/dynamic';
import PropTypes from 'prop-types';
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AppContext } from './AppProvider';
import styles from '../styles/lawyersRequestForm.module.scss';
import countries from 'i18n-iso-countries';
import ukLocale from 'i18n-iso-countries/langs/uk.json';
import ruLocale from 'i18n-iso-countries/langs/ru.json';
import enLocale from 'i18n-iso-countries/langs/en.json';
import { useTranslation } from 'react-i18next';
import { getCollectionWhereKeyValue } from '../helpers/firebaseControl';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import 'firebase/firestore';
import {
  fieldInput,
  inputTypes,
  patternInput,
  placeHolder,
} from '../helpers/constant';

countries.registerLocale(ukLocale);
countries.registerLocale(ruLocale);
countries.registerLocale(enLocale);

// Динамічне підключення PDF-компонента
const LawyersRequest = dynamic(() => import('./DownloadPDF'), {
  ssr: false,
});
const Agreement = dynamic(() => import('./Agreement'), { ssr: false });
const Contract = dynamic(() => import('./Contract'), { ssr: false });

export default function LawyersRequestForm({ currentLanguage, request }) {
  const [userData, setUserData] = useState(null);
  const [statusRenewUser, setStatusRenewUser] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const getUserData = async () => {
      if (user) {
        const db = getFirestore(); // Initialize Firestore
        const userCollection = collection(db, 'users');
        const userQuery = query(userCollection, where('uid', '==', user.uid));

        try {
          const snapshot = await getDocs(userQuery);
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
            setUserData(userData);
            handleDocuSign(userData);
          } else {
            console.log('User data not found');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    if (statusRenewUser) {
      getUserData(), setStatusRenewUser(false);
    }
  }, [statusRenewUser, user]);

  const language = currentLanguage === 'ua' ? 'uk' : currentLanguage;
  const { t } = useTranslation();
  const { user, userCredentials } = useContext(AppContext);

  const requestEn = request.requestType.ua;
  const requestRecipient = request.recipient;

  const [formData, setFormData] = useState({
    uid: userCredentials?.uid || '',
    name: userCredentials?.name || '', //АДПСУ, РАЦС, МОУ і ТЦК, ГУНП, ПФУ і ДПСУ, ВПО
    surname: userCredentials?.surname || '', //АДПСУ, РАЦС, МОУ і ТЦК, ГУНП, ПФУ і ДПСУ, ВПО
    fatherName: userCredentials?.fatherName || '', //АДПСУ, РАЦС, МОУ і ТЦК, ГУНП, ПФУ і ДПСУ, ВПО
    email: userCredentials?.email || 'example@example.com', //????
    birthday: userCredentials?.birthday || '', //АДПСУ, РАЦС, МОУ і ТЦК, ГУНП
    residence: {
      address: userCredentials?.address_1,
      city: userCredentials?.city,
      country: userCredentials?.country,
    }, //РАЦС
    requesterBirthday: '', //РАЦС
    requesterName: '', //РАЦС
    requesterFile: [], //РАЦС
    //дані про смерть
    deadName: '', //РАЦС
    deadDeathDay: '', //РАЦС
    deadBirthday: '', //РАЦС
    deadRelationship: '', //РАЦС
    dateCreating: new Date() //ВСІ ФОРМИ
      .toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
    recipient: {
      name: '', //МОУ і ТЦК
      address: '', //МОУ і ТЦК
    },
    rank: '', //МОУ і ТЦК
    unit: '', //МОУ і ТЦК
    citizenship: '', //АДПСУ,
    date: { start: '', end: '' }, //АДПСУ, МОУ і ТЦК
    // ПАСПОРТИ
    abroadPassnum: '', //АДПСУ
    passportNum: '', //АДПСУ,
    pmjNum: '', //АДПСУ,
    // Подружжя (дані супругів)
    couplePIB1: '', //РАЦС
    couplePIB2: '', //РАЦС
    coupleBirthday1: '', //РАЦС
    coupleBirthday2: '', //РАЦС
    // (дату надання довідки про місце проживання)
    dateResidence: '', //РАЦС
    placeResidence: '', //РАЦС
    eventDate: '', //ГУНП
    eventTime: '', //ГУНП
    eventPlace: '', //ГУНП
    ipn: '', //ПФУ і ДПСУ
    propertyAddress: '', //ВПО
    uid: user?.uid || '',
    request: request,
  });

  const [downloadLink, setDownloadLink] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState({
    agreement: false,
    contract: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestTypeMap = {
    РАЦС: [
      'citizenship',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'requesterBirthday',
      'requesterName',
      'requesterFile',
      'deathDay',
      'couplePIB1',
      'couplePIB2',
      'dateResidence',
    ],
    АДПСУ: [
      'citizenship',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'passportNum',
      'abroadPassnum',
      'pmjNum',
      'dateBorderCrossingStart',
      'dateBorderCrossingEnd',
    ],
    'МОУ і ТЦК': [
      'citizenship',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'recipient.name',
      'recipient.address',
    ],
    МВС: [
      'citizenship',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'eventDate',
      'eventTime',
      'eventPlace',
    ],
    'ПФУ і ДПСУ': ['citizenship', 'name', 'surname', 'fatherName', 'ipn'],
    ВПО: ['citizenship', 'name', 'surname', 'fatherName', 'propertyAddress'],
  };

  const requestNameToKeyMap = {
    'Запити до органів ДРАЦС (реєстрація актів цивільного стану)': 'РАЦС',
    'Запити до Державної міграційної служби України (ДМСУ) та адміністрації ДПСУ':
      'АДПСУ',
    'Запити до Міністерства оборони України (МОУ) та територіальних центрів комплектування (ТЦК)':
      'МОУ і ТЦК',
    'Запити до Міністерства внутрішніх справ України (МВС)': 'МВС',
    'Запити до Пенсійного фонду України (ПФУ) та Державної прикордонної служби України (ДПСУ)':
      'ПФУ і ДПСУ',
    'Запити, пов’язані з внутрішньо переміщеними особами (ВПО)': 'ВПО',
  };

  const filterFieldsByRequestType = requestEn => {
    const typeKey = requestNameToKeyMap[requestEn] || '';
    return requestTypeMap[typeKey] || [];
  };
  const visibleFields = filterFieldsByRequestType(requestEn);

  const getNestedValue = (obj, path) => {
    return path
      .split('.')
      .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  };

  const isFormValid = () => {
    // console.log(visibleFields);
    return visibleFields.every(field => {
      const value = getNestedValue(formData, field);

      if (field === 'fatherName') {
        return true;
      }

      if (value instanceof File) {
        return value.size > 0;
      }

      return typeof value === 'string' ? value.trim() !== '' : Boolean(value);
    });
  };

  useEffect(() => {
    const getRecipient = async () => {
      try {
        const recipient = await getCollectionWhereKeyValue(
          'recipient',
          'name',
          requestRecipient
        );
        if (!recipient || recipient.length === 0) {
          console.error(
            `Recipient with application ${requestRecipient} not found in the database.`
          );
          throw new Error(
            `Recipient with application ${requestRecipient} does not exist.`
          );
        }

        const recipientName = recipient[0].application;
        const recipientAddress = recipient[0].address;

        setFormData(prev => ({
          ...prev,
          recipient: { name: recipientName, address: recipientAddress },
        }));

        return;
      } catch (error) {
        console.error('Error saving request to Firestore:', error);
        throw error;
      }
    };
    getRecipient();
  }, [requestRecipient]);

  const generatePDFPreview = async type => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/pdf/preview-pdf', {
        formData,
        type,
      });
      const pdfBase64 = response.data.pdfBase64;
      const pdfBuffer = Buffer.from(pdfBase64, 'base64'); // Декодуємо Base64
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });

      // Створюємо тимчасовий URL для файлу
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error(`Error generating ${type} PDF preview:`, err);
      setError(`Failed to generate ${type} PDF preview.`);
    } finally {
      setIsLoading(false);
    }
  };

  const savePDF = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/pdf/save-pdf', {
        formData,
        selectedDocuments,
        uid: user?.uid,
      });

      // Отримуємо сформовані PDF-файли
      const { agreementPDF, contractPDF, lawyersRequestPDF } = response.data;

      setFormData(prev => ({
        ...prev,
        agreement: agreementPDF,
        contract: contractPDF,
        pdfDocUrl: lawyersRequestPDF,
      }));
    } catch (err) {
      console.error('Error saving documents:', err);
      setError('Failed to save documents.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = async e => {
    e.preventDefault();
    const { name, value } = e.target;

    if (name.startsWith('recipient.')) {
      const key = name.split('.')[1];
      setFormData(formData => ({
        ...formData,
        recipient: {
          ...formData.recipient,
          [key]: value,
        },
      }));
    } else {
      setFormData(formData => ({
        ...formData,
        [name]: value,
      }));
    }
  };

  const handleChangeForFile = async e => {
    e.preventDefault();
    const { name, files } = e.target;

    if (name === 'requesterFile' && files.length > 0) {
      setFormData(prevData => ({
        ...prevData,
        [name]: files[0],
      }));
    }
  };

  const handleCheckboxChange = async e => {
    const { name, checked } = e.target;
    setSelectedDocuments(prev => ({ ...prev, [name]: checked }));

    // if (checked) {
    //   generatePDFPreview(name);
    // }
  };

  const handleSubmit = e => {
    e.preventDefault();
    console.log(formData);
    const dataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value instanceof File) {
        dataToSend.append(key, value, value.name);
      } else {
        dataToSend.append(key, value);
      }
    });

    fetch('/submit', {
      method: 'POST',
      body: dataToSend,
    })
      .then(response => response.json())
      .then(data => console.log('success', data))
      .catch(error => console.error('Error', error));

    savePDF();
    setStatusRenewUser(true);
  };

  const handleDocuSign = async userData => {
    const res = await fetch('/api/docusign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signerEmail: userData?.email,
        signerName: userData?.name,
        ccEmail: 'vlad_np@ukr.net',
        ccName: 'vlad',
        doc2File: userData.requests[0].pdfAgreement,
        doc3File: userData.requests[0].pdfContract,
      }),
    });

    const data = await res.json();
    console.log('setMessage', data);
    if (res.ok) {
      setMessage(`Envelope sent successfully! Envelope ID: ${data.envelopeId}`);
    } else {
      setMessage(`Error: ${data.error}`);
    }
  };

  const getCountriesByLanguage = lang => {
    return Object.entries(countries.getNames(lang)).map(([code, name]) => ({
      value: code,
      label: name,
    }));
  };

  const [countryList, setCountryList] = useState(
    getCountriesByLanguage(language)
  );

  useEffect(() => {
    setCountryList(getCountriesByLanguage(language));
  }, [language]);

  const isAgreementValid = selectedDocuments.agreement;
  const isContractValid = selectedDocuments.contract;
  const isSubmitDisabled =
    !isFormValid() || !isAgreementValid || !isContractValid;

  return (
    <>
      <div className={styles.orderForm}>
        <form onSubmit={handleSubmit} className={styles.orderForm__form}>
          <h1>
            {language === 'uk'
              ? 'Сформувати адвокатський запит:'
              : language === 'ru'
              ? 'Сформировать адвокатский запрос:'
              : 'Create a lawyer request:'}
          </h1>
          <ul>
            {visibleFields.map(field => {
              const value = getNestedValue(formData, field) || '';
              const isDanger =
                patternInput[field] && !patternInput[field].test(value);
              const inputType = inputTypes[field] || 'text';

              return (
                <li key={field}>
                  <label className={styles.orderForm__form_lable}>
                    <span className={styles.orderForm__form_span}>
                      {t(fieldInput[field]) || field}:{' '}
                      <span className={styles.orderForm__form_required}>*</span>
                    </span>

                    {field === 'citizenship' ? (
                      <select
                        className={styles.orderForm__form_select}
                        name={field}
                        value={value}
                        onChange={e => {
                          const { name, value } = e.target;
                          setFormData(prevData => ({
                            ...prevData,
                            [name]: value,
                          }));
                        }}
                        required
                      >
                        <option value="" disabled>
                          {t('Select a country')}
                        </option>
                        {countryList.map(country => (
                          <option key={country.value} value={country.label}>
                            {country.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={
                          isDanger
                            ? styles.orderForm__form_input__danger
                            : styles.orderForm__form_input
                        }
                        type={inputType}
                        name={field}
                        value={inputType !== 'file' ? value : undefined}
                        pattern={patternInput[field]?.source || undefined}
                        placeholder={placeHolder[field] || ''}
                        onChange={e => {
                          const { name, value, files } = e.target;

                          if (name === 'requesterFile' && files?.length > 0) {
                            handleChangeForFile(e);
                          } else if (name.startsWith('recipient.')) {
                            const key = name.split('.')[1];
                            setFormData(prevData => ({
                              ...prevData,
                              recipient: {
                                ...prevData.recipient,
                                [key]: value,
                              },
                            }));
                          } else {
                            setFormData(prevData => ({
                              ...prevData,
                              [name]: value,
                            }));
                          }
                        }}
                      />
                    )}
                  </label>

                  {isDanger && (
                    <span
                      className={
                        patternInput[field]
                          ? styles.form__validate
                          : styles.form__validate__hide
                      }
                    >
                      Please use pattern: {placeHolder[field]}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            className={styles.orderForm__form_button}
            onClick={() => {
              generatePDFPreview('lawyersRequest');
            }}
          >
            {isLoading
              ? language === 'uk'
                ? 'Формується...'
                : language === 'ru'
                ? 'Формируется...'
                : 'Generating...'
              : language === 'uk'
              ? 'Сформувати запит'
              : language === 'ru'
              ? 'Сформировать запрос'
              : 'Lawyer`s request generate'}
          </button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {/* {downloadLink && (
            <div className={styles.orderForm__form_file}>
              <a
                className={styles.orderForm__form_download}
                style={{ textDecoration: 'none' }}
                href={downloadLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {language === 'uk'
                  ? 'Завантажити PDF'
                  : language === 'ru'
                  ? 'Скачать PDF'
                  : 'Download PDF'}
              </a>
            </div>
          )} */}

          <div className={styles.checkbox_wrapper_29}>
            <div>
              <label>
                <input
                  className={styles.checkbox__input}
                  type="checkbox"
                  name="agreement"
                  checked={selectedDocuments.agreement}
                  onChange={handleCheckboxChange}
                />
                <span className={styles.checkbox__label}></span>
              </label>

              <label
                className={styles.label}
                htmlFor="agreement-checkbox"
                onClick={() => generatePDFPreview('agreement')}
              >
                {language === 'uk'
                  ? 'Даю згоду на обробку персональних даних'
                  : language === 'ru'
                  ? 'Соглашаюсь на обработку персональных данных'
                  : 'I consent to the processing of personal data'}
              </label>
            </div>

            <div>
              <label>
                <input
                  className={styles.checkbox__input}
                  type="checkbox"
                  name="contract"
                  checked={selectedDocuments.contract}
                  onChange={handleCheckboxChange}
                />
                <span className={styles.checkbox__label}></span>
              </label>

              <label
                className={styles.label}
                htmlFor="contract-checkbox"
                onClick={() => generatePDFPreview('contract')}
              >
                {language === 'uk'
                  ? 'Даю згоду на укладання договору про надання правової допомоги'
                  : language === 'ru'
                  ? 'Даю согласие на заключение договора о предоставлении правовой помощи'
                  : 'I consent to the conclusion of a legal assistance agreement.'}
              </label>
            </div>
          </div>

          <button
            // onClick={(e) => handleSubmit(e)}
            disabled={isLoading || isSubmitDisabled}
            type="submit"
            className={styles.orderForm__form_button}
          >
            {isLoading
              ? language === 'uk'
                ? 'Збереження...'
                : language === 'ru'
                ? 'Сохранение...'
                : 'Saving...'
              : language === 'uk'
              ? 'Зберегти всі документи'
              : language === 'ru'
              ? 'Сохранить все документы'
              : 'Save all documents'}
          </button>
        </form>
      </div>
    </>
  );
}

LawyersRequestForm.propType = {
  request: PropTypes.object.isRequired,
  currentLanguage: PropTypes.string,
};
