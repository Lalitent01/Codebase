import { Metadata } from 'next';
import CharacterDetailClient from './CharacterDetailClient';

type Props = {
  params: Promise<{ id: string }>;
};

// 1. SEO & OpenGraph metadata generation on the server
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // Prefer internal backend URL for faster server-to-server fetch in Docker/Cloud
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

    return {
      title: `Chat with ${char.name} - AI Roleplay | Suroor`,
      description: char.description || 'AI Character Roleplay Companion',
      openGraph: {
        title: `Neural Link: ${char.name}`,
        description: char.description || 'AI Character Roleplay Companion',
        images: char.avatar ? [{ url: char.avatar }] : [],
      },
    };
  } catch {
    return { 
      title: 'Character Profile | Suroor',
      description: 'Interact with AI personalities on Suroor.',
    };
  }
}

// 2. Page Entry Point
export default async function Page({ params }: Props) {
  const { id } = await params;

  return (
    <CharacterDetailClient id={id} />
  );
}