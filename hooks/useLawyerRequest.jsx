import { useState, useContext } from 'react';
import { AppContext } from '../components/AppProvider';

export const useLawyerRequest = request => {
  const { user } = useContext(AppContext);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [message, setMessage] = useState('');
  const [orderPayId, setOrderPayId] = useState();
  const { lawyerData } = useContext(AppContext);

  const initialFormData = {
    id: Math.floor(Date.now() * Math.random()).toString(),
    uid: user?.uid || '',
    paymentStatus: paymentStatus,
    orderPayId: orderPayId,
    citizenship: '', //ВСІ ФОРМИ
    name: '', //АДПСУ, РАЦС, МОУ і ТЦК, МВС, ПФУ і ДПСУ, ВПО
    surname: '', //АДПСУ, РАЦС, МОУ і ТЦК, МВС, ПФУ і ДПСУ, ВПО
    fatherName: '', //АДПСУ, РАЦС, МОУ і ТЦК, МВС, ПФУ і ДПСУ, ВПО
    email: '', //ВСІ ФОРМИ
    birthday: '', //АДПСУ, РАЦС, МОУ і ТЦК, МВС
    residence: {
      address: '',
      city: '',
      country: '',
    }, //РАЦС
    requesterBirthday: '', //РАЦС
    requesterName: '', //РАЦС
    requesterFile: [], //РАЦС
    //дані про смерть
    deadName: '', //РАЦС
    deadDeathDay: '', //РАЦС
    deadBirthday: '', //РАЦС
    deadRelationship: '', //РАЦС
    dateCreating: new Date() //ВСІ ФОРМИ
      .toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
    recipient: {
      name: '', //МОУ і ТЦК
      address: '', //МОУ і ТЦК
    },
    servicemanPIB: '', //МОУ і ТЦК
    rank: '', //МОУ і ТЦК
    unit: '', //МОУ і ТЦК
    date: { start: '', end: '' }, //АДПСУ, МОУ і ТЦК
    // ПАСПОРТИ
    abroadPassnum: '', //АДПСУ
    passport: '', //АДПСУ, ЗАМІСТЬ passportNum
    pmjNum: '', //АДПСУ,
    // Подружжя (дані супругів)
    couplePIB1: '', //РАЦС
    couplePIB2: '', //РАЦС
    coupleBirthday1: '', //РАЦС
    coupleBirthday2: '', //РАЦС
    // (дату надання довідки про місце проживання)
    dateResidence: '', //РАЦС
    placeResidence: '', //РАЦС
    eventDate: '', //МВС
    eventTime: '', //МВС
    eventPlace: '', //МВС
    inn: '', //ПФУ і ДПСУ
    propertyAddress: '', //ВПО
    request: request,
  };
  const [formData, setFormData] = useState(initialFormData);

  const resetFormData = () => {
    setFormData(initialFormData);
  };

  const handleDocuSign = async userRequest => {
    const res = await fetch('/api/signnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signerEmail: userRequest?.request?.userEmail || userRequest?.userEmail,
        signerName: userRequest?.request?.name || userRequest?.name,
        secondSignerEmail: userRequest?.request?.secondUserEmail || '', // ← обов'язково передати
        secondSignerName: userRequest?.request?.secondUserName || '', // ← обов'язково передати
        ccEmail: lawyerData?.email || 'info.ggs.ua@gmail.com',
        doc2File:
          userRequest?.request?.pdfAgreement || userRequest?.pdfAgreement,
        doc3File: userRequest?.request?.pdfContract || userRequest?.pdfContract,
        doc4File:
          userRequest?.request?.pdfLawyersRequest ||
          userRequest?.pdfLawyersRequest,
        doc5File: userRequest?.request?.pdfOrder || userRequest?.pdfOrder,
      }),
    });

    const data = await res.json();
    console.log('SignNow response:', data);

    if (res.ok) {
      setMessage(
        `SignNow: Envelope sent successfully! Request ID: ${
          data.result?.request_id || '✓'
        }`
      );
      return data.result?.request_id || '';
    } else {
      setMessage(`SignNow Error: ${data.error || 'Unknown error'}`);
    }
  };

  const handleSendEmail = async (formData, status) => {
    try {
      const response = await fetch('/api/pdf/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          status,
          userEmail: formData.email,
          recipient: {
            // address: '',
            // name: 'відповідного держоргану',
            address: formData.recipient.address,
            name: formData.recipient.name,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text(); // Отримуємо деталі помилки
        throw new Error(`Помилка сервера: ${errorText}`);
      }

      const data = await response.json();
      if (response.ok) {
        console.log('Email успішно відправлено:', data.message);
      } else {
        console.error('Помилка:', data.error);
      }
    } catch (err) {
      console.error('Помилка під час відправки запиту:', err);
    }
  };

  return {
    formData,
    setFormData,
    handleSendEmail,
    handleDocuSign,
    request,
    resetFormData,
  };
};
