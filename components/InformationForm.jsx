import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { clsx } from 'clsx';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
});

import styles from '../styles/informationForm.module.scss';
import {
  createNewPost,
  updateDocumentInCollection,
  uploadFileToStorage,
} from '../helpers/firebaseControl';

export const InformationForm = ({
  type,
  func,
  setIsModal,
  currentInfoItem,
}) => {
  console.log('currentInfoItem:', currentInfoItem);
  console.log('func:', func);
  console.log('type:', type);
  const selectValues = [
    'Прохождение пограничного контроля',
    'Прохождение таможенного контроля',
    'Запрет на въезд в Украину',
    'Депортация из Украины',
    'Легализация в Украине',
    'Документ сервис',
    'Мониторинг',
    'Гражданство',
  ];
  const selectRequestValues = [
    'Запросы в органы РАЦС (регистрация актов гражданского состояния)',
    'Запросы в Министерство внутренних дел Украины (МВД)',
    'Запросы, связанные с временно перемещёнными лицами (ВПЛ)',
    'Запросы в Пенсионный фонд Украины (ПФУ) и Государственную пограничную службу Украины (ДПСУ)',
    'Запросы в Министерство обороны Украины (МОУ) и территориальные центры комплектования (ТЦК)',
    'Запросы в Государственную миграционную службу Украины (ДМСУ) и администрацию ДПСУ',
  ];

  const modules = {
    toolbar: [
      [{ header: [2, 3, false] }],
      ['bold', 'italic', 'underline', 'link'],
      [{ list: 'ordered' }, { list: 'bullet' }],
    ],
  };

  const [file, setFile] = useState(null);
  const [dataModal, setDataModal] = useState({
    image: '',

    ua: {
      title: '',
      preview: '',
      text: '',
    },

    ru: {
      title: '',
      preview: '',
      text: '',
    },
    en: {
      title: '',
      preview: '',
      text: '',
    },
    path: '',
    type,
    recipient: '',
  });

  const [tabsState, setTabsState] = useState({
    ua: true,
    en: false,
    ru: false,
  });

  const [serviceType, setServiceType] = useState(
    'Прохождение пограничного контроля'
  );

  const [requestType, setRequestType] = useState(
    'Запросы в органы РАЦС (регистрация актов гражданского состояния)'
  );

  const getRightserviseType = type => {
    switch (type) {
      case 'Прохождение пограничного контроля':
        return {
          ua: 'Проходження прикордонного контролю',
          ru: 'Прохождение пограничного контроля',
          en: 'Border control',
        };

      case 'Прохождение таможенного контроля':
        return {
          ua: 'Проходження митного контролю',
          ru: 'Прохождение таможенного контроля',
          en: 'Customs control',
        };

      case 'Запрет на въезд в Украину':
        return {
          ua: "Заборона на в'їзд в Україну",
          ru: 'Запрет на въезд в Украину',
          en: 'Ban on entry into Ukraine',
        };

      case 'Депортация из Украины':
        return {
          ua: 'Депортація з України',
          ru: 'Депортация из Украины',
          en: 'Deportation from Ukraine',
        };

      case 'Легализация в Украине':
        return {
          ua: 'Легалізація в Україні',
          ru: 'Легализация в Украине',
          en: 'Legalization in Ukraine',
        };

      case 'Документ сервис':
        return {
          ua: 'Документ сервіс',
          ru: 'Документ сервис',
          en: 'Document service',
        };

      case 'Мониторинг':
        return {
          ua: 'Моніторинг',
          ru: 'Мониторинг',
          en: 'Monitoring',
        };

      case 'Гражданство':
        return {
          ua: 'Громадянство',
          ru: 'Гражданство',
          en: 'Citizenship',
        };

      case 'Адвокатские запросы':
        return {
          ua: 'Адвокатські запити',
          ru: 'Адвокатские запросы',
          en: 'Lawyers requests',
        };

      default:
        return {};
    }
  };

  const getRightRequestType = type => {
    switch (type) {
      case 'Запросы в органы РАЦС (регистрация актов гражданского состояния)':
        return {
          ua: 'Запити до органів ДРАЦС (реєстрація актів цивільного стану)',
          ru: 'Запросы в органы РАЦС (регистрация актов гражданского состояния)',
          en: 'Requests to the Civil Registry Offices (registration of civil status acts)',
        };

      case 'Запросы в Министерство внутренних дел Украины (МВД)':
        return {
          ua: 'Запити до Міністерства внутрішніх справ України (МВС)',
          ru: 'Запросы в Министерство внутренних дел Украины (МВД)',
          en: 'Requests to the Ministry of Internal Affairs of Ukraine (MIA)',
        };

      case ' Запросы, связанные с временно перемещёнными лицами (ВПЛ)':
        return {
          ua: 'Запити, пов’язані з внутрішньо переміщеними особами (ВПО)',
          ru: 'Запросы, связанные с временно перемещёнными лицами (ВПЛ)',
          en: 'Requests related to internally displaced persons (IDPs)',
        };

      case 'Запросы в Пенсионный фонд Украины (ПФУ) и Государственную пограничную службу Украины (ДПСУ)':
        return {
          ua: 'Запити до Пенсійного фонду України (ПФУ) та Державної прикордонної служби України (ДПСУ)',
          ru: 'Запросы в Пенсионный фонд Украины (ПФУ) и Государственную пограничную службу Украины (ДПСУ)',
          en: 'Requests to the Pension Fund of Ukraine (PFU) and the State Border Guard Service of Ukraine (SBGS)',
        };

      case 'Запросы в Министерство обороны Украины (МОУ) и территориальные центры комплектования (ТЦК)':
        return {
          ua: 'Запити до Міністерства оборони України (МОУ) та територіальних центрів комплектування (ТЦК)',
          ru: 'Запросы в Министерство обороны Украины (МОУ) и территориальные центры комплектования (ТЦК)',
          en: 'Requests to the Ministry of Defense of Ukraine and Territorial Recruitment Centers (TRCs)',
        };

      case 'Запросы в Государственную миграционную службу Украины (ДМСУ) и администрацию ДПСУ':
        return {
          ua: 'Запити до Державної міграційної служби України (ДМСУ) та адміністрації ДПСУ',
          ru: 'Запросы в Государственную миграционную службу Украины (ДМСУ) и администрацию ДПСУ',
          en: 'Requests to the State Migration Service of Ukraine (SMSU) and the Administration of SBGS',
        };

      default:
        return {};
    }
  };

  const inputRef = useRef();

  const handleChangePhoto = e => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      const reader = new FileReader();

      reader.onloadend = () => {
        setDataModal({ ...dataModal, image: reader.result });
      };

      reader.readAsDataURL(e.target.files[0]);
      inputRef.current.focus();
    }
  };

  const handleTabsChange = e => {
    setTabsState({
      ru: false,
      en: false,
      ua: false,
      [e.currentTarget.name]: true,
    });
  };

  const handleChangeModalWithLang = (fieldName, newValue, lang) => {
    console.log(fieldName);
    setDataModal({
      ...dataModal,
      [lang]: { ...dataModal[lang], [fieldName]: newValue },
    });
  };

  const handleChangeModal = (fieldName, newValue) => {
    setDataModal({
      ...dataModal,
      [fieldName]: newValue.trim(),
    });
  };

  const handleSubmitModal =
    func === 'updateInfo'
      ? async e => {
          e.preventDefault();

          const newData = Object.values({
            titleRu: dataModal.ru.title,
            previewRu: dataModal.ru.preview,
            textRu: dataModal.ru.text,

            titleEn: dataModal.en.title,
            previewEn: dataModal.en.preview,
            textEn: dataModal.en.text,

            titleUa: dataModal.ua.title,
            previewUa: dataModal.ua.preview,
            textUa: dataModal.ua.text,

            path: dataModal.path,
            recipient: dataModal.recipient,
          });

          if (newData.some(el => el.length !== 0)) {
            try {
              type === 'services'
                ? await updateDocumentInCollection(
                    `${currentInfoItem.type}`,
                    {
                      ...currentInfoItem,
                      ru: {
                        title:
                          dataModal.ru.title.length > 0
                            ? dataModal.ru.title
                            : currentInfoItem.ru.title,
                        text:
                          dataModal.ru.text.length > 0
                            ? dataModal.ru.text
                            : currentInfoItem.ru.text,
                      },
                      en: {
                        title:
                          dataModal.en.title.length > 0
                            ? dataModal.en.title
                            : currentInfoItem.en.title,
                        text:
                          dataModal.en.text.length > 0
                            ? dataModal.en.text
                            : currentInfoItem.en.text,
                      },
                      ua: {
                        title:
                          dataModal.ua.title.length > 0
                            ? dataModal.ua.title
                            : currentInfoItem.ua.title,
                        text:
                          dataModal.ua.text.length > 0
                            ? dataModal.ua.text
                            : currentInfoItem.ua.text,
                      },

                      path:
                        dataModal.path.length > 0
                          ? dataModal.path
                          : currentInfoItem.path,
                      dateCreating: format(new Date(), 'yyyy-MM-dd HH:mm'),
                    },
                    currentInfoItem.idPost
                  )
                : type === 'requests'
                ? await updateDocumentInCollection(
                    `${currentInfoItem.type}`,
                    {
                      ...currentInfoItem,
                      ru: {
                        title:
                          dataModal.ru.title.length > 0
                            ? dataModal.ru.title
                            : currentInfoItem.ru.title,
                        text:
                          dataModal.ru.text.length > 0
                            ? dataModal.ru.text
                            : currentInfoItem.ru.text,
                      },
                      en: {
                        title:
                          dataModal.en.title.length > 0
                            ? dataModal.en.title
                            : currentInfoItem.en.title,
                        text:
                          dataModal.en.text.length > 0
                            ? dataModal.en.text
                            : currentInfoItem.en.text,
                      },
                      ua: {
                        title:
                          dataModal.ua.title.length > 0
                            ? dataModal.ua.title
                            : currentInfoItem.ua.title,
                        text:
                          dataModal.ua.text.length > 0
                            ? dataModal.ua.text
                            : currentInfoItem.ua.text,
                      },

                      path:
                        dataModal.path.length > 0
                          ? dataModal.path
                          : currentInfoItem.path,

                      recipient:
                        dataModal.recipient.length > 0
                          ? dataModal.recipient
                          : currentInfoItem.recipient,

                      dateCreating: format(new Date(), 'yyyy-MM-dd HH:mm'),
                    },
                    currentInfoItem.idPost
                  )
                : await updateDocumentInCollection(
                    `${currentInfoItem.type}`,
                    {
                      ...currentInfoItem,
                      ru: {
                        title:
                          dataModal.ru.title.length > 0
                            ? dataModal.ru.title
                            : currentInfoItem.ru.title,
                        preview:
                          dataModal.ru.preview.length > 0
                            ? dataModal.ru.preview
                            : currentInfoItem.ru.preview,
                        text:
                          dataModal.ru.text.length > 0
                            ? dataModal.ru.text
                            : currentInfoItem.ru.text,
                      },
                      en: {
                        title:
                          dataModal.en.title.length > 0
                            ? dataModal.en.title
                            : currentInfoItem.en.title,
                        preview:
                          dataModal.en.preview.length > 0
                            ? dataModal.en.preview
                            : currentInfoItem.en.preview,
                        text:
                          dataModal.en.text.length > 0
                            ? dataModal.en.text
                            : currentInfoItem.en.text,
                      },
                      ua: {
                        title:
                          dataModal.ua.title.length > 0
                            ? dataModal.ua.title
                            : currentInfoItem.ua.title,
                        preview:
                          dataModal.ua.preview.length > 0
                            ? dataModal.ua.preview
                            : currentInfoItem.ua.preview,
                        text:
                          dataModal.ua.text.length > 0
                            ? dataModal.ua.text
                            : currentInfoItem.ua.text,
                      },

                      path:
                        dataModal.path.length > 0
                          ? dataModal.path
                          : currentInfoItem.path,
                      dateCreating: format(new Date(), 'yyyy-MM-dd HH:mm'),
                    },
                    currentInfoItem.idPost
                  );
            } catch (error) {
              alert(error);
            }
          }

          if (file) {
            try {
              await uploadFileToStorage(
                file,
                currentInfoItem.idPost,
                currentInfoItem
              );
            } catch (error) {
              console.log(error);
              alert(error);
            }
          }

          setIsModal(false);
        }
      : async e => {
          e.preventDefault();
          const fullServiseType = getRightserviseType(serviceType);
          const fullRequestType = getRightRequestType(requestType);

          try {
            type === 'requests'
              ? createNewPost(dataModal, file, type, fullRequestType)
              : createNewPost(dataModal, file, type, fullServiseType);

            setIsModal(false);
          } catch (error) {
            alert(error);
          }
        };

  useEffect(() => {
    if (serviceType === 'Гражданство') {
      setDataModal({ ...dataModal, type: 'citizenship' });
    }
  }, [serviceType]);

  return (
    <form className={styles.form} onSubmit={e => handleSubmitModal(e)}>
      <div className={styles.image}>
        <img
          src={
            dataModal.image.length > 0
              ? dataModal.image || '../../addPhoto.svg'
              : currentInfoItem
              ? currentInfoItem.image || '../../addPhoto.svg'
              : dataModal.image || '../../addPhoto.svg'
          }
          alt="image"
          className={styles.image__img}
        />
        <label>
          <div className={styles.addPhoto}>
            <img src="../../photo.svg" alt="add photo" />
          </div>

          <input
            type="file"
            onChange={e => handleChangePhoto(e)}
            className={styles.file}
            ref={inputRef}
          />
        </label>
      </div>

      {type === 'services' && func !== 'updateInfo' && (
        <select
          className={styles.input}
          onChange={e => setServiceType(e.target.value)}
        >
          {selectValues.map(el => {
            return <option key={el}>{el}</option>;
          })}
        </select>
      )}

      {type === 'requests' && func !== 'updateInfo' && (
        <select
          className={styles.input}
          onChange={e => setRequestType(e.target.value)}
        >
          {selectRequestValues.map(el => {
            return <option key={el}>{el}</option>;
          })}
        </select>
      )}

      <div>
        <div className={styles.tabs}>
          <button
            type="button"
            name="ua"
            className={clsx([styles.tabs__button], {
              [styles.tabs__button__active]: tabsState.ua,
            })}
            onClick={e => handleTabsChange(e)}
          >
            Ua
          </button>
          <button
            type="button"
            name="en"
            className={clsx([styles.tabs__button], {
              [styles.tabs__button__active]: tabsState.en,
            })}
            onClick={e => handleTabsChange(e)}
          >
            En
          </button>
          <button
            type="button"
            name="ru"
            className={clsx([styles.tabs__button], {
              [styles.tabs__button__active]: tabsState.ru,
            })}
            onClick={e => handleTabsChange(e)}
          >
            Ru
          </button>
        </div>

        {tabsState.ua && (
          <div
            className={clsx([styles.tabs__body], {
              [styles.tabs__body__right]: tabsState.ua,
              [styles.tabs__body__left]: tabsState.ru,
              [styles.tabs__body__center]: tabsState.en,
            })}
          >
            {(type === 'services' || type === 'citizenship') &&
              func === 'updateInfo' && (
                <p className={styles.serviceType}>
                  {`${currentInfoItem.serviceType.ua}:`}{' '}
                </p>
              )}

            {type === 'requests' && func === 'updateInfo' && (
              <p className={styles.requestType}>
                {`${currentInfoItem.requestType.ua}:`}{' '}
              </p>
            )}

            <input
              type="text"
              placeholder="заголовок"
              value={
                dataModal.ua.title.length > 0
                  ? dataModal.ua.title
                  : currentInfoItem
                  ? currentInfoItem.ua.title
                  : dataModal.ua.title
              }
              className={styles.input}
              onChange={e =>
                handleChangeModalWithLang('title', e.target.value, 'ua')
              }
              autoFocus
              ref={inputRef}
            />

            {type !== 'services' && type !== 'requests' && (
              <textarea
                type="text"
                placeholder="прев'ю"
                value={
                  dataModal.ua.preview.length > 0
                    ? dataModal.ua.preview
                    : currentInfoItem
                    ? currentInfoItem.ua.preview
                    : dataModal.ua.preview
                }
                className={styles.input}
                onChange={e =>
                  handleChangeModalWithLang('preview', e.target.value, 'ua')
                }
              />
            )}

            <div className={styles.label}>
              <p className={styles.label__p}>Основний текст</p>
              <div className={styles.ReactQuill}>
                <ReactQuill
                  value={
                    dataModal.ua.text.length > 0
                      ? dataModal.ua.text
                      : currentInfoItem
                      ? currentInfoItem.ua.text
                      : dataModal.ua.text
                  }
                  onChange={e => handleChangeModalWithLang('text', e, 'ua')}
                  modules={modules}
                />
              </div>
            </div>
          </div>
        )}

        {tabsState.en && (
          <div
            className={clsx([styles.tabs__body], {
              [styles.tabs__body__right]: tabsState.ua,
              [styles.tabs__body__left]: tabsState.ru,
              [styles.tabs__body__center]: tabsState.en,
            })}
          >
            {(type === 'services' || type === 'citizenship') &&
              func === 'updateInfo' && (
                <p className={styles.serviceType}>
                  {`${currentInfoItem.serviceType.en}:`}{' '}
                </p>
              )}

            {type === 'requests' && func === 'updateInfo' && (
              <p className={styles.requestType}>
                {`${currentInfoItem.requestType.en}:`}{' '}
              </p>
            )}

            <input
              type="text"
              placeholder="title"
              value={
                dataModal.en.title.length > 0
                  ? dataModal.en.title
                  : currentInfoItem
                  ? currentInfoItem.en.title
                  : dataModal.en.title
              }
              className={styles.input}
              onChange={e =>
                handleChangeModalWithLang('title', e.target.value, 'en')
              }
              autoFocus
              ref={inputRef}
            />
            {type !== 'services' && type !== 'requests' && (
              <textarea
                type="text"
                placeholder="preview"
                value={
                  dataModal.en.preview.length > 0
                    ? dataModal.en.preview
                    : currentInfoItem
                    ? currentInfoItem.en.preview
                    : dataModal.en.preview
                }
                className={styles.input}
                onChange={e =>
                  handleChangeModalWithLang('preview', e.target.value, 'en')
                }
              />
            )}

            <div className={styles.label}>
              <p className={styles.label__p}>Main text</p>
              <div className={styles.ReactQuill}>
                <ReactQuill
                  modules={modules}
                  value={
                    dataModal.en.text.length > 0
                      ? dataModal.en.text
                      : currentInfoItem
                      ? currentInfoItem.en.text
                      : dataModal.en.text
                  }
                  onChange={e => handleChangeModalWithLang('text', e, 'en')}
                />
              </div>
            </div>
          </div>
        )}

        {tabsState.ru && (
          <div
            className={clsx([styles.tabs__body], {
              [styles.tabs__body__right]: tabsState.ua,
              [styles.tabs__body__left]: tabsState.ru,
              [styles.tabs__body__center]: tabsState.en,
            })}
          >
            {(type === 'services' || type === 'citizenship') &&
              func === 'updateInfo' && (
                <p className={styles.serviceType}>
                  {`${currentInfoItem.serviceType.ru}:`}{' '}
                </p>
              )}
            {type === 'requests' && func === 'updateInfo' && (
              <p className={styles.requestType}>
                {`${currentInfoItem.requestType.ru}:`}{' '}
              </p>
            )}

            <input
              type="text"
              placeholder="заголовок"
              value={
                dataModal.ru.title.length > 0
                  ? dataModal.ru.title
                  : currentInfoItem
                  ? currentInfoItem.ru.title
                  : dataModal.ru.title
              }
              className={styles.input}
              onChange={e =>
                handleChangeModalWithLang('title', e.target.value, 'ru')
              }
              autoFocus
              ref={inputRef}
            />
            {type !== 'services' && type !== 'requests' && (
              <textarea
                type="text"
                placeholder="превью"
                value={
                  dataModal.ru.preview.length > 0
                    ? dataModal.ru.preview
                    : currentInfoItem
                    ? currentInfoItem.ru.preview
                    : dataModal.ru.preview
                }
                className={styles.input}
                onChange={e =>
                  handleChangeModalWithLang('preview', e.target.value, 'ru')
                }
              />
            )}

            <div className={styles.label}>
              <p className={styles.label__p}>Основной текст</p>
              <div className={styles.ReactQuill}>
                <ReactQuill
                  modules={modules}
                  value={
                    dataModal.ru.text.length > 0
                      ? dataModal.ru.text
                      : currentInfoItem
                      ? currentInfoItem.ru.text
                      : dataModal.ru.text
                  }
                  onChange={e => handleChangeModalWithLang('text', e, 'ru')}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <input
        className={styles.input}
        type="text"
        placeholder="путь в формате 'vyezd-s-ukrainy'"
        value={
          dataModal.path.length > 0
            ? dataModal.path
            : currentInfoItem
            ? currentInfoItem.path
            : dataModal.path
        }
        onChange={e => handleChangeModal('path', e.target.value)}
      />

      {(type === 'requests' || type === 'request') &&
        (func === 'addItem' || func === 'updateInfo') && (
          <input
            className={styles.input}
            type="text"
            placeholder="адресат в формате 'mvs'"
            value={
              dataModal.recipient.length > 0
                ? dataModal.recipient
                : currentInfoItem
                ? currentInfoItem.recipient
                : dataModal.recipient
            }
            onChange={e => handleChangeModal('recipient', e.target.value)}
          />
        )}

      <button type="submit" className={styles.submitButton}>
        {func === 'updateInfo' ? 'Обновить' : 'Добавить'}
      </button>
    </form>
  );
};
