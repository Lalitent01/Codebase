'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!token) {
    return (
      <div className="min-h-screen bg-[#030708] text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#0a1013] p-8 rounded-3xl border border-white/[0.08]">
          <h1 className="text-xl font-bold mb-2">Invalid or Expired Link</h1>
          <p className="text-slate-400 text-sm mb-6">This password reset link is missing a valid token.</p>
          <Link href="/auth/forgot-password" className="text-[#7be4d5] hover:underline text-sm font-semibold">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    try {
      await api.post('/auth/reset-password', { token, pass: password });
      alert('Password successfully updated! Please sign in with your new password.');
      router.push('/auth/login');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Password reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030708] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0a1013] p-8 rounded-3xl border border-white/[0.08] shadow-2xl">
        <h1 className="text-2xl font-bold mb-2">Set New Password</h1>
        <p className="text-slate-400 text-sm mb-6">Enter your new secure password below.</p>
        
        {errorMsg && (
          <div className="p-3 mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <input 
            type="password" 
            placeholder="New Password (min 6 characters)" 
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            className="w-full bg-black/60 border border-white/10 p-3.5 rounded-xl outline-none focus:border-[#7be4d5] transition-all text-sm text-white placeholder-slate-500"
            onChange={(e) => setPassword(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Confirm New Password" 
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            className="w-full bg-black/60 border border-white/10 p-3.5 rounded-xl outline-none focus:border-[#7be4d5] transition-all text-sm text-white placeholder-slate-500"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#7be4d5] hover:bg-[#6bd6c7] text-black py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 transition"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-[#030708] min-h-screen" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}