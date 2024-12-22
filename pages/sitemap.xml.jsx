import {format} from 'date-fns';
export const BASE_URL = 'https://global-guide.vercel.app';

const Sitemap = () => {
    return null;
};

export const getServerSideProps = async ({ res }) => { 

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
        <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <sitemap>
            <loc>${`${BASE_URL}/sitemap_UA.xml`}</loc>
            <lastmod>${format(new Date(), 'yyyy-MM-dd')}</lastmod>
          </sitemap>
          <sitemap>
            <loc>${`${BASE_URL}/sitemap_RU.xml`}</loc>
            <lastmod>${format(new Date(), 'yyyy-MM-dd')}</lastmod>
          </sitemap>
          <sitemap>
            <loc>${`${BASE_URL}/sitemap_EN.xml`}</loc>
            <lastmod>${format(new Date(), 'yyyy-MM-dd')}</lastmod>
          </sitemap>
          <sitemap>
            <loc>${`${BASE_URL}/sitemap_image.xml`}</loc>
            <lastmod>${format(new Date(), 'yyyy-MM-dd')}</lastmod>
          </sitemap>
        </sitemapindex>`

    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemap);
    res.end();

    return {
      props: {},
    }
}

export default Sitemap;
  