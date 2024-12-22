import { useRouter } from 'next/router';
import Link from 'next/link'

import { clsx } from 'clsx';

import styles from '../styles/navbar.module.scss';

export const PageNavLink = ({href, text}) => {
  const { pathname } = useRouter();

    return (
      <Link 
        href={href}
        className={clsx(
          [styles.navbar__link], { [styles.navbar__link__active]: href === pathname || href === `/${pathname.split('/')[1]}`  },
        )}
      >
        {text}
      </Link>
    );
};
