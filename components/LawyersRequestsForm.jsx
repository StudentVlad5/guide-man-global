"use client";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContext } from "./AppProvider";
import styles from "../styles/lawyersRequestForm.module.scss";

import countries from "i18n-iso-countries";
import ukLocale from "i18n-iso-countries/langs/uk.json";
import ruLocale from "i18n-iso-countries/langs/ru.json";
import enLocale from "i18n-iso-countries/langs/en.json";
import { useTranslation } from "react-i18next";
import { uploadFile } from "../helpers/firebaseControl";

countries.registerLocale(ukLocale);
countries.registerLocale(ruLocale);
countries.registerLocale(enLocale);

// Динамічне підключення PDF-компонента
const LawyersRequest = dynamic(() => import("./DownloadPDF"), {
  ssr: false,
});
const Agreement = dynamic(() => import("./Agreement"), { ssr: false });
const Contract = dynamic(() => import("./Contract"), { ssr: false });

export default function LawyersRequestForm({ currentLanguage, request }) {
  const language = currentLanguage === "ua" ? "uk" : currentLanguage;
  const { t } = useTranslation();
  const { user } = useContext(AppContext);
  const requestEn = request.requestType.ua;

  const [formData, setFormData] = useState({
    uid: user?.uid || "",
    name: user?.name || "", //АДПСУ, РАЦС, МОУ і ТЦК, ГУНП, ПФУ і ДПСУ, ВПО
    surname: user?.surname || "", //АДПСУ, РАЦС, МОУ і ТЦК, ГУНП, ПФУ і ДПСУ, ВПО
    fatherName: user?.fatherName || "", //АДПСУ, РАЦС, МОУ і ТЦК, ГУНП, ПФУ і ДПСУ, ВПО
    email: user?.email || "example@example.com", //????
    birthday: user?.birthday || "", //АДПСУ, РАЦС, МОУ і ТЦК, ГУНП
    requesterBirthday: "", //РАЦС
    requesterName: "", //РАЦС
    requesterFile: [], //РАЦС
    deathDay: "", //РАЦС
    dateCreating: new Date() //ВСІ ФОРМИ
      .toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    date: { start: "", finish: "" },
    recipient: {
      name: "", //МОУ і ТЦК
      address: "", //МОУ і ТЦК
    },
    citizenship: "", //АДПСУ,
    // ПАСПОРТИ
    abroadPassnum: "", //АДПСУ
    passportNum: "", //АДПСУ,
    pmjNum: "", //АДПСУ,

    dateBorderCrossingStart: "", //АДПСУ,
    dateBorderCrossingEnd: "", //АДПСУ,
    // ПІБ подружжя(тобто обох супругів)
    couplePIB1: "", //РАЦС
    couplePIB2: "", //РАЦС
    // (дату надання довідки про місце проживання)
    dateResidence: "", //РАЦС
    eventDate: "", //ГУНП
    eventTime: "", //ГУНП
    eventPlace: "", //ГУНП
    ipn: "", //ПФУ і ДПСУ
    propertyAddress: "", //ВПО
    request: request,
  });
  const [downloadLink, setDownloadLink] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState({
    agreement: false,
    contract: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestTypeMap = {
    РАЦС: [
      "name",
      "surname",
      "fatherName",
      "requesterBirthday",
      "requesterName",
      "requesterFile",
      "birthday",
      "deathDay",
      "couplePIB1",
      "couplePIB2",
      "dateResidence",
    ],
    АДПСУ: [
      "name",
      "surname",
      "fatherName",
      "birthday",
      "citizenship",
      "passportNum",
      "abroadPassnum",
      "pmjNum",
      "dateBorderCrossingStart",
      "dateBorderCrossingEnd",
    ],
    "МОУ і ТЦК": [
      "name",
      "surname",
      "fatherName",
      "birthday",
      "recipient.name",
      "recipient.address",
    ],
    МВС: [
      "name",
      "surname",
      "fatherName",
      "birthday",
      "eventDate",
      "eventTime",
      "eventPlace",
    ],
    "ПФУ і ДПСУ": ["name", "surname", "fatherName", "ipn"],
    ВПО: ["name", "surname", "fatherName", "propertyAddress"],
  };

  const requestNameToKeyMap = {
    "Запити до органів ДРАЦС (реєстрація актів цивільного стану)": "РАЦС",
    "Запити до Державної міграційної служби України (ДМСУ) та адміністрації ДПСУ":
      "АДПСУ",
    "Запити до Міністерства оборони України (МОУ) та територіальних центрів комплектування (ТЦК)":
      "МОУ і ТЦК",
    "Запити до Міністерства внутрішніх справ України (МВС)": "МВС",
    "Запити до Пенсійного фонду України (ПФУ) та Державної прикордонної служби України (ДПСУ)":
      "ПФУ і ДПСУ",
    "Запити, пов’язані з внутрішньо переміщеними особами (ВПО)": "ВПО",
  };

  const filterFieldsByRequestType = (requestEn) => {
    const typeKey = requestNameToKeyMap[requestEn] || "";
    console.log(typeKey);
    
    return requestTypeMap[typeKey] || [];
  };
  const visibleFields = filterFieldsByRequestType(requestEn);

  const getNestedValue = (obj, path) => {
    return path
      .split(".")
      .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  };

  const isFormValid = () => {
    // console.log(visibleFields);
    return visibleFields.every((field) => {
      const value = getNestedValue(formData, field);

      if (field === "fatherName") {
        return true;
      }

      if (value instanceof File) {
        return value.size > 0;
      }

      return typeof value === "string" ? value.trim() !== "" : Boolean(value);
    });
  };

  // const generateAndSavePDF = async () => {
  //   setIsLoading(true);
  //   setError(null);

  //   try {
  //     const response = await axios.post('/api/pdf/save-pdf', formData);
  //     if (response.data.pdfDocUrl) {
  //       setDownloadLink(response.data.pdfDocUrl);
  //     }
  //     if (response.data.pdfBase64) {
  //       const pdfData = `data:application/pdf;base64,${response.data.pdfBase64}`;
  //       const pdfWindow = window.open(pdfData, '_blank');
  //       if (!pdfWindow) {
  //         throw new Error('Unable to open PDF.');
  //       }
  //       pdfWindow.document.write(
  //         `<html>
  //         <head><title>Preview PDF</title></head>
  //         <body>
  //           <embed src="${pdfData}" type="application/pdf" width="100%" height="100%">
  //         </body>
  //       </html>`
  //       );
  //     }
  //   } catch (error) {
  //     console.error('Error saving PDF:', error);
  //     alert('Failed to save PDF. Verify the data.');
  //     setError('Failed to save PDF. Verify the data.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const generatePDFPreview = async (type) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post("/api/pdf/preview-pdf", {
        formData,
        type,
      });
      const pdfBase64 = response.data.pdfBase64;
      const pdfBuffer = Buffer.from(pdfBase64, "base64"); // Декодуємо Base64
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });

      // Створюємо тимчасовий URL для файлу
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (err) {
      console.error(`Error generating ${type} PDF preview:`, err);
      setError(`Failed to generate ${type} PDF preview.`);
    } finally {
      setIsLoading(false);
    }
  };

  const savePDF = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post("/api/pdf/save-pdf", {
        formData,
        selectedDocuments,
        uid: user?.uid,
      });

      // Отримуємо сформовані PDF-файли
      const { agreementPDF, contractPDF, lawyersRequestPDF } = response.data;

      setFormData((prev) => ({
        ...prev,
        agreement: agreementPDF,
        contract: contractPDF,
        pdfDocUrl: lawyersRequestPDF,
      }));
    } catch (err) {
      console.error("Error saving documents:", err);
      setError("Failed to save documents.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;

    // setFormData({
    //   ...formData,
    //   [name]: value,
    //   recipient: {
    //     ...formData.recipient,
    //     [name]: value,
    //   },
    // });

    if (name.startsWith("recipient.")) {
      const key = name.split(".")[1];
      setFormData((formData) => ({
        ...formData,
        recipient: {
          ...formData.recipient,
          [key]: value,
        },
      }));
    } else {
      setFormData((formData) => ({
        ...formData,
        [name]: value,
      }));
    }
  };

  const handleChangeForFile = async (e) => {
    const { name, files } = e.target;

    if (name === "requesterFile" && files.length > 0) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: files[0],
      }));
    }
  };

  const handleCheckboxChange = async (e) => {
    const { name, checked } = e.target;
    setSelectedDocuments((prev) => ({ ...prev, [name]: checked }));

    // if (checked) {
    //   generatePDFPreview(name);
    // }
  };

  const handleRecipientChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      recipient: { ...prev.recipient, [name]: value },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    const dataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value instanceof File) {
        dataToSend.append(key, value, value.name);
      } else {
        dataToSend.append(key, value);
      }
    });

    fetch("/submit", {
      method: "POST",
      body: dataToSend,
    })
      .then((response) => response.json())
      .then((data) =>{
        console.log("Success:", data);
        // Зберігаємо formData в LocalStorage
        localStorage.setItem("formData", JSON.stringify(formData));
        // Перенаправляємо на сторінку Payment
        window.location.href = "/payment";
      })
      .catch((error) => console.error("Error", error));

    savePDF();
  };

  const getCountriesByLanguage = (lang) => {
    return Object.entries(countries.getNames(lang)).map(([code, name]) => ({
      value: code,
      label: name,
    }));
  };

  const [countryList, setCountryList] = useState(
    getCountriesByLanguage(language)
  );

  useEffect(() => {
    setCountryList(getCountriesByLanguage(language));
  }, [language]);

  const isAgreementValid = selectedDocuments.agreement;
  const isContractValid = selectedDocuments.contract;
  const isSubmitDisabled =
    !isFormValid() || !isAgreementValid || !isContractValid;

  return (
    <>
      <div className={styles.orderForm}>
        <form onSubmit={handleSubmit} className={styles.orderForm__form}>
          <h1>
            {language === "uk"
              ? "Сформувати адвокатський запит:"
              : language === "ru"
              ? "Сформировать адвокатский запрос:"
              : "Create a lawyer request:"}
          </h1>

          {/* {visibleFields.includes("citizenship") && ( */}
          <label className={styles.orderForm__form_lable}>
            <span className={styles.orderForm__form_span}>
              {language === "uk"
                ? "Громадянство:"
                : language === "ru"
                ? "Гражданство:"
                : "Citizenship:"}
              <span className={styles.orderForm__form_required}>*</span>
            </span>
            <div className={styles.orderForm__form_selectWrapper}>
              <select
                className={styles.orderForm__form_select}
                name="citizenship"
                value={formData.citizenship}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  {language === "uk"
                    ? "Виберіть країну"
                    : language === "ru"
                    ? "Выберите страну"
                    : "Select a country"}
                </option>
                {countryList.map((country) => (
                  <option key={country.value} value={country.label}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>
          </label>
          {/* )} */}

          {visibleFields.includes("surname") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Прізвище:"
                  : language === "ru"
                  ? "Фамилия:"
                  : "Surname:"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                placeholder="Степаненко"
                type="text"
                id="surname"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
                required
              />
            </label>
          )}

          {visibleFields.includes("name") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Ім`я:"
                  : language === "ru"
                  ? "Имя:"
                  : "Name:"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                placeholder="Степан"
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </label>
          )}

          {visibleFields.includes("fatherName") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "По-батькові:"
                  : language === "ru"
                  ? "Отчество:"
                  : "Patronymic:"}
              </span>
              <input
                className={styles.orderForm__form_input}
                placeholder="Степанович"
                type="text"
                id="fatherName"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
              />
            </label>
          )}

          {visibleFields.includes("birthday") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Дата народження:"
                  : language === "ru"
                  ? "Дата рождения:"
                  : "Birthday:"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                type="date"
                name="birthday"
                id="birthday"
                value={formData.birthday}
                onChange={handleChange}
                required
              />
            </label>
          )}

          {visibleFields.includes("requesterName") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "ПІБ (людина, яка робить запит):"
                  : language === "ru"
                  ? "ФИО (человек, делающий запрос):"
                  : "Full name (person making the request):"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                placeholder="Іванов Іван Іванович"
                type="text"
                id="requesterName"
                name="requesterName"
                value={formData.requesterName}
                onChange={handleChange}
                required
              />
            </label>
          )}

          {visibleFields.includes("requesterFile") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Документ який підтверджує рідство:"
                  : language === "ru"
                  ? "Документ подтверждающий родство:"
                  : "Document confirming kinship:"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                type="file"
                id="requesterFile"
                name="requesterFile"
                // value={formData.requesterFile}
                onChange={handleChangeForFile}
                required
              />
            </label>
          )}

          {visibleFields.includes("requesterBirthday") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Дата народження (людина, яка робить запит):"
                  : language === "ru"
                  ? "Дата рождения (человек, делающий запрос):"
                  : "Date of birth (person making the request):"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                type="date"
                id="requesterBirthday"
                name="requesterBirthday"
                value={formData.requesterBirthday}
                onChange={handleChange}
                required
              />
            </label>
          )}

          {visibleFields.includes("deathDay") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Дата смерті:"
                  : language === "ru"
                  ? "Дата смерти:"
                  : "Date of death:"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                type="date"
                name="deathDay"
                id="deathDay"
                value={formData.deathDay}
                onChange={handleChange}
                required
              />
            </label>
          )}

          {(formData.citizenship === "Україна" ||
            formData.citizenship === "Украина" ||
            formData.citizenship === "Ukraine") &&
            visibleFields.includes("passportNum") && (
              <label className={styles.orderForm__form_lable}>
                <span className={styles.orderForm__form_span}>
                  {language === "uk"
                    ? "Серія та номер паспорту:"
                    : language === "ru"
                    ? "Серия и номер паспорта:"
                    : "Passport series and number:"}
                  <span className={styles.orderForm__form_required}>*</span>
                </span>
                <input
                  className={styles.orderForm__form_input}
                  placeholder="483/473465"
                  type="text"
                  id="passportNum"
                  name="passportNum"
                  value={formData.passportNum}
                  onChange={handleChange}
                  required
                />
              </label>
            )}

          {visibleFields.includes("abroadPassnum") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Серія та номер закордонного паспорту:"
                  : language === "ru"
                  ? "Серия и номер загранпаспорта:"
                  : "Series and number of the international passport:"}
              </span>
              <input
                className={styles.orderForm__form_input}
                placeholder="483/473465"
                type="text"
                id="abroadPassnum"
                name="abroadPassnum"
                value={formData.abroadPassnum}
                onChange={handleChange}
              />
            </label>
          )}

          {formData.citizenship !== "Україна" &&
            formData.citizenship !== "Украина" &&
            formData.citizenship !== "Ukraine" &&
            visibleFields.includes("pmjNum") && (
              <label className={styles.orderForm__form_lable}>
                <span className={styles.orderForm__form_span}>
                  {language === "uk"
                    ? "Посвідка на проживання:"
                    : language === "ru"
                    ? "Вид на жительство:"
                    : "Residence permit:"}
                  <span className={styles.orderForm__form_required}>*</span>
                </span>
                <input
                  className={styles.orderForm__form_input}
                  placeholder="483/473465"
                  type="text"
                  id="pmjNum"
                  name="pmjNum"
                  value={formData.pmjNum}
                  onChange={handleChange}
                  required
                />
              </label>
            )}

          {visibleFields.includes("dateBorderCrossingStart") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Дата початку перетину кордону:"
                  : language === "ru"
                  ? "Дата начала пересечения границы:"
                  : "Border crossing start date:"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                type="date"
                name="dateBorderCrossingStart"
                id="dateBorderCrossingStart"
                value={formData.dateBorderCrossingStart}
                onChange={handleChange}
                required
              />
            </label>
          )}

          {visibleFields.includes("dateBorderCrossingEnd") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Дата закінчення перетину кордону:"
                  : language === "ru"
                  ? "Дата окончания пересечения границы:"
                  : "End date of border crossing:"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                type="date"
                name="dateBorderCrossingEnd"
                id="dateBorderCrossingEnd"
                value={formData.dateBorderCrossingEnd}
                onChange={handleChange}
                required
              />
            </label>
          )}

          {visibleFields.includes("couplePIB1") &&
            visibleFields.includes("couplePIB2") && (
              <label className={styles.orderForm__form_lable}>
                <span className={styles.orderForm__form_span}>
                  {language === "uk"
                    ? "ПІБ подружжя (тобто обох супругів):"
                    : language === "ru"
                    ? "ФИО супругов (то есть обоих супругов):"
                    : "Spouse's full name (i.e. both spouses):"}
                  <span className={styles.orderForm__form_required}>*</span>
                </span>
                <input
                  className={styles.orderForm__form_input}
                  placeholder="Іванов Іван Іванович"
                  type="text"
                  id="couplePIB1"
                  name="couplePIB1"
                  value={formData.couplePIB1}
                  onChange={handleChange}
                  required
                  style={{ marginBottom: 15 }}
                />
                <input
                  className={styles.orderForm__form_input}
                  placeholder="Іванов Вікторія Іванівна"
                  type="text"
                  id="couplePIB2"
                  name="couplePIB2"
                  value={formData.couplePIB2}
                  onChange={handleChange}
                  required
                />
              </label>
            )}

          {visibleFields.includes("dateResidence") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Дата надання довідки про місце проживання:"
                  : language === "ru"
                  ? "Дата предоставления справки о месте жительства:"
                  : "Date of issuance of residence certificate:"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                type="date"
                name="dateResidence"
                id="dateResidence"
                value={formData.dateResidence}
                onChange={handleChange}
                required
              />
            </label>
          )}

          {visibleFields.includes("recipient.name") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Назва (район) ТЦК:"
                  : language === "ru"
                  ? "Название (район) ТЦК:"
                  : "Name (district) of the Territorial Recruitment Centers:"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                placeholder="ТЦК Приклад"
                type="text"
                id="recipientName"
                name="recipient.name"
                value={formData.recipient.name}
                onChange={handleChange}
                required
              />
            </label>
          )}

          {visibleFields.includes("recipient.address") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Електронна пошта ТЦК:"
                  : language === "ru"
                  ? "Электронная почта ТЦК:"
                  : "Email of the Territorial Recruitment Centers:"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                type="email"
                id="recipientAddress"
                name="recipient.address"
                value={formData.recipient.address}
                onChange={handleChange}
                required
              />
            </label>
          )}

          {visibleFields.includes("eventDate") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Дата події:"
                  : language === "ru"
                  ? "Дата события:"
                  : "Event date:"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                type="date"
                name="eventDate"
                id="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                required
              />
            </label>
          )}

          {visibleFields.includes("eventTime") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Час події:"
                  : language === "ru"
                  ? "Время события:"
                  : "Event time:"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                type="time"
                name="eventTime"
                id="eventTime"
                value={formData.eventTime}
                onChange={handleChange}
                required
              />
            </label>
          )}

          {visibleFields.includes("eventPlace") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Місце події:"
                  : language === "ru"
                  ? "Место события:"
                  : "Event location:"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                type="text"
                placeholder="м.Київ, вул.Вулиця 1"
                name="eventPlace"
                id="eventPlace"
                value={formData.eventPlace}
                onChange={handleChange}
                required
              />
            </label>
          )}

          {visibleFields.includes("ipn") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "ІПН (єдрпоу):"
                  : language === "ru"
                  ? "ИНН (едрпоу):"
                  : "TIN (Edrpou):"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                type="text"
                placeholder="34543456"
                name="ipn"
                id="ipn"
                value={formData.ipn}
                onChange={handleChange}
                required
              />
            </label>
          )}

          {visibleFields.includes("propertyAddress") && (
            <label className={styles.orderForm__form_lable}>
              <span className={styles.orderForm__form_span}>
                {language === "uk"
                  ? "Адреса майна:"
                  : language === "ru"
                  ? "Адрес имущества:"
                  : "Property address:"}
                <span className={styles.orderForm__form_required}>*</span>
              </span>
              <input
                className={styles.orderForm__form_input}
                type="text"
                placeholder="м.Київ, вул.Вулиця 1"
                name="propertyAddress"
                id="propertyAddress"
                value={formData.propertyAddress}
                onChange={handleChange}
                required
              />
            </label>
          )}

          <button
            type="button"
            className={styles.orderForm__form_button}
            onClick={() => generatePDFPreview("lawyersRequest")}
          >
            {isLoading
              ? language === "uk"
                ? "Формується..."
                : language === "ru"
                ? "Формируется..."
                : "Generating..."
              : language === "uk"
              ? "Сформувати запит"
              : language === "ru"
              ? "Сформировать запрос"
              : "Lawyer`s request generate"}
          </button>
          {error && <p style={{ color: "red" }}>{error}</p>}

          {/* {downloadLink && (
            <div className={styles.orderForm__form_file}>
              <a
                className={styles.orderForm__form_download}
                style={{ textDecoration: 'none' }}
                href={downloadLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {language === 'uk'
                  ? 'Завантажити PDF'
                  : language === 'ru'
                  ? 'Скачать PDF'
                  : 'Download PDF'}
              </a>
            </div>
          )} */}

          <div className={styles.checkbox_wrapper_29}>
            <div>
              <label>
                <input
                  className={styles.checkbox__input}
                  type="checkbox"
                  name="agreement"
                  checked={selectedDocuments.agreement}
                  onChange={handleCheckboxChange}
                />
                <span className={styles.checkbox__label}></span>
              </label>

              <label
                className={styles.label}
                htmlFor="agreement-checkbox"
                onClick={() => generatePDFPreview("agreement")}
              >
                {language === "uk"
                  ? "Даю згоду на обробку персональних даних"
                  : language === "ru"
                  ? "Соглашаюсь на обработку персональных данных"
                  : "I consent to the processing of personal data"}
              </label>
            </div>

            <div>
              <label>
                <input
                  className={styles.checkbox__input}
                  type="checkbox"
                  name="contract"
                  checked={selectedDocuments.contract}
                  onChange={handleCheckboxChange}
                />
                <span className={styles.checkbox__label}></span>
              </label>

              <label
                className={styles.label}
                htmlFor="contract-checkbox"
                onClick={() => generatePDFPreview("contract")}
              >
                {language === "uk"
                  ? "Даю згоду на укладання договору про надання правової допомоги"
                  : language === "ru"
                  ? "Даю согласие на заключение договора о предоставлении правовой помощи"
                  : "I consent to the conclusion of a legal assistance agreement."}
              </label>
            </div>
          </div>

          <button
            // onClick={(e) => handleSubmit(e)}
            disabled={isLoading || isSubmitDisabled}
            // disabled={isLoading}
            type="submit"
            className={styles.orderForm__form_button}
          >
            {isLoading
              ? language === "uk"
                ? "Збереження..."
                : language === "ru"
                ? "Сохранение..."
                : "Saving..."
              : language === "uk"
              ? "Зберегти всі документи"
              : language === "ru"
              ? "Сохранить все документы"
              : "Save all documents"}
          </button>
        </form>
      </div>
    </>
  );
}

LawyersRequestForm.propType = {
  request: PropTypes.object.isRequired,
  currentLanguage: PropTypes.string,
};
