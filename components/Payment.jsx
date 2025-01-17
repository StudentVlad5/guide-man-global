import React, { useEffect, useState } from "react";
import styles from "../styles/lawyersRequestForm.module.scss";
import { useRouter } from "next/router";
// import { useTranslation } from "react-i18next";

export const Payment = ({ request, currentLanguage }) => {
  // console.log("Request:", request, "Current Language:", currentLanguage);
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const title = request[currentLanguage]?.title;
  
  // const { t } = useTranslation();
  useEffect(() => {
    const initializePayment = async () => {
      try {
        const returnUrl = `${window.location.origin}${router.asPath}`;
        console.log(returnUrl);

        const response = await fetch("/api/liqpay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: "0.1",
            currency: "UAH",
            description: title || "Payment",
            currentLanguage: currentLanguage,
            returnUrl,
            order_id: `order_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
          }),
        });
        const data = await response.json();

        if (response.ok) {
          setFormData(data);
        } else {
          setError(data.error);
          console.error("Error response:", data.error);
        }
      } catch (error) {
        setError("Failed to initialize payment");
        console.error("Failed to fetch payment data:", error);
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, [title, currentLanguage, router.asPath]);

  if (loading) {
    return <div>Loading payment form...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (!formData) {
    return <div>Unable to initialize payment</div>;
  }

  return (
    <div>
      <form
        method="POST"
        action="https://www.liqpay.ua/api/3/checkout"
        acceptCharset="utf-8"
        // target="_blank"
      >
        <input type="hidden" name="data" value={formData.data} />
        <input type="hidden" name="signature" value={formData.signature} />
        <button type="submit" className={styles.orderForm__form_button}>
          Pay
        </button>

        {/* {currentLanguage === "en" ? (
          <input
            type="image"
            src="//static.liqpay.ua/buttons/payEn.png"
            alt="Pay with LiqPay"
          />
        ) : (
          <input
            type="image"
            src="//static.liqpay.ua/buttons/payUk.png"
            alt="Pay with LiqPay"
          />
        )} */}
      </form>
    </div>
  );
};
