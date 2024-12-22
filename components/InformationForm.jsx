import { useEffect, useRef, useState } from 'react';
import {format} from 'date-fns';
import dynamic from "next/dynamic";
import { clsx } from 'clsx';

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false
});

import styles from '../styles/informationForm.module.scss';
import { createNewPost, updateDocumentInCollection, uploadFileToStorage } from "../helpers/firebaseControl";

export const InformationForm = ({ type, func, setIsModal, currentInfoItem}) => {
  const selectValues = [
    'Прохождение пограничного контроля',
    'Прохождение таможенного контроля',
    'Запрет на въезд в Украину',
    'Депортация из Украины',
    'Легализация в Украине',
    'Документ сервис',
    'Мониторинг',
    'Гражданство'
  ];

  const modules = {
    toolbar: [
      [{header: [2, 3, false ]}],
      ["bold", "italic", "underline", "link"],
      [
        {list: "ordered"},
        {list: "bullet"},
      ]
    ],
  };

  const [file, setFile] = useState(null);
  const [dataModal, setDataModal] = useState({image: '', 

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
});


  const [tabsState, setTabsState] = useState({
    ua: true,
    en: false,
    ru: false,
  });

  const [serviceType, setServiceType] = useState('Прохождение пограничного контроля');

  const getRightserviseType = (type) => {
    switch(type) {
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
          ua: 'Заборона на в\'їзд в Україну',
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

      default: 
        return {};
    };
  };

  const inputRef = useRef();
  
  const handleChangePhoto = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      const reader = new FileReader();

      reader.onloadend = () => {
        setDataModal({...dataModal, image: reader.result});
      };
    
      reader.readAsDataURL(e.target.files[0]);
      inputRef.current.focus();
    }
  };

  const handleTabsChange = (e) => {
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
      [lang]: {...dataModal[lang],  [fieldName]: newValue} ,
    });
  };

  const handleChangeModal = (fieldName, newValue) => {
    setDataModal({
      ...dataModal,
      [fieldName]: newValue.trim(),
    });
  };

  const handleSubmitModal = func === 'updateInfo' ? (
    async (e) => {
      e.preventDefault();    

      const newData = Object.values({
        titleRu: dataModal.ru.title, 
        previewRu:  dataModal.ru.preview,
        textRu:  dataModal.ru.text,
        
        titleEn: dataModal.en.title, 
        previewEn:  dataModal.en.preview,
        textEn:  dataModal.en.text,

        titleUa: dataModal.ua.title, 
        previewUa:  dataModal.ua.preview,
        textUa:  dataModal.ua.text,

        path: dataModal.path,
      });
      
      if (newData.some(el => el.length !== 0)) {
        try {
          type === 'services' ? 
          await updateDocumentInCollection(`${currentInfoItem.type}`, {
            ...currentInfoItem, 
            ru: {
              title: dataModal.ru.title.length > 0  ? dataModal.ru.title : currentInfoItem.ru.title, 
              text: dataModal.ru.text.length > 0  ? dataModal.ru.text : currentInfoItem.ru.text,
            },
            en: {
              title: dataModal.en.title.length > 0  ? dataModal.en.title : currentInfoItem.en.title,
              text: dataModal.en.text.length > 0  ? dataModal.en.text : currentInfoItem.en.text,
            },
            ua: {
              title: dataModal.ua.title.length > 0  ? dataModal.ua.title : currentInfoItem.ua.title, 
              text: dataModal.ua.text.length > 0  ? dataModal.ua.text : currentInfoItem.ua.text,
            },

            path: dataModal.path.length > 0  ? dataModal.path : currentInfoItem.path,
            dateCreating: format(new Date(), 'yyyy-MM-dd HH:mm'),
            
          }, currentInfoItem.idPost)

          :
          await updateDocumentInCollection(`${currentInfoItem.type}`, {
            ...currentInfoItem, 
            ru: {
              title: dataModal.ru.title.length > 0  ? dataModal.ru.title : currentInfoItem.ru.title,
              preview: dataModal.ru.preview.length > 0  ? dataModal.ru.preview : currentInfoItem.ru.preview,
              text: dataModal.ru.text.length > 0  ? dataModal.ru.text : currentInfoItem.ru.text,
            },
            en: {
              title: dataModal.en.title.length > 0  ? dataModal.en.title : currentInfoItem.en.title,
              preview: dataModal.en.preview.length > 0  ? dataModal.en.preview : currentInfoItem.en.preview,
              text: dataModal.en.text.length > 0  ? dataModal.en.text : currentInfoItem.en.text,
            },
            ua: {
              title: dataModal.ua.title.length > 0  ? dataModal.ua.title : currentInfoItem.ua.title, 
              preview: dataModal.ua.preview.length > 0  ? dataModal.ua.preview : currentInfoItem.ua.preview,
              text: dataModal.ua.text.length > 0  ? dataModal.ua.text : currentInfoItem.ua.text,
            },

            path: dataModal.path.length > 0  ? dataModal.path : currentInfoItem.path,
            dateCreating: format(new Date(), 'yyyy-MM-dd HH:mm'),
            
          }, currentInfoItem.idPost);

        } catch (error) {
          alert(error);
        }
      };

      if (file) {
        try {
          
          await  uploadFileToStorage(file, currentInfoItem.idPost, currentInfoItem);
        
        } catch (error) {
          console.log(error);
          alert(error);
        }
      };

      
      setIsModal(false);
    })
    : (
      async (e) => {
        e.preventDefault(); 
        const fullServiseType = getRightserviseType(serviceType);
        try {
         
          createNewPost(dataModal, file, type, fullServiseType);
        
          setIsModal(false);
        } catch (error) {
          alert(error);
        }
      }
    );
    
    useEffect(() => {
      if(serviceType === 'Гражданство') {
        setDataModal({...dataModal, type: 'citizenship'})
      }
    }, [serviceType]);

  
  return (
    <form className={styles.form} onSubmit={(e) => handleSubmitModal(e)}>
      <div className={styles.image}>
          <img 
            src={dataModal.image.length > 0 
              ? (dataModal.image ||'../../addPhoto.svg')  
              : currentInfoItem 
                ? (currentInfoItem.image || '../../addPhoto.svg') 
                : (dataModal.image || '../../addPhoto.svg')} 
            alt="image"
            className={styles.image__img}
          />
          <label>
            <div  
            className={styles.addPhoto} 
          >
            <img src='../../photo.svg' alt="add photo" /> 
          </div>

          <input
            type="file"
            onChange={(e) => handleChangePhoto(e)}
            className={styles.file}
            ref={inputRef}
          />
          </label>
          
      </div>

      {(type === 'services' && func !== 'updateInfo') && (
        <select 
          className={styles.input} 
          onChange={(e) => setServiceType(e.target.value)} 
        >
          
          {selectValues.map(el => {
            return (
              <option key={el}>
                {el}
              </option>
            )
          })}
        </select>
      )}

      <div>
        <div className={styles.tabs}>
          <button 
            type="button"
            name="ua"
            className={clsx(
              [styles.tabs__button],
              {[styles.tabs__button__active]: tabsState.ua}
            )}
            onClick={(e) => handleTabsChange(e)}
          >
            Ua
          </button>
          <button
            type="button"
            name="en"
            className={clsx(
              [styles.tabs__button],
              {[styles.tabs__button__active]: tabsState.en}
            )}
            onClick={(e) => handleTabsChange(e)}
          >
            En
          </button>
          <button
            type="button"
            name="ru"
            className={clsx(
              [styles.tabs__button],
              {[styles.tabs__button__active]: tabsState.ru}
            )}
            onClick={(e) => handleTabsChange(e)}
          >
            Ru
          </button>
        </div>

        {tabsState.ua && (
          <div className={clsx(
            [styles.tabs__body], 
            {
              [styles.tabs__body__right]: tabsState.ua,
              [styles.tabs__body__left]: tabsState.ru,
              [styles.tabs__body__center]: tabsState.en,
            }
          )}
          > 

          {((type === 'services' || type === 'citizenship') && func === 'updateInfo') && (
            <p className={styles.serviceType}>{`${currentInfoItem.serviceType.ua}:`} </p>
          )}
            <input
              type="text"
              placeholder="заголовок"
              value={dataModal.ua.title.length > 0 ? dataModal.ua.title : currentInfoItem ? currentInfoItem.ua.title : dataModal.ua.title}
              className={styles.input}
              onChange={(e) => handleChangeModalWithLang('title', e.target.value, 'ua')} 
              autoFocus
              ref={inputRef}
            />
            
            {type !== "services" && (
               <textarea
              type="text"
              placeholder="прев'ю"
              value={dataModal.ua.preview.length > 0 ? dataModal.ua.preview : currentInfoItem ? currentInfoItem.ua.preview : dataModal.ua.preview}
              className={styles.input}
              onChange={(e) => handleChangeModalWithLang('preview', e.target.value, 'ua')} 
            />
            )}
           
            <div className={styles.label}>
              <p className={styles.label__p}>Основний текст</p>
              <div className={styles.ReactQuill}>
              <ReactQuill
                value={dataModal.ua.text.length > 0 ? dataModal.ua.text : currentInfoItem ? currentInfoItem.ua.text : dataModal.ua.text}
                onChange={(e) => handleChangeModalWithLang('text', e, 'ua')}
                modules={modules}            
                 />
              </div>
            </div>
          </div>
        )}

        {tabsState.en && (
           <div className={clsx(
            [styles.tabs__body], 
            {
              [styles.tabs__body__right]: tabsState.ua,
              [styles.tabs__body__left]: tabsState.ru,
              [styles.tabs__body__center]: tabsState.en,
            }
          )}
          >

          {((type === 'services' || type === 'citizenship') && func === 'updateInfo') && (
            <p className={styles.serviceType}>{`${currentInfoItem.serviceType.en}:`} </p>
          )}  
            <input
              type="text"
              placeholder="title"
              value={dataModal.en.title.length > 0 ? dataModal.en.title : currentInfoItem ? currentInfoItem.en.title : dataModal.en.title}
              className={styles.input}
              onChange={(e) => handleChangeModalWithLang('title', e.target.value, 'en')} 
              autoFocus
              ref={inputRef}
            />
            {type !== "services" && (
              <textarea
              type="text"
              placeholder="preview"
              value={dataModal.en.preview.length > 0 ? dataModal.en.preview : currentInfoItem ? currentInfoItem.en.preview : dataModal.en.preview}
              className={styles.input}
              onChange={(e) => handleChangeModalWithLang('preview', e.target.value, 'en')} 
            />
            )}
            
            <div className={styles.label}>
              <p className={styles.label__p}>Main text</p>
              <div className={styles.ReactQuill}>
              <ReactQuill
                modules={modules} 
                value={dataModal.en.text.length > 0 ? dataModal.en.text : currentInfoItem ? currentInfoItem.en.text : dataModal.en.text}
                onChange={(e) => handleChangeModalWithLang('text', e, 'en')}
                            
                 />
              </div>
            </div>
          </div>
        )}

        {tabsState.ru && (
           <div className={clsx(
            [styles.tabs__body], 
            {
              [styles.tabs__body__right]: tabsState.ua,
              [styles.tabs__body__left]: tabsState.ru,
              [styles.tabs__body__center]: tabsState.en,
            }
          )}
          >

          {((type === 'services' || type === 'citizenship') && func === 'updateInfo') && (
            <p className={styles.serviceType}>{`${currentInfoItem.serviceType.ru}:`} </p>
          )}
             <input
              type="text"
              placeholder="заголовок"
              value={dataModal.ru.title.length > 0 ? dataModal.ru.title : currentInfoItem ? currentInfoItem.ru.title : dataModal.ru.title}
              className={styles.input}
              onChange={(e) => handleChangeModalWithLang('title', e.target.value, 'ru')} 
              autoFocus
              ref={inputRef}
            />
            {type !== "services" && (
              <textarea
              type="text"
              placeholder="превью"
              value={dataModal.ru.preview.length > 0 ? dataModal.ru.preview : currentInfoItem ? currentInfoItem.ru.preview : dataModal.ru.preview}
              className={styles.input}
              onChange={(e) => handleChangeModalWithLang('preview', e.target.value, 'ru')} 
            />
            )}
            
            <div className={styles.label}>
              <p className={styles.label__p}>Основной текст</p>
              <div className={styles.ReactQuill}>
              <ReactQuill
                modules={modules} 
                value={dataModal.ru.text.length > 0 ? dataModal.ru.text : currentInfoItem ? currentInfoItem.ru.text : dataModal.ru.text}
                onChange={(e) => handleChangeModalWithLang('text', e, 'ru')}
                            
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
          value={dataModal.path.length > 0 ? dataModal.path : currentInfoItem ? currentInfoItem.path : dataModal.path}
          onChange={(e) => handleChangeModal('path', e.target.value )} 
        />
        <button type="submit" className={styles.submitButton}>
          {func === "updateInfo" ? 'Обновить' : 'Добавить'} 
        </button>
    </form>
  )
};
