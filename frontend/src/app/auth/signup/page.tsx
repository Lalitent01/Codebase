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
      const res = await api.post('/auth/signup', { email, password, username });
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
    const rawApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
    const apiUrl = rawApiUrl.replace(/\/$/, '');
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <div className="bg-slate-900 p-8 rounded-2xl shadow-xl flex flex-col gap-4 w-full max-w-md border border-white/5">
        <h1 className="text-2xl font-bold text-white text-center">Create Account</h1>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Username" 
            className="p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-blue-500 transition text-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)} 
            required
          />
          <input 
            type="email" 
            placeholder="Email" 
            className="p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-blue-500 transition text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
            required
          />
          <input 
            type="password" 
            placeholder="Password (min 6 characters)" 
            minLength={6}
            className="p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-blue-500 transition text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-700"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Or</span></div>
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
          Already have an account? <Link href="/auth/login" className="text-blue-400 hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}