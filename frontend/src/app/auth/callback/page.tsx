'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { fetchUser, setAuth } = useAuthStore();

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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
      <h2 className="text-2xl font-bold mb-2">Syncing your account...</h2>
      <p className="text-slate-500 text-sm">Please wait while we set up your profile.</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen" />}>
      <CallbackHandler />
    </Suspense>
  );
}