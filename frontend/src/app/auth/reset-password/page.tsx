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
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 p-8 rounded-3xl border border-white/5">
          <h1 className="text-xl font-bold mb-2">Invalid Reset Link</h1>
          <p className="text-slate-500 text-sm mb-6">This password reset link is missing a valid token.</p>
          <Link href="/auth/forgot-password" className="text-blue-500 hover:underline text-sm font-bold">
            Request a new link
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
      alert('Password successfully updated! Please log in.');
      router.push('/auth/login');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 p-8 rounded-3xl border border-white/5">
        <h1 className="text-2xl font-bold mb-2">Set New Password</h1>
        <p className="text-slate-500 text-sm mb-6">Enter your new secure password below.</p>
        
        {errorMsg && (
          <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <input 
            type="password" 
            placeholder="New Password" 
            required
            minLength={6}
            value={password}
            className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm"
            onChange={(e) => setPassword(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Confirm Password" 
            required
            minLength={6}
            value={confirmPassword}
            className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={14} />}
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}