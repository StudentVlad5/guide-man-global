const docusign = require("docusign-esign");
import axios from "axios";
import { Buffer } from "buffer";

const jwtConfig = {
  dsJWTClientId: process.env.DS_JWT_CLIENT_ID,
  impersonatedUserGuid: process.env.DS_IMPERSONATED_USER_GUID,
  dsOauthServer: process.env.DS_OAUTH_SERVER,
};

const privateKey = "-----BEGIN RSA PRIVATE KEY-----\nMIIEogIBAAKCAQEArI9+QFmOqtW5sooSPbTJwG0gmSugmpUtROslPppQ6zC2zDxG\njuJv+wkkCCQJM8lNZ9yySiUbhLPa6KEy540TzLM736PxzRwqc8yz9iPFR84vecgI\n5oBoUaYJQUrPSN0+uPWR1KMlrKEDLfkK6diD2CvD+xtqXLIh9vei8/NJbUP8xbEE\n61mTHWK2rN3bNL4viYceP70wSUda0MddxSs2zYaGeyZZ2Q71IyURwbQgNHsPIrl3\nHQb+PI6TLuL8Y+PtZ6tYk/pv5nOzxTg+QADO7+cFX3SiCkdIgSLy8XhGdj2QFhGa\ndTqizmb3OYpwV9KpTd/Fem/LlyKayDpSQmRT0QIDAQABAoIBAACH/Y3BqNKGT2jJ\nC4bUmmVlAJtwGrG3IVlLtwTjETo0H2/wBJCWil01uT5sK/oUldAqygK37AaDzjn2\nmxNC6CtyZs4IsWsd+dR67hflIsuWiydfEgXxocCUmAUzL4GsKrADk4QZz3khUsLu\nuBWhtMAy3ErW2gQ4iSm7N+1z04dKU70Ak9yCDK2VO65a9VOjy3wJRv5FFVzuVC1t\nWSXnUzWsx06UTg7T3cF4rVWD6BkF4BOvk4B8E1kx0qN0hnZ62nlkq20U2xNhsmvB\n9+e14t/hb2ErfSuzvJTRzdmOWMus2hjLb09X0LS4GdpUsjxrI5ql3HlbUmMLxlsL\nQ2U5EIUCgYEA6ZSrVBQLmfPl8jbRmD5sMH77108uXJmIB7dUS43RxgY27C1QysK5\nbaDM7vIBctA7t7lw0Ar5JllfQrQmzIi53NdTMgFzM+/HlIgg1eA2rqE0Icd8zJ6I\nPxLssBdHD69SN8BuxA3XKT1m/GSB80yhEuPVhzaML6yQY+RIroMAeEUCgYEAvR99\nxk2+CNrtrnXe/Bi+VEWIYnp0Au9EGqA8uvoowvCQqCADEKnwi9bPqMDM3RCIz4/K\nefKM8d/LmbkFQKmX4e+ldyVc2A3NC/IMu5PDChSSM7fbfFsNCBce44uWmMV2lBqX\nmhiO31oMQpyBRB1vGbK6dxbI+GVy7xxCSqAJJB0CgYAE+4zkEEFnGVLQZeb2rm40\nYqEQqLm+c+/46io8KlxNMxi81QKiMKEv+3wjpLnvLw33D1eeuH00Gjfz/k/NkSUV\n1uoJaQqCEx1Yx8abiVrhQsMP7Wd2HfOeFNNDtltntD+2vL4gJINwd8TYoXQ8MmhF\nNOL7LWi0I6Q43UfHoTfDWQKBgEWAESSS5UczzSzTvEJAhZFKjDhEb+W0L/7o6+h6\njgg1h7OBMB8rlG6PXnjRgXer39sHKI1wCUPJznSLfdapfFtXSiNi45+yUqwVI4C7\naG2H6cJ/ynUEsOFMPdm5Lnqt9kmvDA9g/wAtg1vnT8nMV0vGVqf1A53lCju80s/B\nyBoxAoGALnIJN8v7GF+ihGSbQ1pl9z0e2S1zyunrOlmvgy8D0dM+CMQm8PR5trEP\nXXakd15duwINQDf3zMlj1kNKluVg5rb3Bss73OqHISQDHAEea0hVuoJ+Pqur5cP7\n+eE6NV2uiEGmG/qDh7NS+Vw18bV3WOIy+E0xhBRK7PLyNJWYvas=\n-----END RSA PRIVATE KEY-----".replace(
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
          email: "vlad_np@ukr.net",
          name: "VVVVVVVVVVV",
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
