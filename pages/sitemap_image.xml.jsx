import { getCollection, getFieldsOfPosts } from '../helpers/firebaseControl';
import { BASE_URL } from './sitemap.xml';
import {format} from 'date-fns';

const Sitemap_image = () => {
    return null;
};

export const getServerSideProps = async ({ res }) => { 

  const newsImages =  await getFieldsOfPosts('news', 'image');
  const questionsImages =  await getFieldsOfPosts('questions', 'image');
  const explanationsImages =  await getFieldsOfPosts('explanations', 'image');
  const servicesImages =  await getFieldsOfPosts('services', 'image');
  const citizenshipImages =  await getFieldsOfPosts('citizenship', 'image');

  const paths = [
    ...newsImages, 
    ...questionsImages,
    ...explanationsImages,
    ...servicesImages,
    ...citizenshipImages,
  ];


    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">   
      ${paths.filter(el => el.length > 0).map(el => {
        return (
           `<url> 
      
        <image:image>     
           <image:loc>${el.split('').map(el => {
            if (el === '&') {
              el = '&amp;'
            };
            return el;
           }).join('')}</image:loc>  
       </image:image>   
        
     </url>` 
        )
      
      }).join('')} 
    </urlset>   
    `


    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemap);
    res.end();

    return {
      props: {},
    }
}

export default Sitemap_image;
  