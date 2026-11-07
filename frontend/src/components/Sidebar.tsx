'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { 
  MessageSquare, LogOut, Sparkles, ShieldCheck, 
  UserCircle, History, Flame, Clock, Zap, LogIn, 
  UserPlus, Menu, X, PlusCircle
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

  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Live countdown for active Time Pass
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
  const totalSparks = (user?.walletDaily || 0) + (user?.walletBonus || 0) + (user?.walletEnhanced || 0);

  return (
    <>
      {/* 1. FLOATING MOBILE HAMBURGER BUTTON */}
      {!pathname.startsWith('/chat/') && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-40 p-2.5 bg-[#0a1013]/90 backdrop-blur-xl border border-white/10 rounded-2xl text-slate-300 hover:text-white shadow-2xl active:scale-95 transition cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* 2. MOBILE BACKDROP OVERLAY */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-300"
          aria-hidden="true"
        />
      )}

      {/* 3. SIDEBAR */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50
          w-72 lg:w-64 bg-[#05090b] border-r border-white/[0.06] flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* LOGO HEADER */}
        <div className="p-6 relative flex items-center justify-between border-b border-white/[0.06]">
          <div className="absolute w-32 h-10 bg-[#7be4d5]/10 blur-2xl rounded-full pointer-events-none" />

          <Link href="/dashboard" className="relative z-10 flex items-center group">
            <img 
              src="/logo.png" 
              alt="Suroor AI" 
              className="h-10 w-auto object-contain brightness-110 transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 transition cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-3.5 space-y-1.5 overflow-y-auto no-scrollbar py-4 text-xs">
          <Link href="/dashboard">
            <button 
              type="button"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition cursor-pointer ${
                isActive('/dashboard') 
                  ? 'bg-[#7be4d5] text-black shadow-md' 
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <MessageSquare size={18} /> Explore
            </button>
          </Link>

          {/* AUTHENTICATED USER LINKS */}
          {token ? (
            <>
              <Link href="/chats">
                <button 
                  type="button"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition cursor-pointer ${
                    isActive('/chats') 
                      ? 'bg-[#7be4d5] text-black shadow-md' 
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <History size={18} /> Recent Chats
                </button>
              </Link>

              <Link href="/character/create">
                <button 
                  type="button"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition cursor-pointer ${
                    isActive('/character/create') 
                      ? 'bg-[#7be4d5] text-black shadow-md' 
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <PlusCircle size={18} /> Create Character
                </button>
              </Link>

              <Link href="/personas">
                <button 
                  type="button"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition cursor-pointer ${
                    isActive('/personas') 
                      ? 'bg-[#7be4d5] text-black shadow-md' 
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Sparkles size={18} /> My Personas
                </button>
              </Link>

              <Link href="/profile">
                <button 
                  type="button"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition cursor-pointer ${
                    isActive('/profile') 
                      ? 'bg-[#7be4d5] text-black shadow-md' 
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <UserCircle size={18} /> My Profile
                </button>
              </Link>
            </>
          ) : (
            /* GUEST NAVIGATION */
            <>
              <button 
                type="button"
                onClick={() => openAuthModal('signup')} 
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition cursor-pointer"
              >
                <Sparkles size={18} className="text-[#7be4d5]" /> Create Character
              </button>
              <Link href="/pricing">
                <button 
                  type="button"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition cursor-pointer ${
                    isActive('/pricing') 
                      ? 'bg-[#7be4d5] text-black shadow-md' 
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Zap size={18} /> Pricing & Passes
                </button>
              </Link>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <div className="pt-3 mt-3 border-t border-white/[0.06]">
              <Link href="/admin">
                <button 
                  type="button"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition cursor-pointer ${
                    isActive('/admin') 
                      ? 'bg-rose-500 text-white shadow-md' 
                      : 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/15'
                  }`}
                >
                  <ShieldCheck size={18} /> Admin Hub
                </button>
              </Link>
            </div>
          )}
        </nav>

        {/* ECONOMY STATUS / GUEST CTA */}
        <div className="px-3.5 mb-3">
          {token ? (
            <div className="bg-[#0a1013] p-4 rounded-2xl border border-white/[0.06] shadow-xl space-y-3">
              {timeLeft && (
                <div className="bg-[#7be4d5]/10 border border-[#7be4d5]/20 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1.5 text-[#7be4d5] mb-0.5">
                    <Clock size={12} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Unlimited Pass Active</span>
                  </div>
                  <p className="text-xs font-bold text-white tabular-nums">{timeLeft}</p>
                </div>
              )}
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Daily Sparks</p>
                  <p className="text-lg font-black text-white">{totalSparks}</p>
                </div>
                <div className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  <Flame size={14} className={user?.currentStreak > 0 ? 'text-amber-400 fill-current' : 'text-slate-600'} />
                  <span className="text-xs font-bold text-white">{user?.currentStreak || 0}</span>
                </div>
              </div>
              <div className="space-y-1.5 border-t border-white/[0.06] pt-2">
                <WalletLine label="Daily" value={user?.walletDaily} max={30} color="bg-[#7be4d5]" />
                <WalletLine label="Bonus" value={user?.walletBonus} color="bg-amber-400" />
                <WalletLine label="Enhanced" value={user?.walletEnhanced} color="bg-indigo-400" />
              </div> 
              <Link href="/pricing" className="block pt-1">
                <button 
                  type="button"
                  className="w-full bg-[#7be4d5] hover:bg-[#6bd6c7] py-2 rounded-xl text-black text-[10px] font-bold uppercase tracking-wider shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Sparkles size={11} className="inline mr-1" /> Get Sparks / VIP
                </button>
              </Link>
            </div> 
          ) : (
            <div className="bg-[#0a1013] border border-[#7be4d5]/30 p-4 rounded-2xl shadow-xl text-center space-y-2.5">
              <p className="text-white font-bold text-xs">Start Chatting Now</p>
              <p className="text-[11px] text-slate-400 leading-tight">
                Get 30 free daily sparks to chat with Indian AI companions.
              </p>
              <button 
                type="button"
                onClick={() => openAuthModal('signup')} 
                className="w-full py-2 bg-[#7be4d5] hover:bg-[#6bd6c7] text-black rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Sign Up Free
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM USER ROW */}
        <div className="p-3.5 border-t border-white/[0.06]">
          {token ? (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#152328] border border-[#7be4d5]/30 flex items-center justify-center text-xs font-bold text-[#7be4d5] flex-shrink-0">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">@{user?.username || 'user'}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { 
                  router.push('/auth/login'); 
                  setTimeout(() => { logout(); }, 150);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => openAuthModal('login')} 
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold hover:bg-white/10 transition cursor-pointer"
              >
                <LogIn size={13} /> Login
              </button>
              <button 
                type="button"
                onClick={() => openAuthModal('signup')} 
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#7be4d5] text-black rounded-xl text-xs font-bold hover:bg-[#6bd6c7] transition cursor-pointer"
              >
                <UserPlus size={13} /> Join
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
    <div className="space-y-0.5">
      <div className="flex justify-between items-center text-[9px] font-semibold uppercase">
        <span className="text-slate-400">{label}</span>
        <span className="text-white">{current}{max ? `/${max}` : ''}</span>
      </div>
      <div className="w-full bg-[#152328] h-1 rounded-full overflow-hidden">
        <div 
          className={`${color} h-full transition-all duration-500`} 
          style={{ width: max ? `${Math.min((current / max) * 100, 100)}%` : (current > 0 ? '100%' : '0%') }} 
        />
      </div>
    </div>
  );
}