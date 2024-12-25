import { PageNavigation } from "../components/PageNavigation";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Layout } from "../components/Layout";
import { useTranslation } from "next-i18next";

import styles from "../styles/newsPage.module.scss";

import { BASE_URL } from "./sitemap.xml";
import { useRouter } from "next/router";
import { getRightURL } from "../helpers/rightData";
import UploadForm from "../components/UploadForm";

export default function DocusignPage({ news }) {
  const { t } = useTranslation();

  const { locale, pathname } = useRouter();

  return (
    <Layout
      type="docusign page"
      desctiption={`⭐${t("navbar.docusign")}⭐ ${t("head.home.description")}`}
      h1={t("navbar.docusign")}
      script={`
        {
            "@context": "http://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement":
              [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "item":
                  {
                    "@id": "${BASE_URL}",
                    "name": "${t("pageNavigation.main")}"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "item":
                  {
                    "@id": "${getRightURL(locale, pathname)}",
                    "name": "${t("navbar.docusign")}"
                  }
                }
              ]
          }`}
    >
      <div className="container">
        <PageNavigation />
      </div>

      <div className="page page-bigBottom">
        <div className="container">
          <div className={styles.docusign}>
            <UploadForm />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: { ...(await serverSideTranslations(locale, ["common"])) },
    revalidate: 10,
  };
}
