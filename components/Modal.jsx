import PropTypes from 'prop-types';
import Image from 'next/image';
import styles from '../styles/modal.module.scss';

export const Modal = ({ title, message, handleModal, form }) => {
  return (
    <>
      <div className={styles.modal}>
        <div className={styles.modal__window}>
          <div className={styles.modal__title}>
            <div className={styles.modal__between} />
            <p>{title}</p>
            <button className={styles.modal__close} onClick={handleModal}>
              <Image
                src={'/cross__white.svg'}
                alt="cross"
                className={styles.modal__icon}
                width={20}
                height={20}
              />
            </button>
          </div>

          <div className={styles.modal__body}>
            {message}
            {form}
          </div>
        </div>
      </div>
      <div className={styles.modal__shadow} />
    </>
  );
};

Modal.propType = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  handleModal: PropTypes.func.isRequired,
};
