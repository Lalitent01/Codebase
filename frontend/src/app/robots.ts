import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://suroor.cc';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/explore',
          '/pricing',
          '/contact',
          '/terms',
          '/privacy',
          '/refund-policy',
          '/character/',
          '/creator/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/chat/',
          '/chats/',
          '/persona/',
          '/profile/',
          '/auth/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}