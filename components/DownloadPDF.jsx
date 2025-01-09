'use client';
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Link,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    paddingVertical: 50,
    paddingLeft: 100,
    paddingRight: 50,
    fontFamily: 'Roboto',
    fontSize: 16,
    fontStyle: 'normal',
    lineHeight: 1.3,
    letterSpacing: '-0.35px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  headerTitle: {
    paddingBottom: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    borderBottomColor: 'black',
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
  },
  headerSubtitle: {
    paddingTop: 10,
    fontStyle: 'italic',
    lineHeight: 0.9,
    letterSpacing: '-0.75px',
    textAlign: 'left',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 10,
  },
  address: {
    display: 'flex',
    flexDirection: 'row',
    flexShrink: 1,
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
    paddingRight: 50,
    fontSize: 14,
  },
  sectionTitle: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 15,
    fontSize: 14,
    textAlign: 'center',
  },
  title: {
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  text: {
    textIndent: 30,
    textAlign: 'justify',
  },
  textNoIndent: {
    textAlign: 'justify',
  },
  italic: {
    fontStyle: 'italic',
  },
  bold: {
    fontWeight: 'bold',
  },
  boldItalic: {
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  underline: {
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  apps: {
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
    marginTop: 30,
    paddingLeft: 40,
    paddingRight: 40,
  },
  signature: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 80,
  },
  img: {
    width: 50,
    height: 55,
    marginBottom: 10,
    alignSelf: 'center',
  },
});

const getValue = (value, fallback = '') => value || fallback;
const PIB = value =>
  [value?.surname, value?.name, value?.fatherName].filter(i => i).join(' ');

// Функція для обробки вхідних даних
const parseRequestContent = data => {
  // Замінюємо плейсхолдери
  const parsedContent = data.request.ua.text
    .replaceAll('[П.І.Б. клієнта]', PIB(data) || 'невідомий клієнт')
    .replaceAll(
      '[вказати адресу майна]',
      data?.propertyAddress || 'адреса невідома'
    )
    .replaceAll(
      '[вказати дату та місце події]',
      [
        data?.eventDate || 'дата невідома',
        data?.eventPlace || 'адреса невідома',
      ].join(' ')
    );

  // // Видаляємо теги <p>, <ul> і <li>, розділяємо текст і список
  const introTextMatch = parsedContent.split('<ul>')[0] || '';
  const cleanIntroText = introTextMatch.replace(/<\/?p[^>]*>/g, '').trim();

  const listItemsMatch = parsedContent.match(/<li>(.*?)<\/li>/g) || [];
  const listItems = listItemsMatch.map(item =>
    item.replace(/<\/?li[^>]*>/g, '').trim()
  );

  // Повертаємо розділені частини
  return { introText: cleanIntroText, listItems };
};

export const LawyersRequest = ({ data }) => {
  const requestText = data?.request?.ua?.text;
  const { introText, listItems } = requestText
    ? parseRequestContent(data)
    : { introText: '', listItems: [] };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Image src={data.emblemBase64} style={styles.img} alt="emblem" />
            <Text style={{ fontSize: 16 }}>
              НАЦІОНАЛЬНА АСОЦІАЦІЯ АДВОКАТІВ УКРАЇНИ
            </Text>
            <Text>АДВОКАТ</Text>
            <Text>СТРОГИЙ ВАЛЕРІЙ ФЕДОРОВИЧ</Text>
          </View>
          <View style={styles.headerSubtitle}>
            <Text>
              адреса: м.Харків, вул.Клочківська, 350, моб.тел. 095-642-94-14,
            </Text>
            <Text>
              ел.пошта{' '}
              <Link href="mailto:info.ggs.ua@gmail.com">
                info.ggs.ua@gmail.com
              </Link>{' '}
              свідоцтво №278 від 18 липня 2005 року
            </Text>
          </View>
        </View>
        <View style={styles.address}>
          <View style={styles.section}>
            <Text style={styles.textNoIndent}>
              {getValue(data.dateCreating)}
            </Text>
          </View>
          <View style={[styles.section, { maxWidth: '50%' }]}>
            <Text style={styles.textNoIndent}>
              До {getValue(data.recipient?.name)}
            </Text>
            <Text style={styles.textNoIndent}>
              Адреса: {getValue(data.recipient?.address)}
            </Text>
          </View>
        </View>
        <View style={styles.sectionTitle}>
          <Text style={styles.title}>ЗАПИТ</Text>
          <Text style={styles.subtitle}>
            (в порядку статей 20, 24 Закону України «Про адвокатуру та
            адвокатську діяльність»)
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.text}>
            Відповідно до ст. 24 ЗУ «Про адвокатуру та адвокатської діяльності»
            Орган державної влади, орган місцевого самоврядування, їх посадові
            та службові особи, керівники підприємств, установ, організацій,
            громадських об’єднань, яким направлено адвокатський запит,
            зобов’язані{' '}
            <Text style={styles.underline}>
              не пізніше п’яти робочих днів з дня отримання запиту{' '}
            </Text>{' '}
            надати адвокату відповідну інформацію, копії документів, крім
            інформації з обмеженим доступом і копій документів, в яких міститься
            інформація з обмеженим доступом (ч. 2).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.text}>{introText}</Text>
        </View>

        {listItems.length > 0 && (
          <View style={styles.section}>
            {listItems.map((item, index) => (
              <Text style={styles.textNoIndent} key={`item-${index}`}>
                {item}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.textNoIndent}>
            Даний запит подається в інтересах {PIB(data)}, з його згодою на збір
            та обробку персональних даних відповідно до законодавства України.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.textNoIndent}>
            <Text style={styles.bold}>
              Відповідь на даний запит надіслати електронною поштою на адресу:{' '}
              <Text style={styles.italic}>info.ggs.ua@gmail.com</Text> в
              п’ятиденний термін з дня отримання даного запиту.
            </Text>
          </Text>
        </View>
        <View style={styles.apps}>
          <Text style={styles.italic}>Додаток:{'   '} </Text>
          <View style={styles.list}>
            <Text style={styles.italic}>- копія ордеру </Text>
            <Text style={styles.italic}>
              - копія свідоцтва про право на заняття адвокатською діяльністю
            </Text>
            <Text style={styles.italic}>
              - згода на розголошення персональних даних
            </Text>
          </View>
        </View>
        <View style={styles.signature}>
          <Text style={styles.textNoIndent}>З повагою, адвокат</Text>
          <Text style={styles.textNoIndent}>______</Text>
          <Text style={styles.textNoIndent}>В.Ф.Строгий</Text>
        </View>
      </Page>
    </Document>
  );
};
