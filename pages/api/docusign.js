const docusign = require("docusign-esign");
import axios from "axios";
import { Buffer } from "buffer";

const jwtConfig = {
  dsJWTClientId: process.env.DS_JWT_CLIENT_ID,
  impersonatedUserGuid: process.env.DS_IMPERSONATED_USER_GUID,
  dsOauthServer: process.env.DS_OAUTH_SERVER,
};

const privateKey = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAhSd0+P7lGp5TUobVelLQxlsYEKv3PbA+xTc6J5//KnVrnSC+\nMhUH4wSVKnsqtgDmWMcOdZFbusvmFs2OtWSuIQc12E+NtPzEhZI/xRo2GVRAKe0G\nUpYQKppWf4cWylNCGpo2DxGYWpOToudLy336bWMZAd7KXjOYEA53ygQXAqqKzQjw\n4eV8cQVTw+C2fijF0dudux1R03+pq3qSJjOkz4GQat4GBSpDIUqVR2rDbQR2Xdb7\ne92gOZNxvp+ROv51fm3FadqfqXg/97tYd3iGyazD/fYwLyootObxx6ghF0vWOLdO\nms9TzorV937jUPqBc1rVpv20YqdO/6LMURqWcQIDAQABAoIBAADfnE4+2SYRIvxK\nsKSmXZgThGdQQtAHiN3hKciVQtwBMa/HRXV4Ja6uUBkw03v7/7GA5XN4J4555HGY\nBHHkWMUUMkelO/Qo5/7KpxBGBqlTYBQLqeve7/kLkqTbBWyrL6bo2zvC597ePXdx\n23wuAHd5ETKt3AzSpf0i+dOxg6zLiwFox1oR5/nFFGIZ9igW0gul1W7eHGgcCyye\nzjXZjjknBCt3c/l7fnl7HA8W/l15gAgRirKhNgVZhdHexqktTfxqkQs33b8FCKtc\nB12I4LITlfPhZRJclnHPev6X4KUGLSRKkr55tIcVbx37vDPDVovOzciNexhd/WW1\n2zMVslECgYEAzFo33y9PvZAjm/EVRnnM7SKnNYjytUJtcTrEQ5DEbWyUQeGguU5M\nKbNM6qTBsUaRJoRpUClW0FmPBS2SZIZQv66VI+ErNmCTGmGvymXS7pHHqF5NUNC2\nhwHjRDTd7BBvIxJ8C07yVLBtivzFs3MrBct2tCFE00YSf7QHBnmRfXkCgYEAps6l\ni0MtwqTnx7Gj7wTrExvAGC9DHEL+5bjTMEV74EZzPkUvJI8W5H91FUDsYps93Ydo\nvzfI97wqCTAVJTDz4MCUuOKasMJAr6YBMuzU2LRgv6UCqtC8S140kpWxzOEOuCF9\nFxqRt9ZViz1OCrNcE5xeccwHMbBnfwlcaNX1urkCgYEAsFhufKgMTQ6U3B54eJ/l\nSwIrf1RV9juDzEGlWpUUHUWkzxGRLDg4G4hCKP7Ss1OtMKr1Ypq58wRGGnbQLPWH\nu1JCG3tVWhCPASYpmCS0mPGudUojuEjUKr9jStnAZNVtwrtR1kRjdNfnQBiP1yLc\njpydLCbFiPigQBmwMlM4TSkCgYBXkklqkTwm4bglKGduBmD7SShSCg3remijZaLJ\nxtC/73x1BpE3Wj+keh2XqNvw8JtL/9jH+ptxI8HVzP5s5gRCzBfH8H9RqMmY7UfX\n2mnr0tawBgsebjNMRgrHofsUGltF457uUC6MGuQSE38zMvJ2ATO7/mcQeRH8qYdw\nKlO1UQKBgBMPoX4M/iUcAMQVBO8kv8MVErbMGIc8qR39OpDd4IUXdIu3pKJzOwL7\nYYBP3uZIkXalqbxBm1zVHJC7bFWdu7Z5YqrWOttooxttcYure/eA5Nm40VMSlXgx\nVyS51yRktAAICjcmgfsIXOO1c4tY/DiYc1nc0HqVFYAITuEdeA+h\n-----END RSA PRIVATE KEY-----".replace(
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
