import { useState, useContext } from "react";
import { AppContext } from "../components/AppProvider";
import { getCollectionWhereKeyValue } from "../helpers/firebaseControl";

export const useLawyerRequest = (request) => {
  const { user } = useContext(AppContext);
  const [paymentStatus, setPaymentStatus] = useState("");
  // const [userRequest, setUserRequest] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState();

  const [formData, setFormData] = useState({
    id: Math.floor(Date.now() * Math.random()).toString(),
    uid: user?.uid || "",
    paymentStatus: paymentStatus,
    orderId: orderId,
    citizenship: "", //ВСІ ФОРМИ
    name: "", //АДПСУ, РАЦС, МОУ і ТЦК, МВС, ПФУ і ДПСУ, ВПО
    surname: "", //АДПСУ, РАЦС, МОУ і ТЦК, МВС, ПФУ і ДПСУ, ВПО
    fatherName: "", //АДПСУ, РАЦС, МОУ і ТЦК, МВС, ПФУ і ДПСУ, ВПО
    email: "", //ВСІ ФОРМИ
    birthday: "", //АДПСУ, РАЦС, МОУ і ТЦК, МВС
    residence: {
      address: "",
      city: "",
      country: "",
    }, //РАЦС
    requesterBirthday: "", //РАЦС
    requesterName: "", //РАЦС
    requesterFile: [], //РАЦС
    //дані про смерть
    deadName: "", //РАЦС
    deadDeathDay: "", //РАЦС
    deadBirthday: "", //РАЦС
    deadRelationship: "", //РАЦС
    dateCreating: new Date() //ВСІ ФОРМИ
      .toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    recipient: {
      name: "", //МОУ і ТЦК
      address: "", //МОУ і ТЦК
    },
    servicemanPIB: "", //МОУ і ТЦК
    rank: "", //МОУ і ТЦК
    unit: "", //МОУ і ТЦК
    date: { start: "", end: "" }, //АДПСУ, МОУ і ТЦК
    // ПАСПОРТИ
    abroadPassnum: "", //АДПСУ
    passport: "", //АДПСУ, ЗАМІСТЬ passportNum
    pmjNum: "", //АДПСУ,
    // Подружжя (дані супругів)
    couplePIB1: "", //РАЦС
    couplePIB2: "", //РАЦС
    coupleBirthday1: "", //РАЦС
    coupleBirthday2: "", //РАЦС
    // (дату надання довідки про місце проживання)
    dateResidence: "", //РАЦС
    placeResidence: "", //РАЦС
    eventDate: "", //МВС
    eventTime: "", //МВС
    eventPlace: "", //МВС
    inn: "", //ПФУ і ДПСУ
    propertyAddress: "", //ВПО
    request: request,
  });

  const handleDocuSign = async (order_id) => {
    let userRequest = null; // Use null for clearer checks
    try {
      if (order_id) {
       await getCollectionWhereKeyValue("userRequests", "orderId", order_id).then(
          (res) => {
            if (res) {
              console.log("res", res);
              userRequest = res[0];
            }
          }
        );
      }
      console.log("userRequest", userRequest);
      if (userRequest) {
        const { userEmail, name, pdfAgreement, pdfContract } =
          userRequest || {};
        console.log(userEmail && name && pdfAgreement && pdfContract);
        if (userEmail && name && pdfAgreement && pdfContract) {
          const res = await fetch("/api/docusign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              signerEmail: userEmail,
              signerName: name,
              ccEmail: "julia.j.shcherban@gmail.com",
              ccName: "julia.j.shcherban",
              doc2File: pdfAgreement,
              doc3File: pdfContract,
            }),
          });

          // Check if the response is ok and handle it
          const data = await res.json();
          console.log("setMessage", data);

          if (res.ok) {
            setMessage(
              `Envelope sent successfully! Envelope ID: ${data.envelopeId}`
            );
          } else {
            // Handle errors more gracefully
            setMessage(`Error: ${data.error || "Unknown error"}`);
          }
        } else {
          setMessage("Missing necessary data in the user request.");
        }
      } else {
        setMessage("No matching user request found.");
      }
    } catch (error) {
      console.error("Error during DocuSign request:", error);
      setMessage("An error occurred while processing the request.");
    }
  };

  const handleSendEmail = async (requestId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pdf/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          //   id: formData.id,
          id: requestId,
          // recipient: formData.recipient,
          // // recipient: { address: formData.recipient.address },
          recipient: { address: "julia_js@bigmir.net" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text(); // Отримуємо деталі помилки
        throw new Error(`Помилка сервера: ${errorText}`);
      }

      const data = await response.json();
      if (response.ok) {
        console.log("Email успішно відправлено:", data.message);
      } else {
        console.error("Помилка:", data.error);
      }
    } catch (err) {
      console.error("Помилка під час відправки запиту:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return { formData, setFormData, handleSendEmail, handleDocuSign, request };
};
