import crypto from "crypto";

export default function handler(req, res) {
  if (req.method === "POST") {
    const { data, signature } = req.body;

    const privateKey = process.env.LIQPAY_PRIVATE_KEY; 
    const generatedSignature = crypto
      .createHash("sha1")
      .update(privateKey + data + privateKey)
      .digest("base64");

    if (signature === generatedSignature) {
      const paymentData = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
      console.log("Payment callback data:", paymentData);

      res.status(200).json({ message: "Callback received" });
    } else {
      res.status(400).json({ message: "Invalid signature" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
