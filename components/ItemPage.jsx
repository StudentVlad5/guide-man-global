import Link from 'next/link';

import PropTypes from 'prop-types';

import { getRightData } from '../helpers/rightData';
import { useRouter } from 'next/router';
import Image from 'next/image';

import styles from '../styles/itemPage.module.scss'
import { ButtonUp } from './ButtonUp';

export const ItemPage = ({ item, buttonName, linkPath }) => {
  const { locale } = useRouter();

  return (
    <div className={styles.itemPage}>
      {item.image.length > 0 && (
        <div className={styles.itemPage__img}>
        <Image
          title={`Image for information article | image-${item[locale].title}`}
          src={item.image} 
          alt={`${item.type} - globalguide.com | image-${item[locale].title}`}
          width={1200}
          height={240}
        />
      </div>
      )}

      <div className={styles.itemPage__body}>
        <h1 className={`page__title ${styles.itemPage__title}`}>
          {item.type === "services" ? `${item.serviceType[locale]}: ${getRightData(item, locale, 'title')}`: getRightData(item, locale, 'title')}
        </h1>
        <article 
          className={styles.itemPage__text}
          dangerouslySetInnerHTML={{ __html:  getRightData(item, locale, 'text')}}
        />
        <button className="button-extension button-extension--down">
          <Link href={linkPath}>
            <p>{buttonName}</p>
          </Link>
        </button>
      </div>
      <ButtonUp />
    </div>
  );
};

ItemPage.propType = {
  item: PropTypes.object.isRequired, 
  buttonName: PropTypes.string,
  linkPath: PropTypes.string,
};