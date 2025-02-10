const docusign = require("docusign-esign");
import axios from "axios";
import { Buffer } from "buffer";

const jwtConfig = {
  dsJWTClientId: process.env.DS_JWT_CLIENT_ID,
  impersonatedUserGuid: process.env.DS_IMPERSONATED_USER_GUID,
  dsOauthServer: process.env.DS_OAUTH_SERVER,
};

const privateKey = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAgMi3M14Sbjgj0Co6B55yn23kJeP9fKUr0GJZe+fF4+NQ0R1c\noBG0wXtQZvlgYSnIW8Cj0oNKji/QRaHDzi6FubOAhYnzIeR6uXFGc9Uu1WoSmZWb\n95NTCRCAPfuVVuZpyOnTNHjRSbdUkzSeiLfemD4u50lPvV9qEbZXCtabv5xZvqxE\ndzIdw4dUoP8+LUzJTY0tTRrcrubPLuFti99bgO3gVjpnLg89LdALeSQF/YUoCN2C\nsQwuLoE7C67aGSY41pIRVTh89R77keDUM8f7PIUMHO5GfaoygXyr0GlDZJhob9Va\nU7DYwHljkWgj9rTAKgAdVVpXXpiNMxHN52iXCQIDAQABAoIBAAKRCCD4ho6r75TH\nXqgxDBuUHahJUqTbCCmV6C7MDUQlJILCXnVHMmO/u3gN5LyS+q36GRm0fvYgoE/e\n8S9zpbvFcXHX2wtUHxkBLP8DzYmNx13zCWxwmHFKuE+Olb4+scwsqBujLm0/v3+p\nMbag+XPtxf1bLJZmJ3o/uMeGbuIC6k21FSBY43pD5+6y16kmYjd1dH1Uy3wAmShe\n4j2Qj9kUSIBj4MpojOsLrHLILh0Dc9GUMC4tn7FRDvJgQipwmAu4bfssd85JAVhN\nh0MNlZBxZI5VZ1PYxsvCXLsfzN3GtKLmYhhs1kvXA/AM71sbpDPErOwFpQk6b0nd\n4apR1AECgYEAy5+q92bKvKbppWtbWKMlevS5FL18zgLOgtFhyIbaFJRJkW8zT7yo\nAPTHhf2nl8nlHipl4OTmkC7+H9sDenNce3ryN84SMOGsf36v4p4XtfJ82h48e/d1\n1UZvPHBYIIX+iKQW6uX7KXQM+fDUw2+slxyIuGyve6axkQaGCjFsbgECgYEAoej2\nY9SzZgwPWGx7/O5isHZkSOK7xaJs6KdBCBgnUUj3sWC0orsNCoyUQim+JUg96+ga\nWQYWtp/1haJYY72/c8LsoNAfbLXXqd0V8pCr61Ex1JYd8D0sBbUAoZq7XoFzlqo9\nSN6KZ95jA+dTey0ERwbLIhCXLlO7kQOYraMauQkCgYBmdaxgmv+u18o/q3qmakmE\nyjmLPyHaw7zIRLWQYpK/wjIWlT7bg5GCEamIOa+oCDZa7HihJm0B5jOHMfxZFE1X\n8PCKtg2fPR9AdC3quSQzMJY0ZvyGYGmRbMSyQ9GEZAhFF1RU1G6CWFvjNJTK1pmg\n3AHL0xyl+qXk1MSDwoTOAQKBgBZwji153j9Hbp0HtAtzEpR4ZB/B5NpYT5XTEG1J\nw7E9Vq7rwz1GhWEv6KBe3q6WG5blfTlXYbB/7OxPesagFre5jUggcCqF7VTqgk8z\nA9DCWRComY+hOseztVmwc0V+1YFNKN8/kJkitkBlQCmzLIOXinG3MOzHyBgqEnAG\nSf7ZAoGBAMV1D+8PMIEJZr0zG0JJuuvM8lErJ/M0zma0QZiGy4NnJK0TS2xAiKuJ\nZ4TBvnIGTUwxCrL4vqTt4Guq7w6PkGdAFD9FjVagpYa52rxMoqHBSCxGlzQ5scb5\nuSz/e8nXMStRUM5/Tcsg3D9Fw0Xd4Z6k3b5CcKrF9eM6qifQ0Ikm\n-----END RSA PRIVATE KEY-----".replace(
  /\\n/g,
  "\n"
);
const privateKeyBuffer = Buffer.from(privateKey, "utf8");

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

async function downloadFileAsBase64(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const fileBuffer = Buffer.from(response.data, "binary");
    return fileBuffer.toString("base64");
  } catch (error) {
    console.error("Error downloading file:", error);
    throw new Error("Failed to download file");
  }
}

async function sendEnvelope(args) {
  const { envelopeArgs, accessToken, basePath, apiAccountId } = args;

  // Download the files and encode them to base64
  const doc2Base64 = await downloadFileAsBase64(envelopeArgs.doc2File);
  const doc3Base64 = await downloadFileAsBase64(envelopeArgs.doc3File);

  const signHereTab = {
    documentId: "1", // documentId 1 corresponds to doc2 (the Word doc)
    recipientId: "1", // This corresponds to the signer (recipientId 1)
    tabLabel: "Sign Here",
    anchorString: "/sn1/", // Position it with an anchor text (optional, can use absolute position)
    anchorYOffset: "10", // Y offset from anchor text (optional)
    anchorXOffset: "10", // X offset from anchor text (optional)
  };

  // Define other tabs if needed (e.g., date fields, initial fields, etc.)
  const dateSignedTab = {
    documentId: "1", // documentId 1 corresponds to doc2 (the Word doc)
    recipientId: "1", // This corresponds to the signer (recipientId 1)
    tabLabel: "Date Signed",
    anchorString: "/ds1/", // Anchor to a specific text in the document
    anchorYOffset: "20", // Y offset (optional)
    anchorXOffset: "20", // X offset (optional)
    type: "DateSigned",
  };

  const envelopeDefinition = {
    emailSubject: "Please sign this document",
    documents: [
      {
        documentBase64: doc2Base64,
        name: "Contract",
        fileExtension: "pdf",
        documentId: "1", // Document ID should match the ID used in tabs
      },
      {
        documentBase64: doc3Base64,
        name: "Agreement",
        fileExtension: "pdf",
        documentId: "2", // Document ID for second document
      },
    ],
    recipients: {
      signers: [
        {
          email: envelopeArgs.signerEmail,
          name: envelopeArgs.signerName,
          recipientId: "1", // Signer's recipient ID
          routingOrder: "1",
          tabs: {
            signHereTabs: [signHereTab],
            dateSignedTabs: [dateSignedTab], // Add date signed tab if needed
          },
        },
        {
          email: "julia.j.shcherban@gmail.com",
          name: "Julia Golban",
          recipientId: "2", // Signer's recipient ID
          routingOrder: "2",
          tabs: {
            signHereTabs: [signHereTab],
            dateSignedTabs: [dateSignedTab], // Add date signed tab if needed
          },
        },
      ],
      carbonCopies: [
        {
          email: envelopeArgs.ccEmail,
          name: envelopeArgs.ccName,
          recipientId: "3", // CC's recipient ID
          routingOrder: "3",
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
    const {
      signerEmail,
      signerName,
      ccEmail,
      ccName,
      doc2File,
      doc3File,
    } = req.body;

    if (
      !signerEmail ||
      !signerName ||
      !ccEmail ||
      !ccName | !doc2File | !doc3File
    ) {
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
      doc2File,
      doc3File,
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
