import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/bookmarks', '/favorites', '/auth/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/bookmarks', '/favorites', '/auth/'],
      },
    ],
    sitemap: 'https://conference-view.vercel.app/sitemap.xml',
  };
}
