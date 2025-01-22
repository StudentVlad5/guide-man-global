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
import styl from "../../styles/profile.module.scss";
import s from "../../styles/formPage.module.scss";
import SideBar from "../../components/SideBar";
import "firebase/firestore";
import { getCollectionWhereKeyValue } from "../../helpers/firebaseControl";
import Link from "next/link";

export default function HistoryPage() {
  const [userRequests, setUserRequests] = useState([]);
  const { t } = useTranslation();
  const { locale, pathname } = useRouter();
  const { user } = useContext(AppContext);
  const [checkInfo, setCheckInfo] = useState([]);

  useEffect(() => {
    let arr = [];
    for (let i = 0; i < userRequests.length; i++) {
      arr.push(false);
      setCheckInfo(arr);
    }
  }, [userRequests]);

  useEffect(() => {
    if (user) {
      getCollectionWhereKeyValue("userRequests", "userId", user.uid).then(
        (res) => {
          if (res) {
            setUserRequests(res);
            console.log(res);
          }
        }
      );
    }
  }, [user]);

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
            <form
              className={`${styles.form} history`}
            >
              {userRequests.length > 0 &&
                userRequests.map((it, ind) => {
                  return (
                    <div key={it.id}>
                      <ul className={styl.profile__container}>
                        {/* {t("Request")} № {ind + 1} */}
                        <li
                          className={styl.profile__item}
                          style={{ gap: "8px", maxWidth: "225px" }}
                        >
                          <i>
                            <b>{t("Subject")}:</b>
                          </i>{" "}
                          {it.title}
                        </li>
                        <li className={styl.profile__item}>
                          <div
                            className={
                              it.status === "pending" ||
                              it.status === "paid" ||
                              it.status === "sign" ||
                              it.status === "done"
                                ? `${styl.round} ${styl.green}`
                                : styl.round
                            }
                          ></div>
                          <div
                            className={
                              it.status === "paid" ||
                              it.status === "sign" ||
                              it.status === "done"
                                ? `${styl.green} ${styl.block}`
                                : styl.block
                            }
                          ></div>
                          <div
                            className={
                              it.status === "paid" ||
                              it.status === "sign" ||
                              it.status === "done"
                                ? `${styl.round} ${styl.green}`
                                : styl.round
                            }
                          ></div>
                          <div
                            className={
                              it.status === "sign" || it.status === "done"
                                ? `${styl.green} ${styl.block}`
                                : styl.block
                            }
                          ></div>
                          <div
                            className={
                              it.status === "sign" || it.status === "done"
                                ? `${styl.round} ${styl.green}`
                                : styl.round
                            }
                          ></div>
                          <div
                            className={
                              it.status === "done"
                                ? `${styl.green} ${styl.block}`
                                : styl.block
                            }
                          ></div>
                          <div
                            className={
                              it.status === "done"
                                ? `${styl.round} ${styl.green}`
                                : styl.round
                            }
                          ></div>
                        </li>
                        <li
                          className={styl.profile__item}
                          style={{ gap: "8px" }}
                        >
                          {it.dateCreating
                            .split(" ")[0]
                            .split("-")
                            .reverse()
                            .join(".")}
                        </li>
                      </ul>
                      <li
                        className={styl.profile__button}
                        onClick={() => {
                          let x = [...checkInfo];
                          x[ind] = !checkInfo[ind];
                          setCheckInfo(x);
                        }}
                      >
                        more info
                      </li>
                      {checkInfo[ind] && (
                        <ul>
                          <li className={styl.profile__item}>
                            <Link href={it.pdfLawyersRequest}>
                              {t("Download Lawyers Request")}
                            </Link>
                          </li>

                          <li className={styl.profile__item}>
                            <Link href={it.pdfAgreement}>
                              {t("Download Agreement")}
                            </Link>
                          </li>

                          <li className={styl.profile__item}>
                            <Link href={it.pdfContract}>
                              {t("Download Contract")}
                            </Link>
                          </li>
                        </ul>
                      )}
                    </div>
                  );
                })}
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
