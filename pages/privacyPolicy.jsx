import React from "react";
import { PrivacyPolicy } from "../components/PrivacyPolicy";
import { Layout } from "../components/Layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";

export default function privacyPolicy() {
  const { t } = useTranslation("common");
  return (
    <Layout type="service page" h1={t("Privacy & Policy")}>
      <div className="container">
        <PrivacyPolicy />
      </div>
    </Layout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
