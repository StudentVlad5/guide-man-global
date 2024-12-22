import PropTypes from 'prop-types';

import styles from '../styles/servisesButton.module.scss';

export const ServisesButton = ({ Img, title, onClick }) => {
  return (
    <label className={styles.servisesButton__label}>
      <button className={styles.servisesButton__body} onClick={onClick}>
        <div className={styles.servisesButton__icon}>
          <Img alt="icon" className={styles.servisesButton__img} />
        </div>
        <p>{title}</p> 
      </button>
    </label>
  );
};

ServisesButton.propTypes = {
  img: PropTypes.string,
  title: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};