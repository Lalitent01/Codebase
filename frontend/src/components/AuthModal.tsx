'use client';

import { useState } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import { X, Lock, Mail, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, setAuthModalTab } = useUIStore();
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const endpoint = authModalTab === 'login' ? '/auth/login' : '/auth/signup';
      const payload = authModalTab === 'login' 
        ? { email: email.trim().toLowerCase(), password } 
        : { email: email.trim().toLowerCase(), password, username: username.trim() };
      
      const res = await api.post(endpoint, payload);
      setAuth(res.data.user, res.data.access_token);
      
      closeAuthModal();
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    const rawBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
    const cleanBase = rawBase.replace(/\/$/, '');
    window.location.href = `${cleanBase}/auth/google`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0a1013] w-full max-w-md rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden relative text-white">
        
        {/* Close Button */}
        <button 
          onClick={closeAuthModal} 
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="p-7 sm:p-9">
          <header className="text-center mb-6">
            <h2 className="text-2xl font-black tracking-tight text-white">
              {authModalTab === 'login' ? 'Welcome Back' : 'Join Suroor'}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {authModalTab === 'login' ? 'Sign in to continue your private roleplay' : 'Free Indian AI companion roleplay in Hinglish & Hindi'}
            </p>
          </header>

          {errorMsg && (
            <div className="p-3 mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-3.5">
            {authModalTab === 'signup' && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input 
                  type="text" 
                  placeholder="Username" 
                  required
                  autoComplete="username"
                  value={username}
                  className="w-full bg-black/60 border border-white/10 p-3 pl-11 rounded-xl text-white outline-none focus:border-[#7be4d5] transition-all text-sm"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input 
                type="email" 
                placeholder="Email Address" 
                required
                autoComplete="email"
                value={email}
                className="w-full bg-black/60 border border-white/10 p-3 pl-11 rounded-xl text-white outline-none focus:border-[#7be4d5] transition-all text-sm"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input 
                type="password" 
                placeholder="Password" 
                required
                autoComplete={authModalTab === 'login' ? 'current-password' : 'new-password'}
                value={password}
                className="w-full bg-black/60 border border-white/10 p-3 pl-11 rounded-xl text-white outline-none focus:border-[#7be4d5] transition-all text-sm"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#7be4d5] text-black hover:bg-[#6bd6c7] py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all shadow-md shadow-[#7be4d5]/10 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin text-black" size={16} /> : authModalTab === 'login' ? 'Sign In' : 'Create Free Account'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/[0.08]" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-500">
              <span className="bg-[#0a1013] px-3">Or continue with</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogle}
            className="w-full bg-white text-black py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
            Continue with Google
          </button>

          <footer className="mt-5 text-center">
            <button 
              type="button"
              onClick={() => {
                setErrorMsg('');
                setAuthModalTab(authModalTab === 'login' ? 'signup' : 'login');
              }}
              className="text-xs text-slate-400 hover:text-[#7be4d5] transition-colors cursor-pointer font-medium"
            >
              {authModalTab === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}