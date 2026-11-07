'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch {
      // Intentionally show sent screen to mitigate account enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030708] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0a1013] p-8 rounded-3xl border border-white/[0.08] shadow-2xl">
        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <p className="text-slate-400 text-sm mb-6">
          Enter your registered email and we&apos;ll send you a password recovery link.
        </p>
        
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
                Email Address
              </label>
              <input 
                type="email" 
                placeholder="you@example.com" 
                required
                autoComplete="email"
                value={email}
                className="w-full bg-black/60 border border-white/10 p-3.5 rounded-xl outline-none focus:border-[#7be4d5] transition-all text-sm text-white placeholder-slate-500"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#7be4d5] hover:bg-[#6bd6c7] text-black py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs disabled:opacity-50 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              {loading ? 'Sending...' : 'Send Recovery Link'}
            </button>
          </form>
        ) : (
          <div className="bg-[#7be4d5]/10 p-5 rounded-2xl border border-[#7be4d5]/20 text-center space-y-2">
            <p className="text-white font-semibold text-sm">Check your inbox</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              If an account exists with <span className="text-[#7be4d5]">{email}</span>, a password reset link has been dispatched.
            </p>
          </div>
        )}

        <Link 
          href="/auth/login" 
          className="flex items-center justify-center gap-2 text-center mt-6 text-xs text-slate-400 hover:text-white transition font-medium"
        >
          <ArrowLeft size={14} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}