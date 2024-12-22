import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Layout } from "../components/Layout";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

export default function ErrorPage () {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Layout>
        <div className="page">
        <div className="container container__404">
          <h1 className="page__title">404</h1>
          <h2 className="page__title-2">{t('errorPage.h2')}</h2>
            <p>{t('errorPage.p')}</p>
            <button 
              className="button"
              onClick={() => router.back()}
            >
              <p>{t('errorPage.button')}</p>
            </button>
        </div>
    </div>
    </Layout>
  );
};

export async function getStaticProps({ locale }) {

    return { props: { 
      ...await serverSideTranslations(locale, ['common'])
    } };
  }