'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { 
  MessageSquare, LogOut, Sparkles, ShieldCheck, 
  UserCircle, History, Flame, Clock, Zap, LogIn, 
  UserPlus, Menu, X
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export default function Sidebar() {
  const { user, logout, token } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false); // Mobile drawer state
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // Automatically close mobile sidebar when navigating to a new page
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (token) {
      api.get('/chat/recent-sidebar')
        .then((res) => setRecentChats(res.data || []))
        .catch((err) => console.error('Sidebar history fetch failed', err));
    }
  }, [token, pathname]);

  useEffect(() => {
    if (!user?.passExpiry) {
      setTimeLeft(null);
      return;
    }
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(user.passExpiry).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [user?.passExpiry]);

  const isActive = (path: string) => pathname === path;
  const totalEnergy = (user?.walletDaily || 0) + (user?.walletBonus || 0) + (user?.walletEnhanced || 0);

  return (
    <>
      {/* 1. FLOATING MOBILE HAMBURGER BUTTON (Hidden in full-screen chat) */}
      {!pathname.startsWith('/chat/') && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-40 p-2.5 bg-[#111318]/90 backdrop-blur-xl border border-white/10 rounded-2xl text-slate-300 hover:text-white shadow-2xl active:scale-95 transition-all cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* 2. MOBILE DARK BACKDROP OVERLAY */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-300"
          aria-hidden="true"
        />
      )}

      {/* 3. SIDEBAR (Sticky on Desktop, Sliding Drawer on Mobile) */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50
          w-72 lg:w-64 bg-[#0f1115] border-r border-white/5 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
{/* HEADER & THEMED GLOWING LOGO */}
        <div className="p-6 relative flex items-center justify-center border-b border-white/5">
          {/* Subtle Ambient Backlight Glow behind the logo */}
          <div className="absolute w-32 h-10 bg-cyan-500/15 blur-2xl rounded-full pointer-events-none" />

          <Link href="/dashboard" className="relative z-10 flex items-center justify-center group">
            <img 
              src="/logo.png" 
              alt="Suroor" 
              className="h-14 w-auto object-contain 
                brightness-125 contrast-110
                filter 
                drop-shadow-[0_0_6px_rgba(56,189,248,0.7)] 
                drop-shadow-[0_0_18px_rgba(37,99,235,0.45)]
                group-hover:scale-105 group-hover:brightness-140 group-hover:drop-shadow-[0_0_10px_rgba(56,189,248,0.9)]
                transition-all duration-300"
            />
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-slate-500 hover:text-white rounded-xl bg-white/5 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar py-4">
          <Link href="/dashboard">
            <button 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
                isActive('/dashboard') 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <MessageSquare size={20} /> Discovery
            </button>
          </Link>

          {/* GATED LINKS */}
          {token ? (
            <>
              <Link href="/profile">
                <button 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
                    isActive('/profile') 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                      : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <UserCircle size={20} /> My Profile
                </button>
              </Link>

              <Link href="/chats">
                <button 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
                    isActive('/chats') 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                      : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <History size={20} /> Recent Chats
                </button>
              </Link>
            </>
          ) : (
            /* GUEST LINKS */
            <>
              <button 
                type="button"
                onClick={() => openAuthModal('signup')} 
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 rounded-xl transition cursor-pointer"
              >
                <Sparkles size={20} className="text-blue-500" /> Start Creating
              </button>
              <Link href="/pricing">
                <button 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
                    isActive('/pricing') 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <Zap size={20} /> Pricing
                </button>
              </Link>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <div className="pt-4 mt-4 border-t border-white/5">
              <Link href="/admin">
                <button 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
                    isActive('/admin') 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-900/30' 
                      : 'text-red-400 bg-red-400/5 hover:bg-red-400/10 border border-red-400/10'
                  }`}
                >
                  <ShieldCheck size={20} /> Admin Dashboard
                </button>
              </Link>
            </div>
          )}
        </nav>

        {/* ECONOMY / GUEST CARD */}
        <div className="px-4 mb-4">
          {token ? (
            <div className="bg-[#16191f] p-4 rounded-[2rem] border border-white/5 shadow-inner space-y-3">
              {timeLeft && (
                <div className="bg-blue-600/10 border border-blue-600/20 p-2.5 rounded-2xl animate-pulse">
                  <div className="flex items-center gap-1.5 text-blue-400 mb-0.5">
                    <Clock size={12} />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Unlimited Relay</span>
                  </div>
                  <p className="text-xs font-black text-white tabular-nums">{timeLeft}</p>
                </div>
              )}
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">Neural Energy</p>
                  <p className="text-base font-black text-white leading-none">{totalEnergy}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                  <Flame size={13} className={user?.currentStreak > 0 ? 'text-orange-500 fill-current' : 'text-slate-700'} />
                  <span className="text-xs font-black text-white">{user?.currentStreak || 0}</span>
                </div>
              </div>
              <div className="space-y-1.5 border-t border-white/5 pt-2.5">
                <WalletLine label="Daily" value={user?.walletDaily} max={30} color="bg-blue-600" />
                <WalletLine label="Bonus" value={user?.walletBonus} color="bg-yellow-500" />
                <WalletLine label="Enhanced" value={user?.walletEnhanced} color="bg-purple-500" />
              </div> 
              <Link href="/pricing" className="block pt-1">
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-2 rounded-2xl text-white text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all cursor-pointer">
                  <Sparkles size={11} className="inline mr-1" /> Upgrade
                </button>
              </Link>
            </div> 
          ) : (
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-5 rounded-[2rem] shadow-xl text-center space-y-3">
              <p className="text-white font-black italic uppercase text-sm tracking-tighter">Ready to chat?</p>
              <p className="text-[10px] text-blue-100 uppercase font-bold leading-tight">
                Get 30 free daily messages and create your own souls.
              </p>
              <button 
                type="button"
                onClick={() => openAuthModal('signup')} 
                className="w-full py-2.5 bg-white text-blue-700 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-50 transition-colors cursor-pointer"
              >
                Sign Up Now
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM USER PROFILE / LOGOUT */}
        <div className="p-4 border-t border-white/5">
          {token ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-black text-blue-500 flex-shrink-0">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{user?.username || 'Pilot'}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Neural Pilot</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { 
                  router.push('/auth/login'); 
                  setTimeout(() => { logout(); }, 150);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-all text-xs font-bold group cursor-pointer"
              >
                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => openAuthModal('login')} 
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer"
              >
                <LogIn size={14} /> Login
              </button>
              <button 
                type="button"
                onClick={() => openAuthModal('signup')} 
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 rounded-xl text-xs font-bold hover:bg-blue-500 transition-colors cursor-pointer"
              >
                <UserPlus size={14} /> Join
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function WalletLine({ label, value, max, color }: any) {
  const current = value || 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tighter">
        <span className="text-slate-500">{label}</span>
        <span className="text-white">{current}{max ? `/${max}` : ''}</span>
      </div>
      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
        <div 
          className={`${color} h-full transition-all duration-700`} 
          style={{ width: max ? `${Math.min((current / max) * 100, 100)}%` : (current > 0 ? '100%' : '0%') }} 
        />
      </div>
    </div>
  );
}