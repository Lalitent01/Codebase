// frontend/src/app/creator/[username]/page.tsx
import { Metadata } from 'next';
import CreatorProfileClient from './CreatorProfileClient';

type Props = {
  params: Promise<{ username: string }>;
};

// 1. THIS HANDLES SEO (GOOGLE VISIBILITY)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  
  return {
    title: `${username}'s AI Portfolio | Suroor`,
    description: `Explore unique AI characters created by @${username}. Join the conversation on Suroor.`,
    openGraph: {
      title: `${username} on Suroor`,
      description: `View the AI character collection of @${username}`,
    }
  };
}

// 2. ENTRY POINT
export default async function Page({ params }: Props) {
  const { username } = await params;

  return (
    // Pass the username to the client-side UI
    <CreatorProfileClient username={username} />
  );
}