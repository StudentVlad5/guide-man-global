import { NextApiRequest, NextApiResponse } from "next";
const docusign = require("docusign-esign");
import fs from "fs";
import path from "path";

const jwtConfig = {
  dsJWTClientId: process.env.DS_JWT_CLIENT_ID,
  impersonatedUserGuid: process.env.DS_IMPERSONATED_USER_GUID,
  privateKeyLocation: "./private.key",
  dsOauthServer: process.env.DS_OAUTH_SERVER,
};

const privateKey = process.env.DS_PRIVATE_KEY.replace(/\\n/g, '\n');
const privateKeyBuffer = Buffer.from(privateKey, 'utf8');


const demoDocsPath = path.resolve(
  __dirname,
  "../../../../public/demo_documents"
);
const doc2File = "World_Wide_Corp_Battle_Plan_Trafalgar.docx";
const doc3File = "World_Wide_Corp_lorem.pdf";

const SCOPES = ["signature", "impersonation"];

async function authenticate() {
  const jwtLifeSec = 10 * 60; // requested lifetime for the JWT is 10 min
  const dsApi = new docusign.ApiClient();
  dsApi.setOAuthBasePath(jwtConfig.dsOauthServer.replace("https://", "")); // it should be domain only.
  let rsaKey = privateKeyBuffer;
 
  try {
    const results = await dsApi.requestJWTUserToken(
      jwtConfig.dsJWTClientId,
      jwtConfig.impersonatedUserGuid,
      SCOPES,
      rsaKey,
      jwtLifeSec
    );
    const accessToken = results.body.access_token;

    // get user info
    const userInfoResults = await dsApi.getUserInfo(accessToken);

    // use the default account
    let userInfo = userInfoResults.accounts.find(
      (account) => account.isDefault === "true"
    );

    return {
      accessToken: results.body.access_token,
      apiAccountId: userInfo.accountId,
      basePath: `${userInfo.baseUri}/restapi`,
    };
  } catch (e) {
    console.log(e);
    let body = e?.response?.body || e?.response?.data;
    // Handle the error, like consent requirement
    if (body?.error === "consent_required") {
      throw new Error("Consent required");
    }
    throw new Error(`API error: ${JSON.stringify(body, null, 4)}`);
  }
}

async function sendEnvelope(args) {
  // Your logic to send the envelope via DocuSign goes here
  // This is where you integrate `signingViaEmail.sendEnvelope`
  const { envelopeArgs, accessToken, basePath, apiAccountId } = args;

  const envelopeDefinition = {
    emailSubject: "Please sign this document",
    documents: [
      {
        documentBase64: fs.readFileSync(envelopeArgs.doc2File, {
          encoding: "base64",
        }),
        name: "Battle Plan",
        fileExtension: "docx",
        documentId: "1",
      },
      {
        documentBase64: fs.readFileSync(envelopeArgs.doc3File, {
          encoding: "base64",
        }),
        name: "Lorem Ipsum",
        fileExtension: "pdf",
        documentId: "2",
      },
    ],
    recipients: {
      signers: [
        {
          email: envelopeArgs.signerEmail,
          name: envelopeArgs.signerName,
          recipientId: "1",
          routingOrder: "1",
        },
      ],
      carbonCopies: [
        {
          email: envelopeArgs.ccEmail,
          name: envelopeArgs.ccName,
          recipientId: "2",
          routingOrder: "2",
        },
      ],
    },
    status: envelopeArgs.status, // 'sent' to send the envelope
  };

  const dsApi = new docusign.ApiClient();
  dsApi.setBasePath(basePath);
  dsApi.addDefaultHeader("Authorization", `Bearer ${accessToken}`);

  const envelopesApi = new docusign.EnvelopesApi(dsApi);
  const results = await envelopesApi.createEnvelope(apiAccountId, {
    envelopeDefinition,
  });
  return results.envelopeId;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Extract the required parameters from the request body
    const { signerEmail, signerName, ccEmail, ccName } = req.body;

    if (!signerEmail || !signerName || !ccEmail || !ccName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Authenticate with DocuSign
    const accountInfo = await authenticate();

    const envelopeArgs = {
      signerEmail,
      signerName,
      ccEmail,
      ccName,
      status: "sent",
      doc2File: path.resolve(demoDocsPath, doc2File),
      doc3File: path.resolve(demoDocsPath, doc3File),
    };

    const args = {
      accessToken: accountInfo.accessToken,
      basePath: accountInfo.basePath,
      apiAccountId: accountInfo.apiAccountId,
      envelopeArgs,
    };

    const envelopeId = await sendEnvelope(args);
    res.status(200).json({ envelopeId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
