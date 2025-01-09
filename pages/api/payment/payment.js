import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: "Authorization code not provided" });
  }

//   const clientId = process.env.NEXT_PUBLIC_SIGNUP_INTEGRATION;
//   const redirectUri = process.env.NEXT_PUBLIC_SIGNUP_redirect_uri;
//   const authUrl = "https://account.docusign.com/oauth/token";

  
  const tokenResponse = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
    //   grant_type: "authorization_code",
    //   code,
    //   redirect_uri: redirectUri,
    //   client_id: clientId,

    // version: 3,
    // public_key: publicKey,
    // action: "pay",
    // amount: amount,
    // currency: currency,
    // description: description,
    // order_id: orderId,

    }),
  });

  const data = await tokenResponse.json();

  if (data.error) {
    return res.status(500).json({ message: data.error_description });
  }

  return res
    .status(200)
    .json({ accessToken: data.access_token, expiresIn: data.expires_in });
}
