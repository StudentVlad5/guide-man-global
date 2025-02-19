const docusign = require("docusign-esign");
import axios from "axios";
import { Buffer } from "buffer";

const jwtConfig = {
  dsJWTClientId: process.env.DS_JWT_CLIENT_ID,
  impersonatedUserGuid: process.env.DS_IMPERSONATED_USER_GUID,
  dsOauthServer: process.env.DS_OAUTH_SERVER,
};

const privateKey = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAmEQFa1OkHlGZaOc74h4ChxSehGTcqWQnPBGikAgzceN0meq3\nv0syOQ8nlzuOTAMSVd9nZDYHDdwcuog9vKgyI5dICBAY2VeVIlGJbTeQlx6Qok0n\nZF3jVjt8j+b+EZLRNwMXQufKQ51hFhOAeT1aRs/alPpCtH7BlMhvCcMlMGUYYHwe\nzfzJvwLO+X/kOoFWdkCWOb6/FubwVZJC9dQQ3yM2ubx9qnv4EPZOS6rxydYMwo/Y\nmWmljcrCCzeLXLf+YhcXXTIQiSyU8mkac6FwJLZr43fHwrj8rsGQnrxj5TPLwlng\ns9fSN0hfiY5r/Z/639QdxH6fJVNZnnqE1zcyCQIDAQABAoIBAAu+ggfUrt29ynja\nY6Ey/QaWiGF1dsWZRCNwcsWW3wJDmnHoC4h1etKxgLVmnQ5E1bcKNlXMNaq+gE1s\n27d/kO/I0n/4tIny+j2S5L19TH7eFybFj6prSXEUa9ec5+91ZQNQDuJqBreaCGvP\npkLzq1EMkB3vLZJGt+n2CbEgPEU+sG2oLj3Qcz2tw+1kpPm+8hjQ1pkKjs/x6o8j\n+jsyz0XZi4k8xARYVTLT2EEWM3ZrLH5HcuUSORSb7kea3Ojnb5Nzt+W1TYAx/c/0\nnzKMkToAGf9n4n/nQkBlexYUXA+mwqGuQxDiVkA31BN7wiqA8B7/969ISk/PzHJK\n9xEpMD8CgYEAz9wMC9Fao+y2L/T2xGxdrm7UpiAswNkuaV7dCUI6U88ElLr/SOa0\nIweLhYzLRYSnKmM58GO8YLf8jkR/qX5stlegHqx1FoF/6TI/3W16A35ZAK+TjXAk\nTkfacf2aLc5gUgZbPa6h6pTWq+O7mLAFxLV0XYCYRXh1Cm3nu1ER538CgYEAu4fT\nUUEwIrEeSvkyMOUX/aFklyHCJYyyq0o15yaAq8BWm/q5DqhUlGojPplbVgqwrrEl\ne2YUIyPDieu/yDhfkMoBK9qErt10RPHdGExM3LS/jRvgAyF1lgi3qHj3fm81vteG\ngPaA06CMpYtYRC9jOwWpIC6QFLWDvDs66Lb2ancCgYAm4L+YDkZn1sSU37qwLpyv\nHafEkswMHhMiPk4Vhz+loVj4AKnzFsOmsaiVCCqVDCTANuMFZYI8jO0+Ju3B5BWt\nXWJjmlokJYCpO27amblyodU/3Zc5ozoHMkVXgNmvq6Q0c1/pf5plaAVnDSdvfaz2\niAIF4yGYDNnHY5suXBF/PQKBgQCcsJ2xq90zb3iXPmZgklscUgkBenSE+W2kT6qA\nTByA5YG4bKLJi364T4LJYEv/tYjxPhTKaX1z6wMML44cFnZLPW4DHV912JW4sbqB\n/ebPFrtihSMEmqVsSjZir0hkPTnUDrNU+CKmMOSzwZ1rw4iPHWi1+hHrK8s5sOfE\n4HM+ewKBgQC4/BMEUUHEI5G+39xe1sFHebNlhdBpueL/jDCPjbPRyKy4EOX+bjGu\n6ZkiGUFq/5P5yMoNfQhm1qRzha9vtpbQ76BGKlPlSepLlhh85r9m4+1u0HmerwGr\n/VC7GVBBeHeaea12sKRs10+dQvJslSyoIGxwgRiOmBO3DuL6mocjhg==\n-----END RSA PRIVATE KEY-----".replace(
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
  const doc4Base64 = await downloadFileAsBase64(envelopeArgs.doc4File);

  const signHereTab = [
    {
      documentId: "1",
      recipientId: "1",
      tabLabel: "Sign Here",
      anchorString: "S1",
      anchorXOffset: "0",
      anchorYOffset: "0",
    },
    {
      documentId: "2",
      recipientId: "1",
      tabLabel: "Sign Here",
      anchorString: "S2",
      anchorXOffset: "0",
      anchorYOffset: "0",
    },
  ];

  const dateSignedTab = [
    {
      documentId: "1",
      recipientId: "1",
      tabLabel: "Date Signed",
      anchorString: "D1",
      anchorXOffset: "0",
      anchorYOffset: "0",
    },
    {
      documentId: "2",
      recipientId: "1",
      tabLabel: "Date Signed",
      anchorString: "D2",
      anchorXOffset: "0",
      anchorYOffset: "0",
    },
  ];

  const signHereTab2 = [
    {
      documentId: "3",
      recipientId: "2",
      tabLabel: "Sign Here",
      anchorString: "S3",
      anchorXOffset: "0",
      anchorYOffset: "0",
    },
    {
      documentId: "2",
      recipientId: "2",
      tabLabel: "Sign Here",
      anchorString: "S4",
      anchorXOffset: "0",
      anchorYOffset: "0",
    },
  ];

  const dateSignedTab2 = [
    {
      documentId: "3",
      recipientId: "2",
      tabLabel: "Date Signed",
      anchorString: "D3",
      anchorXOffset: "0",
      anchorYOffset: "0",
    },
    {
      documentId: "2",
      recipientId: "2",
      tabLabel: "Date Signed",
      anchorString: "D4",
      anchorXOffset: "0",
      anchorYOffset: "0",
    },
  ];

  const envelopeDefinition = {
    emailSubject: "Please sign this document",
    documents: [
      {
        documentBase64: doc2Base64,
        name: "Contract",
        fileExtension: "pdf",
        documentId: "1",
      },
      {
        documentBase64: doc3Base64,
        name: "Agreement",
        fileExtension: "pdf",
        documentId: "2",
      },
      {
        documentBase64: doc4Base64,
        name: "Lawyer`s Request",
        fileExtension: "pdf",
        documentId: "3",
      },
    ],
    recipients: {
      signers: [
        {
          email: envelopeArgs.signerEmail,
          name: envelopeArgs.signerName,
          recipientId: "1",
          routingOrder: "1",
          tabs: {
            signHereTabs: signHereTab,
            dateSignedTabs: dateSignedTab,
          },
        },
        {
          email: "julia.j.shcherban@gmail.com",
          name: "Julia Golban",
          recipientId: "2",
          routingOrder: "2",
          tabs: {
            signHereTabs: signHereTab2,
            dateSignedTabs: dateSignedTab2,
          },
        },
      ],
      carbonCopies: [
        {
          email: envelopeArgs.ccEmail,
          name: envelopeArgs.ccName,
          recipientId: "3",
          routingOrder: "3",
        },
      ],
    },
    status: envelopeArgs.status,
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
      doc4File,
    } = req.body;

    if (
      !signerEmail ||
      !signerName ||
      !ccEmail ||
      !ccName ||
      !doc2File ||
      !doc3File ||
      !doc4File
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
      doc4File,
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
