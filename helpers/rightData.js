import { BASE_URL } from '../pages/sitemap.xml';

export const getRightData = (item, language, key) => {
  switch (language) {
  case 'en': 
    return item?.en[key];
  
  case 'ru': 
    return item?.ru[key];
  
  case 'ua': 
    return item?.ua[key];
  
  default: 
    return;
  }
};

export const getRightURL = (locale, pathname) => {
  switch (locale) {
    case 'ru':
      return `${BASE_URL}/ru${pathname}`;
      
    case 'en':
      return `${BASE_URL}/en${pathname}`;

    default: 
      return `${BASE_URL}${pathname}`;
  }
}