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
    marginBottom: 20,
  },
  headerTitle: {
    fontWeight: "bold",
    textTransform: "uppercase",
    textAlign: "center",
  },
  title: {
    marginTop: 15,
    marginBottom: 15,
    fontWeight: "bold",
    textTransform: "uppercase",
    textAlign: "center",
  },
  address: {
    display: "flex",
    flexDirection: "row",
    flexShrink: 1,
    justifyContent: "space-between",
    marginTop: 15,
    paddingRight: 50,
    fontWeight: "bold",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    textIndent: 30,
  },
  text: {
    textIndent: 30,
    textAlign: "justify",
  },
  textNoIndent: {
    textAlign: "justify",
  },
  bold: {
    fontWeight: "bold",
  },
  signature: {
    display: "flex",
    flexDirection: "row",
    flexShrink: 1,
    justifyContent: "space-between",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignContent: "center",
    padding: 10,
    width: "50%",
    fontWeight: "bold",
    border: "1px solid black",
  },
  signaturePlaceholder: {
    fontSize: 10,
    minWidth: 50,
    marginTop: 20,
    textAlign: "left",
    color: "white",
  },
});

const getValue = (value, fallback = "") => value || fallback;
const PIB = (value) =>
  [value?.surname, value?.name, value?.fatherName || ""]
    .filter((i) => i)
    .join(" ");

