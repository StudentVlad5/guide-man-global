import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { PageNavigation } from "../../components/PageNavigation";

import { ServisesDropdown } from "../../components/ServisesDropdown";
import { ServisesButton } from "../../components/ServisesButton";
import { getRightData, getRightURL } from "../../helpers/rightData";

import requestsDescription from "../../data/requestsDescription.json";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Layout } from "../../components/Layout";

import Menu from "../../public/menu.svg";
import Doc from "../../public/doc.svg";

import styles from "../../styles/servicesPage.module.scss";
import stylesDesc from "../../styles/itemPage.module.scss";
import { getCollection } from "../../helpers/firebaseControl";

import { BASE_URL } from "../sitemap.xml";

export default function LawyersRequests({ requests }) {
  // console.log('LawyersRequests ~ requests:', requests);
  const { t } = useTranslation();
  const { locale, pathname } = useRouter();

  const civilRegistryOffices = requests
    .filter(
      (request) =>
        request.requestType[locale] === t("requests.civilRegistryOffices")
    )
    .map((request) => [getRightData(request, locale, "title"), request.path]);

  const ministryOfInternalAffairs = requests
    .filter(
      (request) =>
        request.requestType[locale] === t("requests.ministryOfInternalAffairs")
    )
    .map((request) => [getRightData(request, locale, "title"), request.path]);

  const internallyDisplacedPersons = requests
    .filter(
      (request) =>
        request.requestType[locale] === t("requests.internallyDisplacedPersons")
    )
    .map((request) => [getRightData(request, locale, "title"), request.path]);

  const pensionFund = requests
    .filter(
      (request) => request.requestType[locale] === t("requests.pensionFund")
    )
    .map((request) => [getRightData(request, locale, "title"), request.path]);

  const ministryOfDefense = requests
    .filter(
      (request) =>
        request.requestType[locale] === t("requests.ministryOfDefense")
    )
    .map((request) => [getRightData(request, locale, "title"), request.path]);

  const stateMigrationService = requests
    .filter(
      (request) =>
        request.requestType[locale] === t("requests.stateMigrationService")
    )
    .map((request) => [getRightData(request, locale, "title"), request.path]);

  const [isAllButtons, setIsAllButtons] = useState(false);
  const [filter, setFilter] = useState(t("requests.allRequests"));

  const openAllButtons = () => {
    setIsAllButtons(!isAllButtons);
  };

  useEffect(() => {
    setFilter(t("requests.allRequests"));
  }, [t]);

  const uploadData = async () => {
    const response = await fetch("/api/upload-json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: "tck.json",
        collectionName: "tck",
        // fileName: 'dataRequests.json',
        // collectionName: 'requests',
      }),
    });

    const data = await response.json();
    console.log(response);

    if (response.ok) {
      console.log(data.message);
    } else {
      console.error(data.error);
    }
  };

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleText = () => {
    setIsExpanded(!isExpanded);
  };

  // useEffect(() => {
  //   uploadData();
  // }, []);

  return (
    <Layout
      type="requests page"
      desctiption={`⭐${t("navbar.services")}⭐ ${t("head.home.description")}`}
      h1={t("navbar.services")}
      script={`[
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
                    "name": "${t("navbar.services")}"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "item":
                  {
                    "@id": "${getRightURL(locale, pathname)}",
                    "name": "${t("navbar.requests")}"
                  }
                }
              ]
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              ${requests.map((el) => {
                return `{
              "@type": "Question",
              "name": "${el.requestType[locale]}: ${getRightData(
                  el,
                  locale,
                  "title"
                )}",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "${
                  getRightData(el, locale, "text").slice(0, 250) + "..."
                }"
              }
            }`;
              })}
             ]
          }
        ]`}
    >
      <div className="container">
        <PageNavigation />
      </div>

      <div className="page page-bigBottom">
        <div className="container">
          <div>
            <div className={stylesDesc.ItemPage}>
              <h1 className={`page__title ${stylesDesc.itemPage__title}`}>
                {getRightData(requestsDescription, locale, "title")}
              </h1>
              <article
                className={stylesDesc.itemPage__text}
                style={{
                  maxHeight: isExpanded ? "none" : "100px",
                  overflow: "hidden",
                }}
                dangerouslySetInnerHTML={{
                  __html: getRightData(requestsDescription, locale, "text"),
                }}
              />
              <button
                onClick={toggleText}
                className={stylesDesc.showMoreButton}
              >
                {isExpanded ? t("Show less") : t("Show more")}
              </button>
            </div>
          </div>

          <div className={styles.servisesPage__content}>
            <div className={styles.servisesPage__section}>
              <ServisesButton
                Img={Menu}
                title={filter}
                onClick={openAllButtons}
              />
            </div>

            <div className={styles.servisesPage__section}>
              <ServisesDropdown
                Img={Doc}
                title={t("requests.civilRegistryOffices")}
                values={civilRegistryOffices}
              />

              <ServisesDropdown
                Img={Doc}
                title={t("requests.ministryOfInternalAffairs")}
                values={ministryOfInternalAffairs}
              />

              <ServisesDropdown
                Img={Doc}
                title={t("requests.internallyDisplacedPersons")}
                values={internallyDisplacedPersons}
              />

              <ServisesDropdown
                Img={Doc}
                title={t("requests.pensionFund")}
                values={pensionFund}
              />
            </div>

            <div className={styles.servisesPage__section}>
              <ServisesDropdown
                Img={Doc}
                title={t("requests.ministryOfDefense")}
                values={ministryOfDefense}
              />

              <ServisesDropdown
                Img={Doc}
                title={t("requests.stateMigrationService")}
                values={stateMigrationService}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getStaticProps({ locale }) {
  const requests = await getCollection("requests");
  return {
    props: { requests, ...(await serverSideTranslations(locale, ["common"])) },
    revalidate: 10,
  };
}
