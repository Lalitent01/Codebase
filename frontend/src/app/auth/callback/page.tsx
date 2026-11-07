'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      router.push(`/auth/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token) {
      localStorage.setItem('token', token);

      fetchUser()
        .then(() => {
          router.push('/dashboard');
        })
        .catch(() => {
          router.push('/auth/login?error=Session+sync+failed.+Please+login+again.');
        });
    } else {
      router.push('/auth/login');
    }
  }, [searchParams, router, fetchUser]);

  return (
    <div className="min-h-screen bg-[#030708] flex flex-col items-center justify-center text-white p-6">
      <Loader2 className="w-12 h-12 text-[#7be4d5] animate-spin mb-4" />
      <h2 className="text-2xl font-bold mb-2">Completing your sign in...</h2>
      <p className="text-slate-400 text-sm">Setting up your private workspace. Just a moment.</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="bg-[#030708] min-h-screen" />}>
      <CallbackHandler />
    </Suspense>
  );
}