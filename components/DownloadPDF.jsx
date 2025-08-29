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
  signaturePlaceholder: {
    fontSize: 10,
    minWidth: 50,
    marginTop: 20,
    textAlign: 'left',
    color: 'white',
  },
});

const getValue = (value, fallback = '') => value || fallback;
const PIB = value =>
  [value?.surname, value?.name, value?.fatherName].filter(i => i).join(' ');
const formatDate = dateString => {
  if (!dateString) return '';
  const months = [
    'січня',
    'лютого',
    'березня',
    'квітня',
    'травня',
    'червня',
    'липня',
    'серпня',
    'вересня',
    'жовтня',
    'листопада',
    'грудня',
  ];
  const parts = dateString.split('.');
  if (parts.length !== 3) return dateString; // Повертаємо як є, якщо формат невірний
  const day = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const year = parts[2];
  if (isNaN(monthIndex)) return dateString;

  return `${day} ${months[monthIndex]} ${year} року`;
};

// Функція для обробки вхідних даних
const parseRequestContent = data => {
  // Замінюємо плейсхолдери
  const parsedContent = data.request.ua.text
    .replaceAll('[П.І.Б. клієнта]', PIB(data) || 'невідомий клієнт')
    .replaceAll('[П.І.Б. особи]', PIB(data) || '')
    .replaceAll(
      '[П.І.Б. особи, в інтересах якої подається запит]',
      PIB(data) || ''
    )
    .replaceAll(
      '[П.І.Б. військовослужбовця]',
      PIB(data) || 'військовослужбовця'
    )
    .replaceAll(
      '[П.І.Б. дата народження особи, в інтересах якої подається запит]',
      [PIB(data) || 'невідомий клієнт', data?.birthday || '']

        .filter(i => i)
        .join(', ')
    )
    .replaceAll(
      '[П.І.Б. подружжя, в інтересах яких подається запит]',
      [data?.couplePIB1 || 'невідомо', data?.couplePIB2 || '']
        .filter(i => i)
        .join(', ')
    )
    .replaceAll(
      '[П.І.Б. дати народження подружжя, в інтересах яких подається запит].',
      [
        [data?.couplePIB1 || 'невідомо', data?.coupleBirthday1 || '']

          .filter(i => i)
          .join(', '),
        [data?.couplePIB2 || 'невідомо', data?.coupleBirthday2 || '']

          .filter(i => i)
          .join(', '),
      ]

        .filter(i => i)
        .join(' та ')
    )
    .replaceAll(
      '[П.І.Б. дата народження та смерті]',
      [
        data?.deadName || 'невідомо',
        [
          data?.deadBirthday || 'невідома дата народження',
          data?.deadDeathDay || 'невідома дата смерті',
        ]

          .filter(i => i)
          .join(' - '),
      ]

        .filter(i => i)
        .join(', ')
    )
    .replaceAll('[вказати ступінь родинного зв’язку ] ', [
      data?.deadRelationship || 'невідомо ким',
    ])
    .replaceAll(
      '[П.І.Б. особи, в інтересах якої подається запит, дата народження, місце проживання]',
      [
        PIB(data) || 'невідомий клієнт',
        data?.birthday || '',
        [
          data?.residence?.address,
          data?.residence?.city,
          data?.residence?.country,
        ]

          .filter(i => i)
          .join(', ') || '',
      ]

        .filter(i => i)
        .join(', ')
    )
    .replaceAll(
      '[вказати адресу майна]',
      data?.propertyAddress || 'адреса невідома'
    )
    .replaceAll(
      '[вказати дату та місце події]',
      [
        data?.eventDate || 'дата невідома',
        data?.eventPlace || 'адреса невідома',
      ]

        .filter(i => i)
        .join(' ')
    )
    .replaceAll(
      '[вказати дату та час зупинки]',
      [data?.eventDate || 'дата невідома', data?.eventTime || 'час невідома']

        .filter(i => i)
        .join(' ')
    )
    .replaceAll(
      '[вказати дату або поточну дату]',
      data?.eventDate || data?.dateCreating
    )
    .replaceAll(
      '[Громадянство,П.І.Б.дата народження особи, в інтересах якої подається запит,серія та номер документу]',
      [
        data?.citizenship || '',
        PIB(data) || 'невідомий клієнт',
        data?.birthday || '',
        [data?.abroadPassnum || data?.passport || data?.pmjNum || '']

          .filter(i => i)
          .join(' '),
      ]

        .filter(i => i)
        .join(', ')
    )
    .replaceAll('[дата початку]', data?.date?.start || 'дата початку невідома')
    .replaceAll(
      '[дата закінчення]',
      data?.date?.end || 'дата закінчення невідома'
    )
    .replaceAll('[вказати дату]', data?.dateCreating || 'невідомо')
    .replaceAll(
      '[вказати ІПН для фізичної особи або код ЄДРПОУ для юридичної особи]',
      data?.inn || 'невідомо'
    )
    .replaceAll(
      '[П.І.Б. клієнта, ІПН в інтересах якого подається запит]',
      [PIB(data) || 'невідомий клієнт', data?.inn || '']

        .filter(i => i)
        .join(', ')
    );

  // Видаляємо теги <p>, <ul> і <li>, розділяємо текст і список
  // const introText =
  //   parsedContent
  //     .split('<ul>')[0]
  //     ?.replace(/<\/?p[^>]*>/g, '')
  //     .trim() || '';
  // Розділяємо текст із тегами <p>
  const paragraphs =
    parsedContent
      .match(/<p>(.*?)<\/p>/g)
      ?.map(p => p.replace(/<\/?p[^>]*>/g, '').trim()) || [];
  const listItems = (parsedContent.match(/<li>(.*?)<\/li>/g) || []).map(item =>
    item.replace(/<\/?li[^>]*>/g, '').trim()
  );

  // Повертаємо розділені частини
  return { introText: paragraphs, listItems };
};

