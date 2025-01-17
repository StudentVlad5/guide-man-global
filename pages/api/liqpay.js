import crypto from "crypto";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const {
      amount,
      currency,
      description,
      order_id,
      currentLanguage,
      returnUrl,
    } = req.body;

    if (!amount || !currency || !description || !order_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const LIQPAY_PUBLIC_KEY = process.env.NEXT_PUBLIC_LIQPAY_PUBLIC_KEY;
    const LIQPAY_PRIVATE_KEY = process.env.NEXT_PUBLIC_LIQPAY_PRIVATE_KEY;

    if (!LIQPAY_PUBLIC_KEY || !LIQPAY_PRIVATE_KEY) {
      return res.status(500).json({ error: "LiqPay keys are missing" });
    }
    const language = currentLanguage === "ua" ? "uk" : currentLanguage;

    const getLiqPayLanguage = (lang) => {
      switch (lang?.toLowerCase()) {
        case "uk":
        case "ru":
          return "uk";
        case "en":
          return "en";
        default:
          return "uk";
      }
    };

    const paymentData = {
      public_key: LIQPAY_PUBLIC_KEY,
      version: "3",
      action: "pay",
      amount: amount,
      currency: currency,
      description: description,
      order_id: order_id,
      result_url: returnUrl,
      language: getLiqPayLanguage(language),
    };

    const dataBase64 = Buffer.from(JSON.stringify(paymentData)).toString(
      "base64"
    );

    const signString = LIQPAY_PRIVATE_KEY + dataBase64 + LIQPAY_PRIVATE_KEY;
    const signature = crypto
      .createHash("sha1")
      .update(signString)
      .digest("base64");

    res.status(200).json({
      data: dataBase64,
      signature: signature,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
