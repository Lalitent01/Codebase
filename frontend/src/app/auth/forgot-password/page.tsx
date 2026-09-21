'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      // Show sent screen even on error to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 p-8 rounded-3xl border border-white/5">
        <h1 className="text-2xl font-bold mb-2">Forgot Password?</h1>
        <p className="text-slate-500 text-sm mb-8">Enter your email and we&apos;ll send you a recovery link.</p>
        
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="email" 
              placeholder="Email Address" 
              required
              value={email}
              className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm"
              onChange={(e) => setEmail(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={14} />}
              {loading ? 'Sending...' : 'Send Recovery Link'}
            </button>
          </form>
        ) : (
          <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20 text-center">
            <p className="text-blue-400 font-medium text-sm">
              Check your inbox. If an account exists with that email, a recovery link has been sent.
            </p>
          </div>
        )}
        <Link href="/auth/login" className="block text-center mt-6 text-sm text-slate-500 hover:text-white transition">
          Back to Login
        </Link>
      </div>
    </div>
  );
}