export const LawyersRequest = ({ data, lawyer }) => {
  const requestText = data?.request?.ua?.text;
  const { introText, listItems } = requestText
    ? parseRequestContent(data)
    : { introText: [], listItems: [] };

  const lawyerPIB = lawyer
    ? `${lawyer.surname} ${lawyer.name} ${lawyer.fathersName}`.trim()
    : 'СТРОГИЙ ВАЛЕРІЙ ФЕДОРОВИЧ';
  const lawyerApplication = lawyer ? lawyer.application : 'В.Ф.Строгий';
  const lawyerAddress = lawyer
    ? lawyer.address
    : 'м.Харків, вул.Клочківська, 350';
  const lawyerTel = lawyer ? lawyer.tel : '095-642-94-14';
  const lawyerEmail = lawyer ? lawyer.email : 'info.ggs.ua@gmail.com';
  const lawyerCertificate = lawyer
    ? `свідоцтво №${lawyer.certificate?.number} від ${formatDate(
        lawyer.certificate?.date
      )}`
    : 'свідоцтво №278 від 18 липня 2005 року';

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
            <Text>{lawyerPIB.toUpperCase()}</Text>
          </View>
          <View style={styles.headerSubtitle}>
            <Text>
              адреса: {lawyerAddress}, моб.тел. {lawyerTel},
            </Text>
            <Text>
              ел.пошта <Link href="mailto:${lawyerEmail}">{lawyerEmail}</Link>{' '}
              {lawyerCertificate}
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

        {/* <View style={styles.section}>
          <Text style={styles.text}>{introText}</Text>
        </View> */}

        <View style={styles.section}>
          {introText.map((paragraph, index) => (
            <Text style={styles.text} key={`paragraph-${index}`}>
              {paragraph}
            </Text>
          ))}
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
          {/* <Text style={styles.textNoIndent}>______</Text> */}
          <Text style={styles.signaturePlaceholder}>S4</Text>
          <Text style={styles.textNoIndent}>{lawyerApplication}</Text>
        </View>
      </Page>
    </Document>
  );
};
