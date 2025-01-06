import { useState, useContext } from "react";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/router";
import { Form } from "../components/Form";
import { AppContext } from "../components/AppProvider";
import { Modal } from "../components/Modal";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Layout } from "../components/Layout";

import styles from "../styles/formPage.module.scss";
import { useTranslation } from "next-i18next";
import { auth } from "../helpers/firebaseControl";
import Link from "next/link";
import { PageNavigation } from "../components/PageNavigation";
import { getRightData, getRightURL } from "../helpers/rightData";
import { BASE_URL } from "./sitemap.xml";

export default function AccountPage() {
  const [isModal, setIsModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState("Login Error");
  const [errorMessage, setErrorMessage] = useState("");
  const { t } = useTranslation();
  const { locale, pathname, router } = useRouter();

  const { user, setUser } = useContext(AppContext);
  const handleLogin = (e, regInfo) => {
    e.preventDefault();

    if (regInfo.email.length === 0 || regInfo.password.length === 0) {
      setIsModal(true);
      setErrorMessage("All form fields must be filled!");
      return;
    }

    signInWithEmailAndPassword(auth, regInfo.email, regInfo.password)
      .then((userCredential) => {
        const user = userCredential.user;

        setUser(user);
        router.push("/");
      })
      .catch((error) => {
        setIsModal(true);
        setErrorTitle("Login Error");
        setErrorMessage(error.message);
      });
  };

  const handleModal = () => {
    setIsModal(!isModal);
  };

  const handleResetPassword = (regInfo) => {
    if (regInfo.email.length === 0) {
      setIsModal(true);
      setErrorTitle("Reset password error");
      setErrorMessage("Enter your email please!");
      return;
    } else {
      sendPasswordResetEmail(auth, regInfo.email)
        .then(() => {
          setIsModal(true);
          setErrorTitle("Notification");
          setErrorMessage(
            // eslint-disable-next-line max-len
            'Password reset email sent! Please check it, confirm reset and re-login! Don\'t forget check "Spam" folder!'
          );
        })
        .catch(() => {
          setIsModal(true);
          setErrorTitle("Error");
          setErrorMessage("Something went wrong with reset password sending");
        });
    }
  };

  return (
    <Layout
      type="service page"
      desctiption={`⭐${t("navbar.account")}⭐ ${t("head.home.description")}`}
      h1={t("navbar.account")}
      script={`
        {
            "@context": "http://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement":
              [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "item":
                  {
                    "@id": "${BASE_URL}",
                    "name": "${t("pageNavigation.main")}"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "item":
                  {
                    "@id": "${getRightURL(locale, pathname)}",
                    "name": "${t("navbar.account")}"
                  }
                }
              ]
          }`}
    >
      <div className="container">
        <PageNavigation />
      </div>
      <div className="page page-bigBottom">
        <div className="container">
          <div className={styles.formPage}>
            <div className={styles.formPage__form}>
              {user ? (
                <ul>
                  <Link href={`account/profile`}>
                    <li>Profile</li>
                  </Link>
                  <Link href={`account/history`}>
                    <li>History</li>
                  </Link>
                </ul>
              ) : (
                <Form
                  formFunction="account"
                  handleSubmit={handleLogin}
                  handleResetPassword={handleResetPassword}
                />
              )}
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
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
