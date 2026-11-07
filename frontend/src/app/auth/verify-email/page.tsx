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

    if (!token) {
      setStatus('error');
      return;
    }

    api.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#030708] text-white flex flex-col items-center justify-center p-6 text-center">
      {status === 'loading' && (
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin text-[#7be4d5] mb-4" size={48} />
          <h1 className="text-2xl font-bold">Verifying your email...</h1>
          <p className="text-slate-400 text-sm mt-2">Confirming your account details, please wait.</p>
        </div>
      )}
      {status === 'success' && (
        <div className="flex flex-col items-center max-w-sm">
          <CheckCircle2 className="text-emerald-400 mb-4" size={56} />
          <h1 className="text-2xl font-bold">Email Verified!</h1>
          <p className="text-slate-400 text-sm mt-2 mb-8">
            Your account is confirmed. You now have full access to character creation and features.
          </p>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="w-full bg-[#7be4d5] text-black hover:bg-[#6bd6c7] px-8 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition"
          >
            Go to Dashboard
          </button>
        </div>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-center max-w-sm">
          <XCircle className="text-rose-400 mb-4" size={56} />
          <h1 className="text-2xl font-bold">Verification Failed</h1>
          <p className="text-slate-400 text-sm mt-2 mb-8">
            The verification link is invalid, incomplete, or has already expired.
          </p>
          <Link 
            href="/auth/login" 
            className="text-[#7be4d5] hover:underline font-semibold text-sm"
          >
            Back to Sign In
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="bg-[#030708] min-h-screen" />}>
      <VerifyContent />
    </Suspense>
  );
}