import { useEffect, useState } from 'react';
import styles from '../styles/buttonUp.module.scss';
import { clsx } from 'clsx';

export const ButtonUp = () => {
  const [scroll, setScroll] = useState(0);

  const handleScroll = () => {
    setScroll(window.scrollY);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
  };

  return (
    <button 
      onClick={handleClick} 
      className={clsx(
        [styles.button],
        {[styles.hide]: scroll < 300}
      )}>
      ↑
    </button>
  )
}