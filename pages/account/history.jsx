import { useTranslation } from "next-i18next";
import { ItemPage } from "../../components/ItemPage";
import { PageNavigation } from "../../components/PageNavigation";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getRightData, getRightURL } from "../../helpers/rightData";
import { useRouter } from "next/router";
import { Layout } from "../../components/Layout";

import { BASE_URL } from "../sitemap.xml";
import ErrorPage from "../404";
import { useContext, useState } from "react";
import { AppContext } from "../../components/AppProvider";
import styles from "../../styles/form.module.scss";
import s from "../../styles/formPage.module.scss";
import styl from "../../styles/lawyersRequestForm.module.scss";
import saveCredentials from "../api/userProfile";
import { fieldInput, placeHolder, patternInput } from "../../helpers/constant";
import SideBar from "../../components/SideBar";

export default function HistoryPage() {
  const { t } = useTranslation();
  const { locale, pathname } = useRouter();
  const { user, userCredentials, setUserCredentials } = useContext(AppContext);

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