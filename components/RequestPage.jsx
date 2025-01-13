import Link from "next/link";
import PropTypes from "prop-types";
import { getRightData } from "../helpers/rightData";
import { useRouter } from "next/router";

import styles from "../styles/itemPage.module.scss";
import { ButtonUp } from "./ButtonUp";
import { useTranslation } from "next-i18next";

import { QRCode } from "react-qrcode-logo";
import { useEffect, useState } from "react";
import LawyersRequestForm from "./LawyersRequestsForm";
import { auth } from "../helpers/firebaseControl";
import PaymentPage from "../pages/payment";

export default function LawyersRequestPage({ item, buttonName, linkPath }) {
  const { locale } = useRouter();
  const { t } = useTranslation();
  const [isActiveForm, setIsActiveForm] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userIn = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => userIn();
  }, []);

  const handleOpenForm = () => {
    setIsActiveForm((prevState) => !prevState);
  };

  return (
    <div className={styles.itemPage}>
      <div className={styles.itemPage__body}>
        <h1 className={`page__title ${styles.itemPage__title}`}>
          {item.type === "request"
            ? `${item.requestType[locale]}: ${getRightData(
                item,
                locale,
                "title"
              )}`
            : getRightData(item, locale, "title")}
        </h1>
        <article
          className={styles.itemPage__text}
          dangerouslySetInnerHTML={{
            __html: getRightData(item, locale, "preview"),
          }}
        />

        {user ? (
          <div className={styles.buttonDiv}>
            <button
              type="button"
              onClick={handleOpenForm}
              className={`${styles.buttonDiv__button} ${
                isActiveForm ? styles.buttonDiv__button_active : ""
              }`}
            >
              {isActiveForm ? (
                <span className={styles.buttonDiv__button_text}>
                  {locale === "ua"
                    ? "Закрити"
                    : locale === "ru"
                    ? "Закрыть"
                    : "Close"}
                </span>
              ) : (
                <span className={styles.buttonDiv__button_text}>
                  {locale === "ua"
                    ? "Замовити"
                    : locale === "ru"
                    ? "Заказать"
                    : "Order"}
                </span>
              )}
            </button>
            {isActiveForm && (
              <div style={{ marginTop: 60, marginBottom: 60 }}>
                <LawyersRequestForm currentLanguage={locale} request={item} />
                <PaymentPage currentLanguage={locale} request={item} />
              </div>
            )}
          </div>
        ) : (
          <div className={styles.buttonDiv}>
            <p className={styles.buttonDiv__text}>
              {locale === "ua"
                ? "Щоб замовити послугу необхідно зареєструватися."
                : locale === "ru"
                ? "Чтобы заказать услугу необходимо зарегистрироваться."
                : "To order the service you need to register."}
            </p>
            <a
              href="/registration"
              className={styles.buttonDiv__button}
              style={{ textDecoration: "none" }}
            >
              {locale === "ua"
                ? "Зареєструватися"
                : locale === "ru"
                ? "Зарегистрироваться"
                : "Register"}
            </a>
          </div>
        )}

        <div className={styles.itemPage__iconsWrap}>
          <a href="https://t.me/emigrant_helper_bot" alt="">
            <QRCode
              value="https://t.me/emigrant_helper_bot"
              logoImage="../telegram-icon.svg"
              size={200}
            />
          </a>
        </div>

        <button className="button-extension button-extension--down">
          <Link href={linkPath}>
            <p>{buttonName}</p>
          </Link>
        </button>
      </div>
      <ButtonUp />
    </div>
  );
}

LawyersRequestPage.propType = {
  item: PropTypes.object.isRequired,
  buttonName: PropTypes.string,
  linkPath: PropTypes.string,
};
