'use client';

import { useState, Suspense } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.user, res.data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Invalid email or password.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
    const apiUrl = rawApiUrl.replace(/\/$/, '');
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <div className="bg-slate-900 p-8 rounded-2xl shadow-xl flex flex-col gap-4 w-full max-w-md border border-white/5">
        <h1 className="text-2xl font-bold text-white text-center">Welcome Back</h1>

        {(errorMsg || urlError) && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium">
            {errorMsg || urlError}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Email Address</label>
            <input 
              type="email" 
              placeholder="email@example.com" 
              className="p-3 w-full rounded-xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-blue-500 transition text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="p-3 w-full rounded-xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-blue-500 transition text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
            <div className="flex justify-end mt-1">
              <Link 
                href="/auth/forgot-password" 
                className="text-[10px] text-slate-500 hover:text-blue-400 font-bold uppercase tracking-tighter transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white p-3 mt-2 rounded-xl font-bold hover:bg-blue-700 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-700"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500 font-bold">Or</span></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="flex items-center justify-center gap-3 bg-white text-black py-3 rounded-xl font-bold hover:bg-slate-200 transition active:scale-[0.98]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="google" />
          Continue with Google
        </button>

        <p className="text-slate-400 text-sm text-center mt-2">
          Don&apos;t have an account? <Link href="/auth/signup" className="text-blue-400 hover:underline font-medium">Sign up</Link>
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-10 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
        <Link href="/terms" className="hover:text-blue-500 transition-colors">Terms of Service</Link>
        <Link href="/privacy" className="hover:text-blue-500 transition-colors">Privacy Policy</Link>
        <Link href="/refund-policy" className="hover:text-blue-500 transition-colors">Refund Policy</Link>
        <Link href="/contact" className="hover:text-blue-500 transition-colors underline decoration-blue-500/30">Contact / Support</Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}