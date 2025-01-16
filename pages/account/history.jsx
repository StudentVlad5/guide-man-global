import { useTranslation } from "next-i18next";
import { PageNavigation } from "../../components/PageNavigation";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getRightURL } from "../../helpers/rightData";
import { useRouter } from "next/router";
import { Layout } from "../../components/Layout";

import { BASE_URL } from "../sitemap.xml";
import ErrorPage from "../404";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../components/AppProvider";
import styles from "../../styles/form.module.scss";
import s from "../../styles/formPage.module.scss";
import { fieldInput } from "../../helpers/constant";
import SideBar from "../../components/SideBar";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import "firebase/firestore";

export default function HistoryPage() {
  const [userRequests, setUserRequests] = useState({});
  const { t } = useTranslation();
  const { locale, pathname } = useRouter();
  const { user } = useContext(AppContext);

  useEffect(() => {
    const getUserHistory = async () => {
      const db = getFirestore(); // Initialize Firestore
      const userCollection = collection(db, "userRequests");
      const userQuery = query(userCollection, where("uidId", "==", user.uid));

      try {
        const snapshot = await getDocs(userQuery);
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          const checkData = {};
          Object.keys(fieldInput).map((it) => {
            return (checkData[it] = userData[it]);
          });

          setUserRequests((prevRequests) => ({
            ...prevRequests,
            ...checkData,
          }));
        } else {
          console.log("User requests not found");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (user) {
      getUserHistory();
    }
  }, [user]);
  console.log("userRequests", userRequests);
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
          <div className={s.formPage__container}>
            <SideBar />
            <form className={styles.form} style={{ marginLeft: "31px" }}>
              <ul>
                <li>Requests</li>
              </ul>
            </form>
          </div>
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
