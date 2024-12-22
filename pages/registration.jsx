import { useContext, useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Form } from '../components/Form';
import { Modal } from '../components/Modal';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Layout } from '../components/Layout';
import { useTranslation } from 'next-i18next';

import styles from '../styles/formPage.module.scss';
import { auth, createNewUser } from '../helpers/firebaseControl';
import { AppContext } from '../components/AppProvider';
import { useRouter } from 'next/router'

export default function RegistrationPage () {
  const [isModal, setIsModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('Register Error');
  const [errorMessage, setErrorMessage] = useState('');

  const { setUser } = useContext(AppContext);

  const router = useRouter()


  const { t }  = useTranslation();

  const handleRegister = (e, regInfo) => {
    e.preventDefault();

    if (Object.values(regInfo).some(el => el.length === 0)) {
      setIsModal(true);
      setErrorMessage("All form fields must be filled!");
      return;
    };
    
    createUserWithEmailAndPassword(auth, regInfo.email, regInfo.password)
      .then((userCredential) => {
        const user = userCredential.user;
        createNewUser(user, regInfo);
        setUser(user);
        router.push('/')
      })
      .catch((error) => {
        setIsModal(true);
        setErrorMessage(error.message);
      });;
  }; 

  const handleModal = () => {
    setIsModal(!isModal);
  };

  return (
    <Layout
      type='service page'
      desctiption={`⭐${t('navbar.register')}⭐ ${t('head.home.description')}`  }
      h1={t('navbar.register')}
    >
      <div className="page page-bigBottom">
        <div className="container">
          <div className={styles.formPage}>
            <div className={styles.formPage__form}>
              <Form
                formFunction="registration"
                isRegistration={true}
                handleSubmit={handleRegister} />
            </div>
          </div>
        </div>
      </div>
      
      {isModal && (
        <Modal 
          title={errorTitle} 
          message={errorMessage}
          handleModal={handleModal} 
        />
      )}
    </Layout>
  );
};

export async function getStaticProps({ locale }) {
	return {
		props: {
			...(await serverSideTranslations(locale, ['common'])),
		},
	}
}