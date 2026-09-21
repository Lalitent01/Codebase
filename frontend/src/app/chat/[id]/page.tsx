import { Metadata } from 'next';
import ChatClient from './ChatClient';

type Props = {
  params: Promise<{ id: string }>;
};

// 1. Fetch character data for browser tab title & SEO metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // Use internal backend URL on server if available, otherwise public API URL
  const rawBase = process.env.BACKEND_URL 
    ? `${process.env.BACKEND_URL}/api` 
    : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api');

  const cleanBase = rawBase.replace(/\/$/, '');
  const url = cleanBase.endsWith('/api') ? `${cleanBase}/characters/${id}` : `${cleanBase}/api/characters/${id}`;

  try {
    const res = await fetch(url, { 
      next: { revalidate: 60 } 
    });

    if (!res.ok) throw new Error('Failed to fetch character');
    const char = await res.json();

    return {
      title: `Chat with ${char.name} | Suroor`,
      description: `Ongoing conversation with ${char.name}.`,
    };
  } catch {
    return { title: 'Neural Link Active | Suroor' };
  }
}

// 2. Page Entry Point
export default async function Page({ params }: Props) {
  const { id } = await params;

  return <ChatClient id={id} />;
}