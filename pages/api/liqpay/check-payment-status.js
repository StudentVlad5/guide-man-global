import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const publicKey = process.env.NEXT_PUBLIC_LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.NEXT_PUBLIC_LIQPAY_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return res.status(500).json({ error: "LiqPay keys are missing" });
  }

  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ error: "Missing order_id" });
  }

  try {
    const requestData = {
      action: "status",
      version: "3",
      public_key: publicKey,
      order_id: order_id,
    };

    const dataBase64 = Buffer.from(JSON.stringify(requestData)).toString(
      "base64"
    );

    const signString = privateKey + dataBase64 + privateKey;
    const signature = crypto
      .createHash("sha1")
      .update(signString)
      .digest("base64");

    const formData = new URLSearchParams();
    formData.append("data", dataBase64);
    formData.append("signature", signature);

    const response = await fetch("https://www.liqpay.ua/api/request", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
      order_id: order_id,
    });

    const responseData = await response.json();
    console.log("LiqPay status response:", responseData);

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error checking payment status:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
}