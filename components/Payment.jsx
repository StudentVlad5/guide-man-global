import React, { useState } from "react";

export const Payment = ({ request, currentLanguage }) => {
  // console.log("Request:", request, "Current Language:", currentLanguage);

  // const languageData = request[currentLanguage];
  //  <h2>{languageData?.title}</h2>

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
  
    try {
      const response = await fetch("/api/liqpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          currency: "UAH",
          description: "Test Payment",
          order_id: "order123",
        }),
      });
  
      const data = await response.json();
      if (response.ok) {
        console.log("Payment response:", data);
      } else {
        console.error("Error response:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Payment Page</h1>
      <div>
        <label>
          Сума оплати:
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <button onClick={handlePayment} disabled={loading || !amount}>
          {loading ? "Завантаження..." : "Оплатити"}
        </button>
      </div>

      {formData && (
        <form
          action="https://www.liqpay.ua/api/3/checkout"
          method="POST"
          target="_blank"
        >
          <input type="hidden" name="data" value={formData.data} />
          <input type="hidden" name="signature" value={formData.signature} />
          <button type="submit">Підтвердити оплату</button>
        </form>
      )}
    </div>
  );
};
