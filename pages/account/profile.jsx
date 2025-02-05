import { useTranslation } from "next-i18next";
import { PageNavigation } from "../../components/PageNavigation";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getRightData, getRightURL } from "../../helpers/rightData";
import { useRouter } from "next/router";
import { Layout } from "../../components/Layout";

import { BASE_URL } from "../sitemap.xml";
import ErrorPage from "../404";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../components/AppProvider";
import styles from "../../styles/form.module.scss";
import s from "../../styles/formPage.module.scss";
import styl from "../../styles/lawyersRequestForm.module.scss";
import saveCredentials from "../api/userProfile";
import { fieldInput, placeHolder, patternInput } from "../../helpers/constant";
import SideBar from "../../components/SideBar";
import countries from "i18n-iso-countries";
import ukLocale from "i18n-iso-countries/langs/uk.json";
import ruLocale from "i18n-iso-countries/langs/ru.json";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(ukLocale);
countries.registerLocale(ruLocale);
countries.registerLocale(enLocale);

export default function ProfileItemPage() {
  const { t } = useTranslation();
  const { locale, pathname } = useRouter();
  const { user, userCredentials, setUserCredentials } = useContext(AppContext);
  const [editStatus, setEditStatus] = useState(false);
  const [validateStatus, setValidateStatus] = useState(false);
  const language = locale === "ua" ? "uk" : locale;

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

  const handleInputChangeBirthday = (e) => {
    const input = e.target.value;

    // Remove all non-numeric characters
    const numericValue = input.replace(/\D/g, "");

    // Format the string as "DD-MM-YYYY"
    let formattedValue = numericValue;
    if (numericValue.length > 2) {
      formattedValue = `${numericValue.slice(0, 2)}-${numericValue.slice(2)}`;
    }
    if (numericValue.length > 4) {
      formattedValue = `${numericValue.slice(0, 2)}-${numericValue.slice(
        2,
        4
      )}-${numericValue.slice(4)}`;
    }

    // Limit to 10 characters ("DD-MM-YYYY")
    if (formattedValue.length > 10) {
      formattedValue = formattedValue.slice(0, 10);
    }
    let check = { ...userCredentials };
    check.birthday = formattedValue;
    console.log(formattedValue);
    setUserCredentials(check);
  };

  useEffect(() => {
    const updatedLanguage = locale === "ua" ? "uk" : locale;
    const newCountryList = getCountriesByLanguage(updatedLanguage);
    setCountryList(newCountryList);

    const existsInNewList = newCountryList.some(
      (country) => country.label === selectedCountry
    );

    if (!existsInNewList) {
      setSelectedCountry("");
    }
  }, [locale]);

  const getCountriesByLanguage = (lang) => {
    return Object.entries(countries.getNames(lang)).map(([code, name]) => ({
      value: code,
      label: name,
    }));
  };
  const [selectedCountry, setSelectedCountry] = useState(
    userCredentials.citizenship || ""
  );

  const handleCountryChange = (e) => {
    const selectedValue = e.target.value;
    setSelectedCountry(selectedValue);
    setUserCredentials({
      ...userCredentials,
      citizenship: selectedValue,
    });
  };

  const [countryList, setCountryList] = useState(
    getCountriesByLanguage(language)
  );

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
            <form className={styles.form}>
              <ul className="flexWrap">
                {Object.keys(userCredentials).map((it) => {
                  return (
                    <li key={it} className={styles.form__li}>
                      <span className={styl.orderForm__form_span}>
                        {t(fieldInput[it])}:
                      </span>

                      {!editStatus ? (
                        <div
                          className={styl.orderForm__form_input}
                          style={{
                            width: "100%",
                            padding: "0 16px",
                            height: "48px",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {userCredentials[it]}
                        </div>
                      ) : (
                        <>
                          {it === "citizenship" ? (
                            <select
                              className={
                                !selectedCountry
                                  ? styles.form__input__danger
                                  : styl.orderForm__form_input
                              }
                              style={{
                                width: "100%",
                                padding: "0 16px",
                                height: "48px",
                                fontSize: "18px",
                                display: "flex",
                                alignItems: "center",
                              }}
                              name="citizenship"
                              value={selectedCountry}
                              onChange={handleCountryChange}
                              required
                            >
                              <option value="" disabled>
                                {t("Select a country")}
                              </option>
                              {countryList.map((country) => (
                                <option
                                  key={country.value}
                                  value={country.label}
                                >
                                  {country.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <>
                              <input
                                className={
                                  patternInput[it] &&
                                  !patternInput[it].test(userCredentials[it])
                                    ? styles.form__input__danger
                                    : styl.orderForm__form_input
                                }
                                style={{
                                  width: "100%",
                                  padding: "0 16px",
                                  height: "48px",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                                type="text"
                                id={it}
                                name={it}
                                value={userCredentials[it]}
                                pattern={patternInput[it]?.source}
                                placeholder={placeHolder[it]}
                                onChange={(e) => {
                                  if (
                                    patternInput[it] &&
                                    !patternInput[it].test(e.target.value)
                                  ) {
                                    setValidateStatus(true);
                                  } else {
                                    setValidateStatus(false);
                                  }
                                  if (it === "birthday") {
                                    handleInputChangeBirthday(e);
                                  } else {
                                    setUserCredentials({
                                      ...userCredentials,
                                      [it]: e.currentTarget.value,
                                    });
                                  }
                                }}
                              />

                              <span
                                className={
                                  patternInput[it] &&
                                  !patternInput[it].test(userCredentials[it])
                                    ? styles.form__validate
                                    : styles.form__validate__hide
                                }
                              >
                                {t("Please use pattern")}: {placeHolder[it]}
                              </span>
                            </>
                          )}
                        </>
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
                  disabled={validateStatus}
                >
                  {t("submit")}
                </button>
              )}
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
