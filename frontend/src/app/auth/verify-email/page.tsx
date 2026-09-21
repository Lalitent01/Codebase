'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');

    // Immediate check so we never get stuck on an infinite loading spinner
    if (!token) {
      setStatus('error');
      return;
    }

    api.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      {status === 'loading' && (
        <>
          <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold">Verifying Neural Link...</h1>
          <p className="text-slate-500 text-sm mt-2">Authenticating your access token...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle2 className="text-green-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold">Verification Complete!</h1>
          <p className="text-slate-400 mt-2 mb-8">Your account is now fully verified and activated.</p>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-bold transition"
          >
            Go to Dashboard
          </button>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold">Verification Failed</h1>
          <p className="text-slate-400 mt-2 mb-8">The verification link is missing, invalid, or has already expired.</p>
          <Link href="/auth/login" className="text-blue-500 hover:underline font-bold text-sm">
            Back to Login
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen" />}>
      <VerifyContent />
    </Suspense>
  );
}