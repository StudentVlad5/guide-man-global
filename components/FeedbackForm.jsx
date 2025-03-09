import React, { useState } from "react";
import Cross from "../public/cross.svg";
import s from "../styles/feedbackForm.module.scss";
import { useTranslation } from "react-i18next";
export const FeedbackForm = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={s.feedbackDiv}>
      <button onClick={toggleModal} className={s.feedbackDiv__button}>
        ?
      </button>

      {isOpen && (
        <div className={s.modal} onClick={toggleModal}>
          <div
            className={s.modal__content}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={toggleModal} className={s.modal__close}>
              <Cross />
            </button>

            <h2 className={s.modal__titel}>{t("Feedback")}</h2>

            <p className={s.modal__text}>
              {t(
                "The answer to the question will be provided during business hours."
              )}
            </p>

            <p className={s.modal__text}>
              <strong>{t("Business hours")}:</strong> <br />{" "}
              {t("Monday - Friday")} <br /> 9:00 - 18:00
            </p>

            <p className={s.modal__text} style={{ marginBottom: 20 }}>
              {t(
                "If your question concerns an already submitted request, please provide your"
              )}
              <strong> {t("full name")} </strong> {t("and")}{" "}
              <strong>{t("order number")}</strong>{" "}
              {t("(you will find it in the request history)")}.
            </p>

            <a
              className={s.modal__questionLink}
              href="https://t.me/GGS_DP"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("Ask a question")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
