import { useEffect, useState } from 'react';
import styles from '../../styles/adminPanel.module.scss';
import  { db }  from '../../firebase';
import { deleteImageFromStorage, removeDocumentFromCollection } from '../../helpers/firebaseControl';
import { Modal } from '../../components/Modal';
import { InformationForm } from '../../components/InformationForm';
import Link from 'next/link';

export default function AdminNews () {
  const [news, setNews] = useState([]);
  const [currentInfoItem, setCurrentInfoItem] = useState(null);
  const [isModal, setIsModal] = useState(false);
  const [titleMessage, setTitleMessage] = useState('');
  const [type, setType] = useState('');
  const [func, setFunc] = useState('updateInfo');

  useEffect(() => {
   db.collection('news').onSnapshot(snapshot => {
      setNews(snapshot.docs.map(doc => doc.data()))
    });
  }, []);

  const handleDelete = async (el) => {
   try {
     await removeDocumentFromCollection(`${el.type}`, el.idPost);
     if (el.image.length > 0) {
       await deleteImageFromStorage(el.image);
     }
   } catch (error) {
     alert(error);
   }
 };

 const handleClick = (e, collection) => {
   setCurrentInfoItem(null);
   setIsModal(true);
   setTitleMessage(`Добавить ${collection}`);
   setType(e.currentTarget.name);
   setFunc('addItem');
 };

 const handleModal = () => {
   setIsModal(!isModal);
 };

 const handleModalUpdate = (el) => {
   setType(el.type)
   setFunc('updateInfo');
   setCurrentInfoItem(el);
   setIsModal(true);
   setTitleMessage(`Обновить ${el.type}`);
   
 };

  return (
    <div className={styles.main}>
      <h1> 
        <Link href="/adminPanel"> ← Панель администраторa</Link> / Новости</h1>
      <div className={styles.category}>

         {news.sort((a, b) => {

           return new Date(b.dateCreating) - new Date(a.dateCreating);
         }).map(el => (
          <div className={styles.category__item} key={el.id}>
            <img
              src={el.image.length !== 0 ? el.image : '../../noPhoto.svg'}
              alt="image"
            />
            <div className={styles.category__item__click} onClick={() => handleModalUpdate(el)}>
            <p  className={styles.category__item__title}>
              {el.ua.title}
            </p>
  
           {!el.ua.preview
              ? <div className={styles.category__item__text} dangerouslySetInnerHTML={{ __html:  el.ua.text}} />
              : <p className={styles.category__item__text}>
               {el.ua.preview}
                </p>
            }
  
          </div>
  
        <button   
         className={styles.category__item__button}
         onClick={() => handleDelete(el)}
        >
          -
       </button>
         </div>
         ))}
        
    </div>

      <button 
        name="news"
        className={`${styles.body__item__button} ${styles.body__item__button_item}`}
        onClick={(e) => handleClick(e, 'новость')}
      >
        Добавить новость
     </button>
     {isModal && (
        <Modal
          title={titleMessage}
          handleModal={handleModal}
          form={
            <InformationForm
              type={type}
              setIsModal={handleModal}
              currentInfoItem={currentInfoItem}
              func={func}
            />
          }
        />
      )}
   </div>
    );
  };