import crypto from "crypto";

const paymentStatuses = new Map();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { data, signature } = req.body;
    const privateKey = process.env.NEXT_PUBLIC_LIQPAY_PRIVATE_KEY;

    const generatedSignature = crypto
      .createHash("sha1")
      .update(privateKey + data + privateKey)
      .digest("base64");

    if (signature !== generatedSignature) {
      console.error("Invalid signature in callback");
      return res.status(400).json({ message: "Invalid signature" });
    }

    const paymentData = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    
    const paymentStatus = {
      status: paymentData.status,
      amount: paymentData.amount,
      currency: paymentData.currency,
      orderId: paymentData.order_id,
      timestamp: new Date().toISOString()
    };
    
    paymentStatuses.set(paymentData.order_id, paymentStatus);
    console.log("Stored payment status:", paymentStatus);

    return res.status(200).json({ message: "Callback processed successfully" });
  } catch (error) {
    console.error("Error processing callback:", error);
    return res.status(500).json({ message: "Error processing callback" });
  }
}

export const getPaymentStatus = (orderId) => paymentStatuses.get(orderId);