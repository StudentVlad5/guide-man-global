import { useTranslation } from "next-i18next";
import { ItemPage } from "../../components/ItemPage";
import { PageNavigation } from "../../components/PageNavigation";
import { getCollectionWhereKeyValue } from "../../helpers/firebaseControl";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getRightData, getRightURL } from "../../helpers/rightData";
import { useRouter } from "next/router";
import { Layout } from "../../components/Layout";

import { BASE_URL } from "../sitemap.xml";
import ErrorPage from "../404";
import { useContext, useState } from "react";
import { AppContext } from "../../components/AppProvider";

const startCredentials = {
  userName: "",
  userSurname: "",
  userBirdthDay: "",
  userCitizenship: "",
  userPhoneNumber: "",
  userCountry: "",
  userCity: "",
  userAddress_1: "",
  userAddress_2: "",
  userINN: "",
  userPassport: "",
};

const fieldInput = {
  userName: "Name",
  userSurname: "Surname",
  userBirdthDay: "BirdthDay",
  userCitizenship: "Citizenship",
  userPhoneNumber: "PhoneNumber",
  userCountry: "Country",
  userCity: "City",
  userAddress_1: "Address 1",
  userAddress_2: "Address 2",
  userINN: "INN",
  userPassport: "Passport",
};

export default function ProfileItemPage() {
  const { t } = useTranslation();
  const { locale, pathname } = useRouter();
  const { user, setUser } = useContext(AppContext);
  const [userCredentials, setUserCredentials] = useState(startCredentials);

  return user ? (
    <Layout
      type="service page"
      desctiption={`⭐${t("navbar.account")}⭐ ${t("head.home.description")}`}
      h1={t("navbar.account")}
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
                    "name": "${t("navbar.account")}"
                  }
                },
              ]
          }`}
    >
      <div className="container">
        <PageNavigation title={t("navbar.account")} />
      </div>
      <div className="page page-bigBottom">
        <div className="container">
          <ul className="flexWrap">
            {Object.keys(userCredentials).map((it) => {
              return (
                <li key={it}>
                  <span>{fieldInput[it]}:</span>
                  <input
                    type="text"
                    value={userCredentials[it]}
                    onChange={(e) =>
                      setUserCredentials({
                        ...userCredentials,
                        [it]: e.currentTarget.value,
                      })
                    }
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Layout>
  ) : (
    <ErrorPage />
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
