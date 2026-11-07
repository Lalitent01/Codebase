import { Metadata } from 'next';
import CharacterDetailClient from './CharacterDetailClient';

type Props = {
  params: Promise<{ id: string }>;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://suroor.cc';

// 1. Dynamic Search Engine & Social Media Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const rawBase = process.env.BACKEND_URL 
    ? `${process.env.BACKEND_URL}/api` 
    : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api');
  
  const cleanBase = rawBase.replace(/\/$/, '');
  const url = cleanBase.endsWith('/api') ? `${cleanBase}/characters/${id}` : `${cleanBase}/api/characters/${id}`;

  try {
    const res = await fetch(url, { 
      next: { revalidate: 60 } 
    });

    if (!res.ok) throw new Error('Failed to fetch character for metadata');
    const char = await res.json();

    const title = `${char.name} — Indian AI Roleplay & Hinglish Chat | Suroor`;
    const description = char.description 
      ? `${char.description.slice(0, 155)}... Chat with ${char.name} in Hinglish and Hindi on Suroor.`
      : `Chat with ${char.name} on Suroor. Free Indian AI roleplay in Hinglish, Hindi, and English.`;

    const imageUrl = char.avatar || `${siteUrl}/og-image.png`;

    return {
      title,
      description,
      keywords: [
        char.name,
        `${char.name} AI`,
        'Indian AI Chat',
        'Hinglish Roleplay',
        char.language === 'HINGLISH' ? 'Hinglish Chatbot' : 'Hindi AI Chat',
        ...(char.tags || []),
      ],
      alternates: {
        canonical: `${siteUrl}/character/${id}`,
      },
      openGraph: {
        title: `${char.name} | Suroor AI Companion`,
        description,
        url: `${siteUrl}/character/${id}`,
        siteName: 'Suroor AI',
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 800,
            alt: `${char.name} Avatar`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return { 
      title: 'Indian AI Character Profile | Suroor',
      description: 'Discover and chat with authentic Indian AI characters in Hinglish, Hindi, and English on Suroor.',
    };
  }
}

// 2. Page Entry Point
export default async function Page({ params }: Props) {
  const { id } = await params;
  return <CharacterDetailClient id={id} />;
}