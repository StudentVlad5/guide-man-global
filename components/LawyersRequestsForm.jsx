'use client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AppContext } from './AppProvider';
import styles from '../styles/lawyersRequestForm.module.scss';
import countries from 'i18n-iso-countries';
import ukLocale from 'i18n-iso-countries/langs/uk.json';
import ruLocale from 'i18n-iso-countries/langs/ru.json';
import enLocale from 'i18n-iso-countries/langs/en.json';
import { useTranslation } from 'react-i18next';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import 'firebase/firestore';
import {
  fieldInputForForm,
  inputTypes,
  patternInput,
  placeHolder,
  requestNameToKeyMap,
  requestTypeMap,
} from '../helpers/constant';
import { useLawyerRequest } from '../hooks/useLawyerRequest';
import {
  getCollectionWhereKeyValue,
  updateDocumentInCollection,
} from '../helpers/firebaseControl';

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
  const [userRequests, setUserRequests] = useState([]);
  const [userRequest, setUserRequest] = useState([]);
  const [tck, setTck] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [orderPayId, setOrderPayId] = useState();
  const language = currentLanguage === 'ua' ? 'uk' : currentLanguage;
  const { t } = useTranslation();
  const { user, userCredentials } = useContext(AppContext);
  const hasExecuted = useRef(false);

  const requestEnTitle = request.ua.title;
  const requestRecipient = request.recipient;
  const title = request?.[currentLanguage]?.title || 'Default Payment Title';
  const router = useRouter();

  const {
    formData,
    setFormData,
    handleSendEmail,
    handleDocuSign,
    resetFormData,
  } = useLawyerRequest(request);

  const [downloadLink, setDownloadLink] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState({
    agreement: false,
    contract: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const filterFieldsByRequestType = requestEn => {
    const typeKey = requestNameToKeyMap[requestEn] || '';
    return requestTypeMap[typeKey] || [];
  };
  const visibleFields = filterFieldsByRequestType(requestEnTitle);

  const getNestedValue = (obj, path) => {
    return path
      .split('.')
      .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  };

  const isFormValid = () => {
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
    if (user) {
      getCollectionWhereKeyValue('userRequests', 'uid', user.uid).then(res => {
        if (res) {
          setUserRequests(
            res.sort(
              (a, b) => new Date(a.dateCreating) - new Date(b.dateCreating)
            )
          );
        }
      });
    }
  }, [user, isLoading]);

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

  // Отримання адресату (держоргана або ТЦК) для запиту
  useEffect(() => {
    const getRecipient = async () => {
      try {
        const recipient = await getCollectionWhereKeyValue(
          'recipient',
          'name',
          requestRecipient
        );
        // console.log(recipient);

        if (recipient.length > 0) {
          const recipientName = recipient[0].application;
          const recipientAddress = recipient[0].address;

          setFormData(prev => ({
            ...prev,
            recipient: { name: recipientName, address: recipientAddress },
          }));
        }

        return;
      } catch (error) {
        console.error('Error saving request to Firestore:', error);
        throw error;
      }
    };
    getRecipient();
  }, [requestRecipient]);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const db = getFirestore();
        const querySnapshot = await getDocs(collection(db, 'tck'));

        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        const uniqueData = Array.from(new Set(data.map(item => item.id))).map(
          id => data.find(item => item.id === id)
        );
        setTck(uniqueData);
      } catch (error) {
        console.error('Error fetching collection: ', error);
      }
    };

    fetchCollection();
  }, []);

  // Генерування попереднього перегляду PDF-файлу
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

  // Збереження PDF-файлів
  const savePDF = async orderPayId => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/pdf/save-pdf', {
        // formData,
        formData: {
          ...formData,
          idPost: orderPayId,
          orderPayId: orderPayId,
        },
        selectedDocuments,
        uid: user?.uid,
      });

      // Отримуємо сформовані PDF-файли
      const { agreementPDF, contractPDF, lawyersRequestPDF } = response.data;
      setUserRequest(response.data);
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

  // Отримання завантаженого файла
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

  // Обробка зміни в checkbox на згоду та договір
  const handleCheckboxChange = async e => {
    const { name, checked } = e.target;
    setSelectedDocuments(prev => ({ ...prev, [name]: checked }));
  };

  const isAgreementValid = selectedDocuments.agreement;
  const isContractValid = selectedDocuments.contract;
  const isSubmitDisabled =
    !isFormValid() || !isAgreementValid || !isContractValid;

  // Відправка запиту на оплату
  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setPaymentStatus(null);
    let newOrderPayId;
    try {
      newOrderPayId = `order_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      setOrderPayId(newOrderPayId);

      const updatedFormData = {
        ...formData,
        orderPayId: newOrderPayId,
        idPost: newOrderPayId,
      };

      setFormData(updatedFormData);
      savePDF(newOrderPayId);
      // resetFormData();
      const returnUrl = `${window.location.origin}${router.asPath}`;

      const paymentResponse = await fetch('/api/liqpay/liqpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '2000',
          currency: 'UAH',
          description: title || 'Payment',
          currentLanguage: currentLanguage,
          returnUrl,
          order_id: newOrderPayId,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error('Error initializing payment');
      }

      const paymentData = await paymentResponse.json();

      const paymentForm = document.createElement('form');
      paymentForm.method = 'POST';
      paymentForm.action = 'https://www.liqpay.ua/api/3/checkout';
      paymentForm.acceptCharset = 'utf-8';
      paymentForm.target = '_blank';

      const inputData = document.createElement('input');
      inputData.type = 'hidden';
      inputData.name = 'data';
      inputData.value = paymentData.data;

      const inputSignature = document.createElement('input');
      inputSignature.type = 'hidden';
      inputSignature.name = 'signature';
      inputSignature.value = paymentData.signature;

      paymentForm.appendChild(inputData);
      paymentForm.appendChild(inputSignature);
      document.body.appendChild(paymentForm);

      paymentForm.submit();
      document.body.removeChild(paymentForm);
      paymentCheckInterval = setInterval(
        () => checkPaymentStatus(newOrderPayId),
        500
      );
    } catch (error) {
      console.error('Error:', error);
      setPaymentStatus('error');
      setFormData(prev => ({ ...prev, paymentStatus: 'error' }));
    } finally {
      setIsLoading(false);
      setStatusRenewUser(true);
    }
  };

  // Перевірка статусу оплати
  const [paymentChecking, setPaymentChecking] = useState(false);

  let paymentCheckInterval;

  const checkPaymentStatus = async orderPayId => {
    if (!orderPayId) {
      console.error('No order ID found');
      return;
    }

    try {
      const response = await fetch('/api/liqpay/check-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderPayId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setFormData(prev => ({ ...prev, paymentStatus: data.status }));
      setPaymentStatus(data.status);

      if (data.status === 'success') {
        // alert("Оплата успішна!");

        setUserRequests(prevRequests =>
          prevRequests.map(req =>
            req.orderPayId === orderPayId ? { ...req, status: 'paid' } : req
          )
        );

        await fetch('/api/liqpay/update-payment-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            order_id: orderPayId,
            status: data.status,
          }),
        });
        clearInterval(paymentCheckInterval);
      }
      // } else if (data.status === "error") {
      //   alert(t("Payment failed or not found."));
      // }
    } catch (error) {
      console.error('Error checking payment status:', error);
      alert(t('Error checking payment status. Please try again later.'));
    } finally {
      setPaymentChecking(false);
    }
  };

  useEffect(() => {
    if (orderPayId) {
      setFormData(prev => ({ ...prev, orderPayId }));
    }
  }, [orderPayId]);

  useEffect(() => {
    if (paymentStatus === 'success' && !hasExecuted.current) {
      hasExecuted.current = true;

      // 1. Надсилаємо перший email користувачу після оплати
      handleSendEmail(formData, 'paid');

      // 2. Викликаємо DocuSign для підписання
      handleDocuSign(userRequest)
        .then(async envelop_id => {
          // 3. Оновлюємо статус на 'signed' в Firestore перед відправкою email
          await updateDocumentInCollection(
            'userRequests',
            { status: 'signed', envelop_id },
            formData.id
          );
          console.log(
            `Статус запиту ${formData.id} оновлено на 'signed', збережено у userRequest envelop_id: ${envelop_id}}`
          );

          // 4. Надсилаємо email користувачу після підписання
          await handleSendEmail(formData, 'signed');

          // 6. Оновлюємо статус на 'sent' у Firestore
          await updateDocumentInCollection(
            'userRequests',
            { status: 'sent' },
            formData.id
          );
          console.log(`Статус запиту ${formData.id} оновлено на 'sent'`);

          // 7. Надсилаємо email до держоргану після оновлення статусу на 'sent'
          await handleSendEmail(formData, 'sent');
        })
        .catch(error => console.error('Error signing document:', error));
    }
  }, [paymentStatus]);

  // Отримання країн для вибору громадянства
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

  return (
    <>
      <div className={styles.orderForm}>
        <form onSubmit={handleSubmit} className={styles.orderForm__form}>
          <h1>{t('Create a lawyer request')}:</h1>
          <ul>
            <button
              type="button"
              className={styles.orderForm__form_button_fill}
              onClick={() => {
                setFormData(prevData => ({
                  ...prevData,
                  name: userCredentials?.name || '',
                  surname: userCredentials?.surname || '',
                  fatherName: userCredentials?.fatherName || '',
                  email: userCredentials?.email || '',
                  birthday: userCredentials?.birthday || '',
                  citizenship: userCredentials?.citizenship || '',
                  passport: userCredentials?.passport || '',
                  residence: {
                    address: userCredentials?.address_1 || '',
                    city: userCredentials?.city || '',
                    country: userCredentials?.country || '',
                  },
                  inn: userCredentials?.inn || '',
                }));
              }}
            >
              {t('Fill fields')}
            </button>

            {visibleFields.map(field => {
              const value = getNestedValue(formData, field) || '';
              const isDanger =
                patternInput[field] && !patternInput[field].test(value);
              const inputType = inputTypes[field] || 'text';
              const isFatherName = field === 'fatherName';
              const inputClass = isFatherName
                ? styles.orderForm__form_select
                : isDanger
                ? styles.orderForm__form_input__danger
                : styles.orderForm__form_input;

              return (
                <li key={field}>
                  <label className={styles.orderForm__form_lable}>
                    <span className={styles.orderForm__form_span}>
                      {t(fieldInputForForm[field]) || field}:{' '}
                      {field !== 'fatherName' && (
                        <span className={styles.orderForm__form_required}>
                          *
                        </span>
                      )}
                    </span>

                    {field === 'citizenship' ? (
                      <select
                        className={
                          !value
                            ? styles.orderForm__form_input__danger
                            : styles.orderForm__form_select
                        }
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
                    ) : field === 'recipient.name' ? (
                      <select
                        className={
                          !value
                            ? styles.orderForm__form_input__danger
                            : styles.orderForm__form_select
                        }
                        name="recipient.name"
                        value={formData.recipient?.name || ''}
                        onChange={e => {
                          const { value } = e.target;

                          const selectedTCK = tck.find(t => t.name === value);

                          setFormData(prevData => ({
                            ...prevData,
                            recipient: {
                              ...prevData.recipient,
                              name: value,
                              address: selectedTCK?.email || '',
                            },
                          }));
                        }}
                        required
                      >
                        <option value="" disabled>
                          {t('Select a TCK')}
                        </option>
                        {tck.map(tck => (
                          <option key={tck.id} value={tck.name}>
                            {tck.name}
                          </option>
                        ))}
                      </select>
                    ) : field === 'recipient.address' ? (
                      <input
                        className={inputClass}
                        type="text"
                        name="recipient.address"
                        value={formData.recipient?.address || ''}
                        readOnly
                      />
                    ) : (
                      <input
                        className={inputClass}
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
                          } else if (name.startsWith('residence.')) {
                            const key = name.split('.')[1];
                            setFormData(prevData => ({
                              ...prevData,
                              residence: {
                                ...prevData.residence,
                                [key]: value,
                              },
                            }));
                          } else if (name.startsWith('date.')) {
                            const key = name.split('.')[1];
                            setFormData(prevData => ({
                              ...prevData,
                              date: {
                                ...prevData.date,
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
                      {t('Please use pattern')}: {placeHolder[field]}
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
            {isLoading ? t('Generating...') : t('Lawyer`s request generate')}
          </button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
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
                {t('I consent to the processing of personal data')}
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
                {t(
                  'I consent to the conclusion of a legal assistance agreement.'
                )}
              </label>
            </div>
          </div>
          {paymentStatus === 'success' ? (
            <button
              disabled={true}
              type="submit"
              className={styles.orderForm__form_button}
            >
              {isLoading ? t('Paid') : t('Paid')}
            </button>
          ) : (
            <button
              // onClick={(e) => handleSubmit(e)}
              disabled={isLoading || isSubmitDisabled}
              type="submit"
              className={styles.orderForm__form_button}
            >
              {isLoading ? t('Saving...') : t('Next')}
            </button>
          )}
        </form>
      </div>
    </>
  );
}

LawyersRequestForm.propType = {
  request: PropTypes.object.isRequired,
  currentLanguage: PropTypes.string,
};
