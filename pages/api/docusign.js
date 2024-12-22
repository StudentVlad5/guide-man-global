import axios from "axios";
import docusign from "docusign-esign";

const getAccessToken = async () => {
  const apiClient = new docusign.ApiClient();
  apiClient.setOAuthBasePath("account-d.docusign.com");

  const response = await apiClient.requestJWTUserToken(
    process.env.NEXT_PUBLIC_SIGNUP_CLIENT_ID,
    process.env.NEXT_PUBLIC_SIGNUP_USER_ID,
    ["signature"],
    process.env.NEXT_PUBLIC_SIGNUP_CLIENT_SECRET,
    3600
  );

  return response.body.access_token;
};

export default async function handler(req, res) {
  const token = getAccessToken();
  console.log("token", token);
    if (req.method === "POST") {
      try {
        const { email, name, fileUrl } = req.body;

        if (!fileUrl) {
          return res.status(400).json({ message: "Ссылка на файл не указана" });
        }

        // Скачивание файла по ссылке
        const response = await axios({
          url: fileUrl,
          method: "GET",
          responseType: "arraybuffer",
        });

        const fileBuffer = response.data;

        // Преобразование файла в Base64
        const documentBase64 = Buffer.from(fileBuffer).toString("base64");

        // Настройка DocuSign API
        const apiClient = new docusign.ApiClient();
        apiClient.setBasePath("https://demo.docusign.net/restapi");
        apiClient.addDefaultHeader(
          "Authorization",
          `Bearer ${token}`
        );

        const envelopesApi = new docusign.EnvelopesApi(apiClient);

        const document = new docusign.Document({
          documentBase64,
          name: "Документ для подписания",
          fileExtension: path.extname(fileUrl).replace(".", ""), // Извлечение расширения файла
          documentId: "1",
        });

        const signer = new docusign.Signer({
          email,
          name,
          recipientId: "1",
          routingOrder: "1",
        });

        const signHere = new docusign.SignHere({
          anchorString: "/sig/",
          anchorUnits: "pixels",
          anchorXOffset: "10",
          anchorYOffset: "20",
        });

        signer.tabs = new docusign.Tabs({ signHereTabs: [signHere] });

        const envelopeDefinition = new docusign.EnvelopeDefinition({
          emailSubject: "Пожалуйста, подпишите документ",
          documents: [document],
          recipients: new docusign.Recipients({ signers: [signer] }),
          status: "sent",
        });

        const results = await envelopesApi.createEnvelope(
          process.env.NEXT_PUBLIC_SIGNUP_CLIENT_ID,
          {
            envelopeDefinition,
          }
        );

        res.status(200).json({ envelopeId: results.envelopeId });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Ошибка при отправке документа", error });
      }
    } else {
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Метод ${req.method} не разрешен`);
    }
}
