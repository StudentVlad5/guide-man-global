"use client";
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "white",
    paddingVertical: 50,
    paddingLeft: 100,
    paddingRight: 50,
    fontFamily: "Roboto",
    fontSize: 11,
    fontStyle: "normal",
    lineHeight: 1.3,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    marginTop: 10,
    marginBottom: 10,
    marginLeft: "auto",
    width: "60%",
    fontSize: 10,
    textAlign: "left",
  },
  headerTitle: {
    paddingBottom: 5,
    fontSize: 14,
    fontWeight: "bold",
  },
  headerSubtitle: {
    paddingTop: 10,
    marginBottom: 30,
  },
  line: {
    width: "100%",
    marginBottom: 4,
    borderBottomColor: "black",
    borderBottomStyle: "solid",
    borderBottomWidth: 2,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    marginBottom: 10,
  },
  sectionTitle: {
    display: "flex",
    flexDirection: "column",
    marginTop: 20,
    marginBottom: 15,
    textAlign: "left",
  },
  title: {
    fontSize: 11,
    textTransform: "uppercase",
    textAlign: "center",
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
  },
  text: {
    textIndent: 30,
    textAlign: "justify",
  },
  textNoIndent: {
    textAlign: "justify",
  },
  italic: {
    fontStyle: "italic",
  },
  bold: {
    fontWeight: "bold",
  },
  boldItalic: {
    fontStyle: "italic",
    fontWeight: "bold",
  },
  underline: {
    fontWeight: "bold",
    textDecoration: "underline",
  },
  signature: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 60,
    paddingRight: 50,
  },
  signaturePlaceholder: {
    fontSize: 10,
    minWidth: 50,
    textAlign: "left",
    color: "white",
  },
});

const getValue = (value, fallback = "") => value || fallback;
const getBirthday = (value) => {
  if (!value?.birthday) return "";
  try {
    const date = new Date(value.birthday);
    return isNaN(date) ? "" : date.toLocaleDateString("ru-RU");
  } catch {
    return "";
  }
};
const PIB = (value) =>
  [value?.surname, value?.name, value?.fatherName || ""]
    .filter((i) => i)
    .join(" ");
const getPassword = (value) =>
  value?.abroadPassnum || value?.passport || value?.pmjNum || "";

export const Agreement = ({ data }) => {
  const buildDataString = () => {
    const parts = [
      getValue(data.citizenship),
      PIB(data),
      getBirthday(data),
      getPassword(data),
    ];

    // Фільтруємо пусті значення та об'єднуємо через кому
    return parts.filter((part) => part).join(", ");
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              До будь-якої заінтересованої установи
            </Text>
            <Text style={styles.textNoIndent}>
              (державного органу, организації)
            </Text>
          </View>
          <View style={styles.headerSubtitle}>
            <Text style={styles.textNoIndent}>Адвокату </Text>
            <Text style={styles.textNoIndent}>
              Строгому Валерію Федоровичу,
            </Text>
            <Text style={styles.textNoIndent}>
              Свідоцтво про право на зайняття адвокатською діяльністю №278 від
              18.07.2005 р.
            </Text>
          </View>
        </View>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.sectionTitle}>
          <Text style={styles.title}>Заява</Text>
          <Text style={styles.boldItalic}>
            про надання дозволу/розголошення інформації з обмеженим доступом
            (конфіденційної інформації,персональних даних)
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.text}>
            Я, громадянин(-ка) {buildDataString()}, відповідно до Закону Україні
            «Про захист персональних даних», надаю згоду адвокату Строгому
            Валерію Федоровичу на отримання від будь-яких органів державної
            влади України або місцевого самоврядування, підприємств, установ,
            організацій, фізичних осіб, а також на обробку, зберігання та
            розповсюдження (збирання, використання, тощо) моїх персональних
            даних, що відносяться до конфіденційної інформації/інформації з
            обмеженим доступом, в тому числі з баз персональних даних (стаття 14
            закону України «Про захист персональних даних»), з метою отримання
            інформації про виготовлення на моє ім’я внутрішнього паспорту (id
            карти) громадянина України.
          </Text>
          <Text style={styles.text}>
            З моїх слів надруковано вірно. Згоду надаю добровільно, повністю
            розуміючі значення своїх дії.
          </Text>
        </View>
        <View style={styles.signature}>
          <Text style={styles.textNoIndent}>
            {getValue(data.dateCreating)} року
          </Text>
          <Text style={styles.signaturePlaceholder}>S1</Text>
          {/* <Text style={styles.signaturePlaceholder}>D1</Text> */}
          <Text style={styles.text}>{PIB(data)}</Text>
        </View>
        {/* <Text style={styles.signaturePlaceholder}>S3</Text> */}
        {/* <Text style={styles.signaturePlaceholder}>D3</Text> */}
      </Page>
    </Document>
  );
};
