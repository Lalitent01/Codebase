import { Metadata } from 'next';
import CreatorProfileClient from './CreatorProfileClient';

type Props = {
  params: Promise<{ username: string }>;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://suroor.cc';

// 1. Dynamic SEO & OpenGraph Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  const rawBase = process.env.BACKEND_URL 
    ? `${process.env.BACKEND_URL}/api` 
    : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api');
  
  const cleanBase = rawBase.replace(/\/$/, '');
  const url = cleanBase.endsWith('/api') 
    ? `${cleanBase}/characters/creator/${username}` 
    : `${cleanBase}/api/characters/creator/${username}`;

  try {
    const res = await fetch(url, { next: { revalidate: 120 } });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const creator = data.creator;

    const title = `@${creator.username} — Indian AI Characters & Roleplay | Suroor`;
    const description = creator.bio 
      ? `${creator.bio.slice(0, 150)}... Explore AI characters created by @${creator.username} on Suroor.`
      : `Explore custom Indian AI companions created by @${creator.username} in Hinglish, Hindi, and English on Suroor.`;
    const image = creator.avatar || `${siteUrl}/og-image.png`;

    return {
      title,
      description,
      alternates: {
        canonical: `${siteUrl}/creator/${username}`,
      },
      openGraph: {
        title: `@${creator.username} | Suroor Creator Profile`,
        description,
        url: `${siteUrl}/creator/${username}`,
        siteName: 'Suroor AI',
        images: [{ url: image, width: 800, height: 800, alt: `@${creator.username}` }],
      },
      twitter: {
        card: 'summary',
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: `@${username} — AI Creator Profile | Suroor AI`,
      description: `Explore custom AI companions created by @${username} on Suroor.`,
    };
  }
}

// 2. Page Entry Point with JSON-LD Profile Schema
export default async function Page({ params }: Props) {
  const { username } = await params;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: username,
      alternateName: `@${username}`,
      url: `${siteUrl}/creator/${username}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CreatorProfileClient username={username} />
    </>
  );
}