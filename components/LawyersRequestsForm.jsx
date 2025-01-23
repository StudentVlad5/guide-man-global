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
  fieldInputForForm,
  inputTypes,
  patternInput,
  placeHolder,
} from '../helpers/constant';
import { Payment } from './Payment';

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

  useEffect(() => {
    if (user) {
      getCollectionWhereKeyValue('userRequests', 'userId', user.uid).then(
        res => {
          if (res) {
            setUserRequests(res);
            console.log(res);
          }
        }
      );
    }
  }, [user]);

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

  // const requestEn = request.requestType.ua;
  const requestEnTitle = request.ua.title;
  const requestRecipient = request.recipient;
  const title = request?.[currentLanguage]?.title || 'Default Payment Title';

  const [formData, setFormData] = useState({
    uid: user?.uid || '',
    citizenship: userCredentials?.citizenship || '', //ВСІ ФОРМИ
    name: userCredentials?.name || '', //АДПСУ, РАЦС, МОУ і ТЦК, МВС, ПФУ і ДПСУ, ВПО
    surname: userCredentials?.surname || '', //АДПСУ, РАЦС, МОУ і ТЦК, МВС, ПФУ і ДПСУ, ВПО
    fatherName: userCredentials?.fatherName || '', //АДПСУ, РАЦС, МОУ і ТЦК, МВС, ПФУ і ДПСУ, ВПО
    email: userCredentials?.email || '', //ВСІ ФОРМИ
    birthday: userCredentials?.birthday || '', //АДПСУ, РАЦС, МОУ і ТЦК, МВС
    residence: {
      address: userCredentials?.address_1 || '',
      city: userCredentials?.city || '',
      country: userCredentials?.country || '',
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
    servicemanPIB: '', //МОУ і ТЦК
    rank: '', //МОУ і ТЦК
    unit: '', //МОУ і ТЦК
    date: { start: '', end: '' }, //АДПСУ, МОУ і ТЦК
    // ПАСПОРТИ
    abroadPassnum: '', //АДПСУ
    passport: userCredentials?.passport || '', //АДПСУ, ЗАМІСТЬ passportNum
    pmjNum: '', //АДПСУ,
    // Подружжя (дані супругів)
    couplePIB1: '', //РАЦС
    couplePIB2: '', //РАЦС
    coupleBirthday1: '', //РАЦС
    coupleBirthday2: '', //РАЦС
    // (дату надання довідки про місце проживання)
    dateResidence: '', //РАЦС
    placeResidence: '', //РАЦС
    eventDate: '', //МВС
    eventTime: '', //МВС
    eventPlace: '', //МВС
    inn: userCredentials?.inn || '', //ПФУ і ДПСУ
    propertyAddress: '', //ВПО
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
    // ДРАЦС /РАЦС(на рус)
    'Запит про надання довідки про зміну імені або прізвища': [
      'email',
      'name',
      'surname',
      'fatherName',
    ],
    'Запит про надання довідки про місце реєстрації проживання': [
      'email',
      'name',
      'surname',
      'fatherName',
    ],
    'Запит про надання довідки про сімейний стан': [
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'residence.address',
      'residence.city',
      'residence.country',
    ],
    'Запит про надання копії свідоцтва про народження': [
      'email',
      'name',
      'surname',
      'fatherName',
    ],
    'Запит про надання копії свідоцтва про розірвання шлюбу': [
      'email',
      'couplePIB1',
      'couplePIB2',
    ],
    'Запит про надання копії свідоцтва про смерть': [
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'deadName',
      'deadBirthday',
      'deadDeathDay',
      'deadRelationship',
    ],
    'Запит про надання копії свідоцтва про шлюб': [
      'couplePIB1',
      'couplePIB2',
      'coupleBirthday1',
      'coupleBirthday2',
    ],
    // АДПСУ / адміністрації ДПСУ
    'Запит про вилучення інформації з бази даних ДПСУ щодо тимчасового обмеження у праві виїзду з України':
      [
        'citizenship',
        'email',
        'name',
        'surname',
        'fatherName',
        'birthday',
        'passport',
      ],
    "Запит про надання копій документів, пов'язаних з міграційними процедурами":
      [
        'citizenship',
        'email',
        'name',
        'surname',
        'fatherName',
        'birthday',
        'passport',
      ],
    "Запит про надання копій документів, пов'язаних з перетином кордону": [
      'citizenship',
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'passport',
    ],
    'Запит про надання інформації щодо затримання або відмови у пропуску через державний кордон':
      [
        'citizenship',
        'email',
        'name',
        'surname',
        'fatherName',
        'birthday',
        'passport',
      ],
    'Запит про надання інформації щодо наявності або відсутності громадянства України у особи':
      ['email', 'name', 'surname', 'fatherName', 'birthday'],
    "Запит про надання інформації щодо наявності або відсутності заборони на в'їзд в Україну":
      [
        'citizenship',
        'email',
        'name',
        'surname',
        'fatherName',
        'birthday',
        'passport',
      ],
    'Запит про надання інформації щодо наявності обмежень на виїзд за кордон': [
      'citizenship',
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'passport',
    ],
    'Запит про надання інформації щодо перетину державного кордону особою': [
      'citizenship',
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'passport',
      'date.start',
      'date.end',
    ],
    'Запит про надання інформації щодо реєстрації місця проживання або перебування особи':
      [
        'citizenship',
        'email',
        'name',
        'surname',
        'fatherName',
        'birthday',
        'passport',
      ],
    'Запит про надання інформації щодо рішень про депортацію або примусове видворення':
      [
        'citizenship',
        'email',
        'name',
        'surname',
        'fatherName',
        'birthday',
        'passport',
      ],
    'Запит про надання інформації щодо стану розгляду заяв або клопотань': [
      'citizenship',
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'passport',
    ],
    "Запит про наявність рішення про заборону в'їзду для іноземця або особи без громадянства":
      [
        'citizenship',
        'email',
        'name',
        'surname',
        'fatherName',
        'birthday',
        'passport',
      ],
    'Запит про наявність тимчасового обмеження у праві виїзду за кордон': [
      'citizenship',
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'passport',
    ],
    // МОУ і ТЦК
    'Запит про надання копій документів особової справи': [
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'rank',
      'unit',
    ],
    "Запит про надання роз'яснень щодо рішень, ухвалених ТЦК стосовно мобілізації":
      ['email', 'name', 'surname', 'fatherName', 'birthday'],
    'Запит про надання інформації з питань мобілізації': [
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
    ],
    'Запит про надання інформації щодо дисциплінарних стягнень': [
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'rank',
      'unit',
      'date.start',
      'date.end',
    ],
    'Запит про надання інформації щодо надання відстрочки або звільнення від призову':
      ['email', 'name', 'surname', 'fatherName', 'birthday'],
    'Запит про надання інформації щодо нарахування та виплати грошового забезпечення':
      [
        'email',
        'name',
        'surname',
        'fatherName',
        'birthday',
        'rank',
        'unit',
        'date.start',
        'date.end',
      ],
    'Запит щодо медичної документації': [
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'rank',
      'unit',
      'date.start',
      'date.end',
    ],
    'Запит щодо надання довідки про обставини травми (поранення, контузії, каліцтва)':
      [
        'email',
        'name',
        'surname',
        'fatherName',
        'birthday',
        'servicemanPIB',
        'rank',
        'unit',
      ],
    'Запит щодо наказів про мобілізацію та військову службу': [
      'email',
      'name',
      'surname',
      'fatherName',
    ],
    'Запит щодо підтвердження правового статусу особи': [
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
    ],
    'Запит щодо результатів службового розслідування': [
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'rank',
      'unit',
    ],
    'Запит щодо розміру та видів грошового забезпечення, премій та надбавок': [
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'rank',
      'unit',
      'date.start',
      'date.end',
    ],
    'Запит щодо рішень, які прийняті за рапортами військовослужбовця': [
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'servicemanPIB',
      'rank',
      'unit',
      'date.start',
      'date.end',
    ],
    // ПФУ і ДПСУ
    'Запит про надання копій документів пенсійної справи': [
      'email',
      'name',
      'surname',
      'fatherName',
    ],
    'Запит про надання справки про відсутність заборгованості по податках': [
      'email',
      'name',
      'surname',
      'fatherName',
      'inn',
    ],
    'Запит про надання інформації щодо заборгованості по виплаті пенсії': [
      'email',
      'name',
      'surname',
      'fatherName',
    ],
    'Запит про надання інформації щодо застосування пільгового стажу': [
      'email',
      'name',
      'surname',
      'fatherName',
    ],
    'Запит про надання інформації щодо нарахування та виплати пенсії': [
      'email',
      'name',
      'surname',
      'fatherName',
    ],
    'Запит про надання інформації щодо перерахунку пенсії': [
      'email',
      'name',
      'surname',
      'fatherName',
    ],
    'Запит про надання інформації щодо призначення пенсії по інвалідності': [
      'email',
      'name',
      'surname',
      'fatherName',
    ],
    "Запит про надання інформації щодо призначення пенсії у зв'язку з втратою годувальника":
      ['email', 'name', 'surname', 'fatherName'],
    'Запит про надання інформації щодо підтвердження страхового стажу': [
      'email',
      'name',
      'surname',
      'fatherName',
    ],
    'Запит про надання інформації щодо стану податкової заборгованості': [
      'email',
      'name',
      'surname',
      'fatherName',
      'inn',
    ],
    'Запит про повернення або зарахування переплачених податків': [
      'email',
      'name',
      'surname',
      'fatherName',
      'inn',
    ],
    // МВС
    'Запит про надання довідки про відсутність судимості': [
      'email',
      'name',
      'surname',
      'fatherName',
    ],
    'Запит на надання копій протоколів та документів, підписаних водієм': [
      'email',
      'name',
      'surname',
      'fatherName',
      'eventDate',
      'eventTime',
      'eventPlace',
    ],
    'Запит про надання показань свідків або інших учасників події': [
      'email',
      'name',
      'surname',
      'fatherName',
      'birthday',
      'eventDate',
      'eventTime',
      'eventPlace',
    ],
    'Запит про надання інформації щодо правових підстав для зупинки автомобіля':
      [
        'email',
        'name',
        'surname',
        'fatherName',
        'birthday',
        'eventDate',
        'eventTime',
        'eventPlace',
      ],
    'Запит про надання інформації щодо стану та калібрування вимірювальних приладів':
      ['email', 'name', 'surname', 'fatherName', 'birthday'],
    'Запит про надання роз’яснень правових підстав накладення штрафу або іншого покарання за порушення ПДР':
      ['email', 'name', 'surname', 'fatherName', 'birthday'],
    // ВПО
    'Запит про надання інформації щодо компенсації за втрачене майно до Міністерства з питань реінтеграції тимчасово окупованих територій':
      [
        'citizenship',
        'email',
        'name',
        'surname',
        'fatherName',
        'propertyAddress',
      ],
    'Запит про надання підтвердження факту знищення або пошкодження майна в результаті бойових дій':
      [
        'citizenship',
        'email',
        'name',
        'surname',
        'fatherName',
        'propertyAddress',
      ],
    'Запит про надання інформації щодо отримання соціальної допомоги та компенсацій':
      ['citizenship', 'email', 'name', 'surname', 'fatherName', 'birthday'],
    'Запит про надання інформації щодо фіксації факту пошкодження майна від ДСНС':
      [
        'citizenship',
        'email',
        'name',
        'surname',
        'fatherName',
        'birthday',
        'propertyAddress',
      ],
  };

  const requestNameToKeyMap = {
    //МОУ і ТЦК
    'Запит про надання копій документів особової справи':
      'Запит про надання копій документів особової справи',
    "Запит про надання роз'яснень щодо рішень, ухвалених ТЦК стосовно мобілізації":
      "Запит про надання роз'яснень щодо рішень, ухвалених ТЦК стосовно мобілізації",
    'Запит про надання інформації з питань мобілізації':
      'Запит про надання інформації з питань мобілізації',
    'Запит про надання інформації щодо дисциплінарних стягнень':
      'Запит про надання інформації щодо дисциплінарних стягнень',
    'Запит про надання інформації щодо надання відстрочки або звільнення від призову':
      'Запит про надання інформації щодо надання відстрочки або звільнення від призову',
    'Запит про надання інформації щодо нарахування та виплати грошового забезпечення':
      'Запит про надання інформації щодо нарахування та виплати грошового забезпечення',
    'Запит щодо медичної документації': 'Запит щодо медичної документації',
    'Запит щодо надання довідки про обставини травми (поранення, контузії, каліцтва)':
      'Запит щодо надання довідки про обставини травми (поранення, контузії, каліцтва)',
    'Запит щодо наказів про мобілізацію та військову службу':
      'Запит щодо наказів про мобілізацію та військову службу',
    'Запит щодо підтвердження правового статусу особи':
      'Запит щодо підтвердження правового статусу особи',
    'Запит щодо результатів службового розслідування':
      'Запит щодо результатів службового розслідування',
    'Запит щодо розміру та видів грошового забезпечення, премій та надбавок':
      'Запит щодо розміру та видів грошового забезпечення, премій та надбавок',
    'Запит щодо рішень, які прийняті за рапортами військовослужбовця':
      'Запит щодо рішень, які прийняті за рапортами військовослужбовця',
    // ПФУ і ДПСУ
    'Запит про надання копій документів пенсійної справи':
      'Запит про надання копій документів пенсійної справи',
    'Запит про надання справки про відсутність заборгованості по податках':
      'Запит про надання справки про відсутність заборгованості по податках',
    'Запит про надання інформації щодо заборгованості по виплаті пенсії':
      'Запит про надання інформації щодо заборгованості по виплаті пенсії',
    'Запит про надання інформації щодо застосування пільгового стажу':
      'Запит про надання інформації щодо застосування пільгового стажу',
    'Запит про надання інформації щодо нарахування та виплати пенсії':
      'Запит про надання інформації щодо нарахування та виплати пенсії',
    'Запит про надання інформації щодо перерахунку пенсії':
      'Запит про надання інформації щодо перерахунку пенсії',
    'Запит про надання інформації щодо призначення пенсії по інвалідності':
      'Запит про надання інформації щодо призначення пенсії по інвалідності',
    "Запит про надання інформації щодо призначення пенсії у зв'язку з втратою годувальника":
      "Запит про надання інформації щодо призначення пенсії у зв'язку з втратою годувальника",
    'Запит про надання інформації щодо підтвердження страхового стажу':
      'Запит про надання інформації щодо підтвердження страхового стажу',
    'Запит про надання інформації щодо стану податкової заборгованості':
      'Запит про надання інформації щодо стану податкової заборгованості',
    'Запит про повернення або зарахування переплачених податків':
      'Запит про повернення або зарахування переплачених податків',
    // ДРАЦС /РАЦС(на рус)
    'Запит про надання довідки про зміну імені або прізвища':
      'Запит про надання довідки про зміну імені або прізвища',
    'Запит про надання довідки про місце реєстрації проживання':
      'Запит про надання довідки про місце реєстрації проживання',
    'Запит про надання довідки про сімейний стан':
      'Запит про надання довідки про сімейний стан',
    'Запит про надання копії свідоцтва про народження':
      'Запит про надання копії свідоцтва про народження',
    'Запит про надання копії свідоцтва про розірвання шлюбу':
      'Запит про надання копії свідоцтва про розірвання шлюбу',
    'Запит про надання копії свідоцтва про смерть':
      'Запит про надання копії свідоцтва про смерть',
    'Запит про надання копії свідоцтва про шлюб':
      'Запит про надання копії свідоцтва про шлюб',
    // МВС
    'Запит про надання довідки про відсутність судимості':
      'Запит про надання довідки про відсутність судимості',
    'Запит на надання копій протоколів та документів, підписаних водієм':
      'Запит на надання копій протоколів та документів, підписаних водієм',
    'Запит про надання показань свідків або інших учасників події':
      'Запит про надання показань свідків або інших учасників події',
    'Запит про надання інформації щодо правових підстав для зупинки автомобіля':
      'Запит про надання інформації щодо правових підстав для зупинки автомобіля',
    'Запит про надання інформації щодо стану та калібрування вимірювальних приладів':
      'Запит про надання інформації щодо стану та калібрування вимірювальних приладів',
    'Запит про надання роз’яснень правових підстав накладення штрафу або іншого покарання за порушення ПДР':
      'Запит про надання роз’яснень правових підстав накладення штрафу або іншого покарання за порушення ПДР',
    // ВПО
    'Запит про надання інформації щодо компенсації за втрачене майно до Міністерства з питань реінтеграції тимчасово окупованих територій':
      'Запит про надання інформації щодо компенсації за втрачене майно до Міністерства з питань реінтеграції тимчасово окупованих територій',
    'Запит про надання підтвердження факту знищення або пошкодження майна в результаті бойових дій':
      'Запит про надання підтвердження факту знищення або пошкодження майна в результаті бойових дій',
    'Запит про надання інформації щодо отримання соціальної допомоги та компенсацій':
      'Запит про надання інформації щодо отримання соціальної допомоги та компенсацій',
    'Запит про надання інформації щодо фіксації факту пошкодження майна від ДСНС':
      'Запит про надання інформації щодо фіксації факту пошкодження майна від ДСНС',
    // АДПСУ / адміністрації ДПСУ
    'Запит про вилучення інформації з бази даних ДПСУ щодо тимчасового обмеження у праві виїзду з України':
      'Запит про вилучення інформації з бази даних ДПСУ щодо тимчасового обмеження у праві виїзду з України',
    "Запит про надання копій документів, пов'язаних з міграційними процедурами":
      "Запит про надання копій документів, пов'язаних з міграційними процедурами",
    "Запит про надання копій документів, пов'язаних з перетином кордону":
      "Запит про надання копій документів, пов'язаних з перетином кордону",
    'Запит про надання інформації щодо затримання або відмови у пропуску через державний кордон':
      'Запит про надання інформації щодо затримання або відмови у пропуску через державний кордон',
    'Запит про надання інформації щодо наявності або відсутності громадянства України у особи':
      'Запит про надання інформації щодо наявності або відсутності громадянства України у особи',
    "Запит про надання інформації щодо наявності або відсутності заборони на в'їзд в Україну":
      "Запит про надання інформації щодо наявності або відсутності заборони на в'їзд в Україну",
    'Запит про надання інформації щодо наявності обмежень на виїзд за кордон':
      'Запит про надання інформації щодо наявності обмежень на виїзд за кордон',
    'Запит про надання інформації щодо перетину державного кордону особою':
      'Запит про надання інформації щодо перетину державного кордону особою',
    'Запит про надання інформації щодо реєстрації місця проживання або перебування особи':
      'Запит про надання інформації щодо реєстрації місця проживання або перебування особи',
    'Запит про надання інформації щодо рішень про депортацію або примусове видворення':
      'Запит про надання інформації щодо рішень про депортацію або примусове видворення',
    'Запит про надання інформації щодо стану розгляду заяв або клопотань':
      'Запит про надання інформації щодо стану розгляду заяв або клопотань',
    "Запит про наявність рішення про заборону в'їзду для іноземця або особи без громадянства":
      "Запит про наявність рішення про заборону в'їзду для іноземця або особи без громадянства",
    'Запит про наявність тимчасового обмеження у праві виїзду за кордон':
      'Запит про наявність тимчасового обмеження у праві виїзду за кордон',
  };

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
        // console.log(recipient);

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
    // console.log(formData);
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

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   console.log(formData);

  //   try {
  //     const dataToSend = new FormData();
  //     Object.entries(formData).forEach(([key, value]) => {
  //       if (value instanceof File) {
  //         dataToSend.append(key, value, value.name);
  //       } else {
  //         dataToSend.append(key, value);
  //       }
  //     });

  //     const submitResponse = await fetch("/submit", {
  //       method: "POST",
  //       body: dataToSend,
  //     });

  //     if (!submitResponse.ok) {
  //       throw new Error("Error submitting the form");
  //     }

  //     const submitResult = await submitResponse.json();
  //     console.log("Form submission success:", submitResult);

  //     const paymentResponse = await fetch("/api/liqpay", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           amount: "0.1",
  //           currency: "UAH",
  //           description: title || "Payment",
  //           currentLanguage: currentLanguage,
  //           returnUrl,
  //           order_id: `order_${Date.now()}_${Math.random()
  //             .toString(36)
  //             .substr(2, 9)}`,
  //         }),
  //     });

  //     if (!paymentResponse.ok) {
  //       throw new Error("Error initializing payment");
  //     }

  //     const paymentData = await paymentResponse.json();
  //     console.log("Payment initialized:", paymentData);

  //     const paymentForm = document.createElement("form");
  //     paymentForm.method = "POST";
  //     paymentForm.action = "https://www.liqpay.ua/api/3/checkout";
  //     paymentForm.acceptCharset = "utf-8";

  //     const inputData = document.createElement("input");
  //     inputData.type = "hidden";
  //     inputData.name = "data";
  //     inputData.value = paymentData.data;

  //     const inputSignature = document.createElement("input");
  //     inputSignature.type = "hidden";
  //     inputSignature.name = "signature";
  //     inputSignature.value = paymentData.signature;

  //     paymentForm.appendChild(inputData);
  //     paymentForm.appendChild(inputSignature);

  //     document.body.appendChild(paymentForm);
  //     paymentForm.submit();
  //   } catch (error) {
  //     console.error("Error:", error);
  //     alert("An error occurred. Please try again.");
  //   } finally {
  //     savePDF();
  //     setStatusRenewUser(true);
  //   }
  // };

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

  const handleSendEmail = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pdf/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: formData.uid,
          // recipient: { address: formData.recipient.address },
          recipient: { address: 'julia.j.shcherban@gmail.com' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text(); // Отримуємо деталі помилки
        throw new Error(`Помилка сервера: ${errorText}`);
      }

      const data = await response.json();
      if (response.ok) {
        console.log('Email успішно відправлено:', data.message);
      } else {
        console.error('Помилка:', data.error);
      }
    } catch (err) {
      console.error('Помилка під час відправки запиту:', err);
    } finally {
      setIsLoading(false);
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
          <h1>{t('Create a lawyer request')}:</h1>
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
          {/* <Payment request={request} currentLanguage={currentLanguage} /> */}
          <button
            // onClick={(e) => handleSubmit(e)}
            disabled={isLoading || isSubmitDisabled}
            type="submit"
            className={styles.orderForm__form_button}
          >
            {isLoading ? t('Saving...') : t('Next')}
          </button>
          <button
            onClick={handleSendEmail}
            type="button"
            className={styles.orderForm__form_button}
          >
            {isLoading ? t('Sending') : t('Send')}
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
