'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { usePathname } from 'next/navigation';
import { Sparkles, Zap, Gift, X, ArrowRight, Shield } from 'lucide-react';

export default function GuestWelcomeBanner() {
  const { token } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const pathname = usePathname();
  
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Only show to unauthenticated guests
    if (token) return;

    // Do not show on auth pages or full-screen chat
    if (pathname.startsWith('/auth/') || pathname.startsWith('/chat/')) return;

    // Check if previously dismissed in this session
    const isDismissed = sessionStorage.getItem('suroor_welcome_dismissed');
    if (isDismissed) return;

    // Smooth entry delay (2.5 seconds after page loads)
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [token, pathname]);

  const handleDismiss = () => {
    sessionStorage.setItem('suroor_welcome_dismissed', 'true');
    setIsOpen(false);
  };

  const handleClaim = () => {
    setIsOpen(false);
    openAuthModal('signup');
  };

  // Don't render anything if mounted state is not ready, user is logged in, or banner is closed
  if (!mounted || token || !isOpen) return null;

  return (
    <aside
      aria-label="Welcome perks for new guests"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-500"
    >
      <div className="relative bg-[#0f1115]/95 backdrop-blur-2xl border border-blue-500/30 rounded-[2.5rem] p-6 shadow-[0_0_50px_rgba(37,99,235,0.3)] overflow-hidden">
        
        {/* Ambient Neon Backlight Blob */}
        <div className="absolute -top-12 -left-12 w-44 h-44 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-5 right-5 p-2 text-slate-500 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/40 flex-shrink-0 animate-pulse">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  New Pilot Protocol
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">100% Free</span>
              </div>
              <h3 className="text-xl font-black italic tracking-tighter uppercase text-white mt-0.5">
                Unlock Suroor Neural Link
              </h3>
            </div>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-300">
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-2.5 rounded-xl">
              <Zap size={14} className="text-yellow-400 flex-shrink-0" />
              <span>30 Daily Free Messages</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-2.5 rounded-xl">
              <Gift size={14} className="text-purple-400 flex-shrink-0" />
              <span>Day 1–7 Loot Boxes</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-2.5 rounded-xl">
              <Sparkles size={14} className="text-blue-400 flex-shrink-0" />
              <span>Hinglish & Hindi Souls</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-2.5 rounded-xl">
              <Shield size={14} className="text-emerald-400 flex-shrink-0" />
              <span>Private & Encrypted</span>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleClaim}
              className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              Claim Free Energy <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}