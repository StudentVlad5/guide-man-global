// import LiqPay from "liqpay";
const LiqPay = require("liqpay");


export default async function handler(req, res) {
  try {
    console.log("Received request:", req.body); 

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { amount, currency, description, order_id } = req.body;

    const LIQPAY_PUBLIC_KEY = process.env.LIQPAY_PUBLIC_KEY;
    const LIQPAY_PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY;

    if (!LIQPAY_PUBLIC_KEY || !LIQPAY_PRIVATE_KEY) {
      console.error("LiqPay keys are missing");
      return res.status(500).json({ error: "LiqPay keys are missing" });
    }

    const liqpay = new LiqPay(LIQPAY_PUBLIC_KEY, LIQPAY_PRIVATE_KEY);

    if (!amount || !currency || !description || !order_id) {
      console.error("Invalid request body:", req.body);
      return res.status(400).json({ error: "Invalid request body" });
    }

    const paymentData = liqpay.cnb_object({
      action: "pay",
      amount,
      currency,
      description,
      order_id,
      version: "3",
    });

    console.log("Generated payment data:", paymentData); 

    return res.status(200).json({
      data: paymentData.data,
      signature: paymentData.signature,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
// export default function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const { amount, currency, description, order_id } = req.body;

//   if (!amount || !currency || !description || !order_id) {
//     return res.status(400).json({ error: 'Missing required fields' });
//   }

//   return res.status(200).json({
//     data: "liqpay-data",
//     signature: "liqpay-signature",
//   });
// }
