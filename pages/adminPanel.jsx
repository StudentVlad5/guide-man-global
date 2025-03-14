import { signOut } from 'firebase/auth';
import { auth } from '../helpers/firebaseControl';
import { useRouter } from 'next/router';

import styles from '../styles/adminPanel.module.scss';
import { useContext, useEffect, useState } from 'react';

import { Modal } from '../components/Modal';
import { InformationForm } from '../components/InformationForm';
import { AppContext } from '../components/AppProvider';

export default function AdminPanel() {
  const [isModal, setIsModal] = useState(false);
  const [titleMessage, setTitleMessage] = useState('');
  const [type, setType] = useState('');
  const [currentInfoItem, setCurrentInfoItem] = useState(null);
  const [func, setFunc] = useState('updateInfo');

  const { userRole } = useContext(AppContext);
  const router = useRouter();

  useEffect(() => {
    if (userRole && userRole !== 'admin') router.push('account/profile/');
  }, [router, userRole]);

  const handleModal = () => {
    setIsModal(!isModal);
  };

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        router.push('/');
      })
      .catch(error => {
        alert(error);
      });
  };

  const handleClick = (e, collection) => {
    setCurrentInfoItem(null);
    setIsModal(true);
    setTitleMessage(`Добавить ${collection}`);
    setType(e.currentTarget.name);
    setFunc('addItem');
  };

  const handleClickCategory = category => {
    router.push(`/adminPanel/${category}`);
  };

  return (
    <div className={styles.main}>
      {userRole && (
        <>
          <h1>Панель администратора</h1>
          <div className={styles.body}>
            <div className={styles.body__item}>
              <div
                className={styles.body__item__content}
                onClick={() => handleClickCategory('news')}
              >
                Новости
              </div>

              <button
                name="news"
                className={styles.body__item__button}
                onClick={e => handleClick(e, 'новость')}
              >
                +
              </button>
            </div>

            <div className={styles.body__item}>
              <div
                className={styles.body__item__content}
                onClick={() => handleClickCategory('questions')}
              >
                Вопросы
              </div>

              <button
                name="questions"
                className={styles.body__item__button}
                onClick={e => handleClick(e, 'вопрос')}
              >
                +
              </button>
            </div>

            <div className={styles.body__item}>
              <div
                className={styles.body__item__content}
                onClick={() => handleClickCategory('explanations')}
              >
                Ссылки
              </div>

              <button
                name="explanations"
                className={styles.body__item__button}
                onClick={e => handleClick(e, 'ссылку')}
              >
                +
              </button>
            </div>

            <div className={styles.body__item}>
              <div
                className={styles.body__item__content}
                onClick={() => handleClickCategory('services')}
              >
                Услуги
              </div>

              <button
                name="services"
                className={styles.body__item__button}
                onClick={e => handleClick(e, 'услугу')}
              >
                +
              </button>
            </div>

            <div className={styles.body__item}>
              <div
                className={styles.body__item__content}
                onClick={() => handleClickCategory('requests')}
              >
                Адвокатские запросы
              </div>

              <button
                name="requests"
                className={styles.body__item__button}
                onClick={e => handleClick(e, 'запрос')}
              >
                +
              </button>
            </div>

            <div className={styles.body__item}>
              <div
                className={styles.body__item__content}
                onClick={() => handleClickCategory('recipient')}
              >
                Адреса госорганов
              </div>

              {/* <button
                name="recipient"
                className={styles.body__item__button}
                onClick={e => handleClick(e, 'адресат')}
              >
                +
              </button> */}
            </div>

            <div className={styles.body__item}>
              <div
                className={styles.body__item__content}
                onClick={() => handleClickCategory('users')}
              >
                Пользователи
              </div>
            </div>

            <div className={styles.body__item}>
              <div
                className={styles.body__item__content}
                onClick={() => handleClickCategory('users_requests')}
              >
                Запросы пользователей
              </div>
            </div>
            <div className={styles.body__item}>
              <div
                className={styles.body__item__content}
                onClick={() => handleClickCategory('orders')}
              >
                Загрузка ордеров
              </div>
              {/* <button
                name="order"
                className={styles.body__item__button}
                onClick={e => handleClick(e, 'ордер')}
              >
                +
              </button> */}
            </div>
          </div>
          <button className={styles.logout} onClick={handleSignOut}>
            Выход
          </button>
        </>
      )}

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
}
