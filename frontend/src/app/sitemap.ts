import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://suroor.cc';
  const apiBase = process.env.BACKEND_URL 
    ? `${process.env.BACKEND_URL}/api` 
    : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api');

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  try {
    // Fetch all public characters dynamically for SEO crawling
    const res = await fetch(`${apiBase.replace(/\/$/, '')}/characters?limit=100`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    const characters = data?.characters || [];

    const characterPages: MetadataRoute.Sitemap = characters.map((char: any) => ({
      url: `${siteUrl}/character/${char.id}`,
      lastModified: char.updatedAt ? new Date(char.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));

    return [...staticPages, ...characterPages];
  } catch (error) {
    console.error('Sitemap generation fetch failed:', error);
    return staticPages;
  }
}