export const Contract = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ДОГОВІР</Text>
          <Text style={styles.headerTitle}>
            ПРО НАДАННЯ ПРАВНИЧОЇ (ПРАВОВОЇ) ДОПОМОГИ
          </Text>
          <View style={styles.address}>
            <Text>м. Київ</Text>
            <Text>{getValue(data.dateCreating)} року</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.text}>
            <Text style={[styles.bold, { textIndent: "30" }]}>АДВОКАТ</Text>,
            член Національної асоціації Адвокатів України,{" "}
            <Text style={styles.bold}>СТРОГИЙ ВАЛЕРІЙ ФЕДОРОВИЧ,</Text> який діє
            на підставі Свідоцтва про право на заняття адвокатською діяльністю
            №278 яке видане 18 липня 2005 року Радою адвокатів Чернігівської
            області, з одного боку,{" "}
          </Text>
          <Text style={styles.text}>
            <Text
              style={[
                styles.bold,
                { textIndent: "30", textTransform: "uppercase" },
              ]}
            >
              КЛІЄНТ {PIB(data)}
            </Text>
            , зареєстрований за адресою: {getValue(data.address)}, з другого
            боку, уклали цей договір про таке:
          </Text>
        </View>
        <Text style={styles.title}> 1. ПРЕДМЕТ ДОГОВОРУ </Text>
        <Text style={styles.textNoIndent}>
          1.1. <Text style={styles.bold}>КЛІЄНТ</Text> доручає, а{" "}
          <Text style={styles.bold}>АДВОКАТ</Text>, відповідно до чинного
          законодавства України бере на себе обов’язок надати{" "}
          <Text style={styles.bold}>КЛІЄНТУ</Text> професійну правничу (правову)
          допомогу у всіх інстанціях (суди, правоохоронні органи, підприємства,
          установи, організації незалежно від форми власності).{" "}
          <Text style={styles.bold}>КЛІЄНТ</Text> зобов’язується оплатити
          гонорар <Text style={styles.bold}>АДВОКАТУ</Text> в порядку та
          розмірах, передбачених цим Договором.
        </Text>
        <Text style={styles.textNoIndent}>
          1.2. <Text style={styles.bold}>КЛІЄНТ</Text> зобов’язується надати{" "}
          <Text style={styles.bold}>АДВОКАТУ</Text> необхідну для виконання умов
          Договору інформацію та документацію, інформувати про всі суттєві зміни
          в процесі надання правової допомоги, які можуть вплинути на результат
          їх надання.
        </Text>
        <Text style={styles.textNoIndent}>
          1.3. <Text style={styles.bold}>АДВОКАТ</Text> уповноважений
          здійснювати дії, передбачені ст. 20 ЗУ «Про адвокатуру та адвокатську
          діяльність», а також будь-які інші необхідні дії, не заборонені чинним
          законодавством України та цим Договором.
        </Text>
        <Text style={styles.textNoIndent}>
          1.4. Обсяг повноважень <Text style={styles.bold}>АДВОКАТА</Text> для
          надання правничої (правової) допомоги за цим Договором визначається в
          Ордері, виданому <Text style={styles.bold}>АДВОКАТОМ</Text>.
          Застереження щодо повноважень: без обмежень.
        </Text>
        <Text style={styles.title}>2. ГОНОРАР. ПОРЯДОК РОЗРАХУНКІВ </Text>
        <Text style={styles.textNoIndent}>
          2.1. Гонорар <Text style={styles.bold}>АДВОКАТА</Text> – винагорода за
          надання правничої (правової) допомоги за цим Договором, розмір якого
          та порядок оплати узгоджується Сторонами окремо.
        </Text>
        <Text style={styles.title}>3. ВІДПОВІДАЛЬНІСТЬ СТОРІН </Text>
        <Text style={styles.textNoIndent}>
          3.1. При невиконанні чи неналежному виконанні зобов`язань за цим
          Договором Сторони несуть відповідальність, передбачену чинним
          законодавством України.
        </Text>
        <Text style={styles.textNoIndent}>
          3.2. <Text style={styles.bold}>АДВОКАТ</Text> не несе відповідальності
          за наслідки, які пов’язані з наданням{" "}
          <Text style={styles.bold}>КЛІЄНТОМ</Text> документів, які не
          відповідають дійсності.
        </Text>
        <Text style={styles.textNoIndent}>
          3.3. Усі спори, що виникають з цього Договору або пов`язані із ним, у
          тому числі пов`язані із дійсністю, укладенням, виконанням, зміною чи
          припиненням цього Договору, тлумаченням його умов, визначенням
          наслідків недійсності або порушення Договору, вирішуються шляхом
          переговорів між представниками Сторін.
        </Text>
        <Text style={styles.textNoIndent}>
          3.4. Якщо відповідний спір неможливо вирішити шляхом переговорів, він
          вирішується в судовому порядку за встановленою підвідомчістю та
          підсудністю такого спору відповідно до чинного законодавства України.
        </Text>
        <Text style={styles.title}>
          4. СТРОК ДІЇ ДОГОВОРУ ТА УМОВИ ЙОГО РОЗІРВАННЯ
        </Text>
        <Text style={styles.textNoIndent}>
          4.1. Цей Договір набирає чинності з моменту підписання і діє до
          повного виконання Сторонами своїх зобов’язань за цим Договором.
        </Text>
        <Text style={styles.textNoIndent}>
          4.2. Договір може бути достроково припинений за взаємною згодою сторін
          або розірваний на вимогу однієї із Сторін. При цьому{" "}
          <Text style={styles.bold}>КЛІЄНТ</Text> зобов’язаний оплатити{" "}
          <Text style={styles.bold}>АДВОКАТУ</Text> гонорар за всю роботу, що
          була виконана чи підготовлена до виконання, а{" "}
          <Text style={styles.bold}>АДВОКАТ</Text> зобов’язаний повідомити{" "}
          <Text style={styles.bold}>КЛІЄНТА</Text> про можливі наслідки та
          ризики, пов’язані з достроковим припиненням (розірванням) договору.
        </Text>
        <Text style={styles.title}>5. ІНШІ УМОВИ </Text>
        <Text style={styles.textNoIndent}>
          5.1. Зміст цього Договору є предметом адвокатської таємниці, за
          виключенням повноважень, наданих{" "}
          <Text style={styles.bold}>АДВОКАТУ</Text>{" "}
          <Text style={styles.bold}>КЛІЄНТОМ</Text> для виконання доручення.
        </Text>
        <Text style={styles.textNoIndent}>
          5.2. Будь-які побажання, прохання або вказівки{" "}
          <Text style={styles.bold}>КЛІЄНТА</Text>, спрямовані на порушення
          закону, або суперечитимуть загальним засадам суспільства, не можуть
          бути виконані <Text style={styles.bold}>АДВОКАТОМ</Text>.
        </Text>
        <Text style={styles.textNoIndent}>
          5.3. <Text style={styles.bold}>КЛІЄНТ</Text> не має права вимагати від{" "}
          <Text style={styles.bold}>АДВОКАТА</Text> засобів, способів і методів
          представництва, які заборонені законом, не відповідають правилам
          адвокатської етики, можуть зашкодити інтересам{" "}
          <Text style={styles.bold}>КЛІЄНТА</Text>.
        </Text>
        <Text style={styles.textNoIndent}>
          5.4. Будь-які зміни і доповнення до договору мають силу тільки в тому
          випадку, якщо вони оформлені в письмовому вигляді і підписані обома
          Сторонами. У разі зміни характеру та обсягу послуг виконуваних{" "}
          <Text style={styles.bold}>АДВОКАТОМ</Text> за Договором, Сторони
          повинні провести переговори про зміну умов Договору і укласти
          додаткову угоду до Договору.
        </Text>
        <Text style={styles.textNoIndent}>
          5.5. Питання, що не врегульовані цим Договором регулюються чинним
          законодавством України.
        </Text>
        <Text style={styles.textNoIndent}>
          5.6. Цей Договір складено у двох автентичних примірниках для кожної із
          Сторін.
        </Text>
        <Text style={styles.title}>6. РЕКВІЗИТИ СТОРІН</Text>
        <View>
          <View style={styles.signature}>
            <View style={styles.list}>
              <Text style={styles.textNoIndent}>Клієнт</Text>
              <Text style={styles.textNoIndent}>{PIB(data)}</Text>
              <Text style={styles.signaturePlaceholder}>S2</Text>
              <Text style={styles.signaturePlaceholder}>D2</Text>
            </View>
            <View style={styles.list}>
              <Text style={styles.textNoIndent}>Адвокат</Text>
              <Text style={styles.textNoIndent}>Строгий Валерій Федорович</Text>
              <Text style={styles.signaturePlaceholder}>S4</Text>
              <Text style={styles.signaturePlaceholder}>D4</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
