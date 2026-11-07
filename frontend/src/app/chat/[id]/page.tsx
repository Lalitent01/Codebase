import { Metadata } from 'next';
import ChatClient from './ChatClient';

type Props = {
  params: Promise<{ id: string }>;
};

// 1. Dynamic Browser Tab Title & Search Crawler Rules
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

    if (!res.ok) throw new Error('Failed to fetch character');
    const char = await res.json();

    return {
      title: `Chat with ${char.name} | Suroor AI`,
      description: `Private conversation with ${char.name} in Hinglish, Hindi, and English.`,
      // Active chat sessions should NOT be indexed in Google search
      robots: {
        index: false,
        follow: false,
      },
    };
  } catch {
    return { 
      title: 'Private Chat | Suroor AI',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

// 2. Page Entry Point
export default async function Page({ params }: Props) {
  const { id } = await params;

  return <ChatClient id={id} />;
}