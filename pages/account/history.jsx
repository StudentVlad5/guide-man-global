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
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { useLawyerRequest } from "../../hooks/useLawyerRequest";

export default function HistoryPage() {
  const [userRequests, setUserRequests] = useState([]);
  const { t } = useTranslation();
  const { locale, pathname } = useRouter();
  const { user } = useContext(AppContext);
  const [checkInfo, setCheckInfo] = useState([]);
  console.log("userRequests", userRequests);

  const { handleSendEmail, handleDocuSign } = useLawyerRequest();

  useEffect(() => {
    let arr = [];
    for (let i = 0; i < userRequests.length; i++) {
      arr.push(false);
      setCheckInfo(arr);
    }
  }, [userRequests]);

  useEffect(() => {
    if (user) {
      getCollectionWhereKeyValue("userRequests", "uid", user.uid).then(
        (res) => {
          if (res) {
            setUserRequests(
              res.sort(
                (a, b) => -new Date(a.dateCreating) + new Date(b.dateCreating)
              )
            );
          }
        }
      );
    }
  }, [user]);

  const [paymentStatus, setPaymentStatus] = useState(null);
  let paymentCheckInterval;

  const checkPaymentStatus = async (orderId) => {
    if (!orderId) {
      console.error("No order ID provided");
      return;
    }

    try {
      // console.log(`Перевірка статусу для orderId: ${orderId}`);

      const response = await fetch("/api/liqpay/check-payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const successfulRequest = userRequests.find(
        (req) => req.orderId === orderId
      );

      if (data.status === "success") {
        // alert(t("Payment successful!"));

        setUserRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.orderId === orderId ? { ...req, status: "paid" } : req
          )
        );

        await fetch("/api/liqpay/update-payment-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            order_id: orderId,
            status: data.status,
          }),
        });

        handleDocuSign();
        handleSendEmail(successfulRequest.id);
        clearInterval(paymentCheckInterval);
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  };

  const handlePayment = async (request) => {
    try {
      const { title, orderId } = request;

      if (!orderId) {
        console.error("No orderId found for this request");
        return;
      }

      const paymentResponse = await fetch("/api/liqpay/liqpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: "0.1",
          currency: "UAH",
          description: title || "Payment",
          order_id: orderId,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error("Error initializing payment");
      }

      const paymentData = await paymentResponse.json();

      const paymentForm = document.createElement("form");
      paymentForm.method = "POST";
      paymentForm.action = "https://www.liqpay.ua/api/3/checkout";
      paymentForm.acceptCharset = "utf-8";
      paymentForm.target = "_blank";

      const inputData = document.createElement("input");
      inputData.type = "hidden";
      inputData.name = "data";
      inputData.value = paymentData.data;

      const inputSignature = document.createElement("input");
      inputSignature.type = "hidden";
      inputSignature.name = "signature";
      inputSignature.value = paymentData.signature;

      paymentForm.appendChild(inputData);
      paymentForm.appendChild(inputSignature);
      document.body.appendChild(paymentForm);

      paymentForm.submit();
      document.body.removeChild(paymentForm);

      paymentCheckInterval = setInterval(
        () => checkPaymentStatus(orderId),
        5000
      );
    } catch (error) {
      console.error("Error processing payment:", error);
      setPaymentStatus("error");
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
          <div className={s.formPage__container}>
            <SideBar />
            <form className={`${styles.form} history`}>
              {userRequests.length > 0 &&
                userRequests.map((it, ind) => {
                  return (
                    <div key={it.id}>
                      <div className={styl.profile__wrap}>
                        <ul className={styl.profile__container}>
                          <li
                            className={styl.profile__item}
                            style={{ gap: "8px", maxWidth: "225px" }}
                          >
                            <b>{t("Lawyer`s request")}:</b>
                            <span
                              className={styl.profile__button}
                              onClick={() => {
                                let x = [...checkInfo];
                                x[ind] = !checkInfo[ind];
                                setCheckInfo(x);
                              }}
                            >
                              {it.title}
                            </span>
                          </li>
                          {it.status === "pending" && (
                            <button
                              className={styl.profile__payButton}
                              onClick={(e) => {
                                e.preventDefault();
                                handlePayment({
                                  title: it.title,
                                  orderId: it.orderId,
                                });
                              }}
                            >
                              {t("Pay Now")}
                            </button>
                          )}

                          <li
                            className={styl.profile__item}
                            style={{ alignItems: "center" }}
                          >
                            <div
                              className={
                                it.status === "pending" ||
                                it.status === "paid" ||
                                it.status === "sign" ||
                                it.status === "done"
                                  ? `${styl.round} ${styl.green}`
                                  : styl.round
                              }
                              data-tooltip-id="tooltip"
                              data-tooltip-content={t("status.pending")}
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
                              data-tooltip-id="tooltip"
                              data-tooltip-content={t("status.paid")}
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
                              data-tooltip-id="tooltip"
                              data-tooltip-content={t("status.signed")}
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
                              data-tooltip-id="tooltip"
                              data-tooltip-content={t("status.done")}
                            ></div>
                            <Tooltip id="tooltip" place="top" effect="solid" />
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
                        {checkInfo[ind] && (
                          <ul>
                            <li className={styl.profile__item_link}>
                              <Link href={it.pdfLawyersRequest}>
                                {t("Download Lawyers Request")}
                              </Link>
                            </li>

                            <li className={styl.profile__item_link}>
                              <Link href={it.pdfAgreement}>
                                {t("Download Agreement")}
                              </Link>
                            </li>

                            <li className={styl.profile__item_link}>
                              <Link href={it.pdfContract}>
                                {t("Download Contract")}
                              </Link>
                            </li>
                          </ul>
                        )}
                      </div>
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
