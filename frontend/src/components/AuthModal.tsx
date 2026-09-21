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
      const payload = authModalTab === 'login' ? { email, password } : { email, password, username };
      
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
    const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
    const cleanBase = rawBase.replace(/\/$/, '');
    window.location.href = `${cleanBase}/auth/google`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111318] w-full max-w-md rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden relative">
        
        {/* Close Button */}
        <button 
          onClick={closeAuthModal} 
          className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="p-8 md:p-10">
          <header className="text-center mb-6">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
              {authModalTab === 'login' ? 'Welcome Back' : 'Join Suroor'}
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
              {authModalTab === 'login' ? 'Neural Link Required' : 'Create your digital soul'}
            </p>
          </header>

          {errorMsg && (
            <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {authModalTab === 'signup' && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="text" 
                  placeholder="Username" 
                  required
                  value={username}
                  className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl text-white outline-none focus:border-blue-500 transition-all text-sm"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                type="email" 
                placeholder="Email Address" 
                required
                value={email}
                className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl text-white outline-none focus:border-blue-500 transition-all text-sm"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                type="password" 
                placeholder="Password" 
                required
                value={password}
                className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl text-white outline-none focus:border-blue-500 transition-all text-sm"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : authModalTab === 'login' ? 'Initiate Link' : 'Register Pilot'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-slate-600">
              <span className="bg-[#111318] px-4">Secure Gateway</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogle}
            className="w-full bg-white text-black py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="google" />
            Continue with Google
          </button>

          <footer className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => {
                setErrorMsg('');
                setAuthModalTab(authModalTab === 'login' ? 'signup' : 'login');
              }}
              className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-400 transition-colors cursor-pointer"
            >
              {authModalTab === 'login' ? "Don't have an account? Sign up" : 'Already registered? Log in'}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}