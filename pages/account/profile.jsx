import { useTranslation } from "next-i18next";
import { ItemPage } from "../../components/ItemPage";
import { PageNavigation } from "../../components/PageNavigation";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getRightData, getRightURL } from "../../helpers/rightData";
import { useRouter } from "next/router";
import { Layout } from "../../components/Layout";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import "firebase/firestore";

import { BASE_URL } from "../sitemap.xml";
import ErrorPage from "../404";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../components/AppProvider";
import styles from "../../styles/form.module.scss";
import saveCredentials from "../api/userProfile";

const fieldInput = {
  name: "Name",
  surname: "Surname",
  fatherName: "Fathername",
  birthday: "BirdthDay",
  citizenship: "Citizenship",
  phoneNumber: "PhoneNumber",
  country: "Country",
  city: "City",
  address_1: "Address 1",
  address_2: "Address 2",
  inn: "INN",
  passport: "Passport",
};

export default function ProfileItemPage() {
  const { t } = useTranslation();
  const { locale, pathname } = useRouter();
  const { user } = useContext(AppContext);

  const [userCredentials, setUserCredentials] = useState({});
  const [editStatus, setEditStatus] = useState(false);
  useEffect(() => {
    const getUserData = async () => {
      if (user) {
        const db = getFirestore(); // Initialize Firestore
        const userCollection = collection(db, "users");
        const userQuery = query(userCollection, where("uid", "==", user.uid));

        try {
          const snapshot = await getDocs(userQuery);
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
            const checkData = {};
            Object.keys(fieldInput).map((it) => {
              return (checkData[it] = userData[it]);
            });

            setUserCredentials((prevCredentials) => ({
              ...prevCredentials,
              ...checkData,
            }));
          } else {
            console.log("User data not found");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    getUserData();
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const check = saveCredentials({
      ...userCredentials,
      uid: user.uid,
      email: user.email,
    });
    if (check) {
      setEditStatus(false);
    }
  };

  return user ? (
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
                },
              ]
          }`}
    >
      <div className="container">
        <PageNavigation title={t("navbar.account")} />
      </div>
      <div className="page page-bigBottom">
        <div className="container">
          <form className={styles.form}>
            <ul className="flexWrap">
              {Object.keys(userCredentials).map((it) => {
                return (
                  <li key={it}>
                    <span>{fieldInput[it]}:</span>
                    {!editStatus ? (
                      <div className={styles.form__input}>
                        {userCredentials[it]}
                      </div>
                    ) : (
                      <input
                        className={styles.form__input}
                        type="text"
                        value={userCredentials[it]}
                        onChange={(e) =>
                          setUserCredentials({
                            ...userCredentials,
                            [it]: e.currentTarget.value,
                          })
                        }
                      />
                    )}
                  </li>
                );
              })}
            </ul>
            {!editStatus ? (
              <button
                type="submit"
                className={`button ${styles.form__button}`}
                style={{ marginTop: "20px" }}
                onClick={(e) => {
                  e.preventDefault();
                  setEditStatus(true);
                }}
              >
                {t("edit")}
              </button>
            ) : (
              <button
                type="submit"
                className={`button ${styles.form__button}`}
                style={{ marginTop: "20px" }}
                onClick={(e) => handleSubmit(e)}
                disabled={
                  userCredentials.name == "" &&
                  userCredentials.fatherName == "" &&
                  userCredentials.surname == "" &&
                  userCredentials.birthday == "" &&
                  userCredentials.citizenship == "" &&
                  userCredentials.phoneNumber == "" &&
                  userCredentials.country == "" &&
                  userCredentials.city == "" &&
                  userCredentials.address_1 == "" &&
                  userCredentials.inn == "" &&
                  userCredentials.passport == ""
                }
              >
                {t("submit")}
              </button>
            )}
          </form>
        </div>
      </div>
    </Layout>
  ) : (
    <ErrorPage />
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
