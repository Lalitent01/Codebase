'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/signup', { 
        email: email.trim().toLowerCase(), 
        password, 
        username: username.trim() 
      });
      setAuth(res.data.user, res.data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Signup failed. Please try again.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
    const apiUrl = rawApiUrl.replace(/\/$/, '');
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#030708] p-4 text-white">
      <div className="bg-[#0a1013] p-8 rounded-3xl shadow-2xl flex flex-col gap-4 w-full max-w-md border border-white/[0.08]">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-black tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-400 mt-1">Start chatting with Indian AI companions in Hinglish</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <input 
              type="text" 
              placeholder="e.g. arjun_sharma" 
              autoComplete="username"
              className="p-3.5 rounded-xl bg-black/60 text-white border border-white/10 focus:outline-none focus:border-[#7be4d5] transition text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)} 
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              autoComplete="email"
              className="p-3.5 rounded-xl bg-black/60 text-white border border-white/10 focus:outline-none focus:border-[#7be4d5] transition text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              placeholder="Min 6 characters" 
              minLength={6}
              autoComplete="new-password"
              className="p-3.5 rounded-xl bg-black/60 text-white border border-white/10 focus:outline-none focus:border-[#7be4d5] transition text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#7be4d5] text-black p-3.5 mt-2 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[#6bd6c7] transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin text-black" size={16} />}
            {loading ? 'Creating Account...' : 'Get Started Free'}
          </button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/[0.08]"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0a1013] px-3 text-slate-500 font-bold">Or</span></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="flex items-center justify-center gap-3 bg-white text-black py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition active:scale-[0.98]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="google" />
          Continue with Google
        </button>

        <p className="text-slate-400 text-xs text-center mt-2">
          Already have an account? <Link href="/auth/login" className="text-[#7be4d5] hover:underline font-semibold ml-1">Sign in</Link>
        </p>
      </div>
    </div>
  );
}