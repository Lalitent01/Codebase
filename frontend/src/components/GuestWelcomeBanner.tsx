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

    // Only show to unauthenticated visitors
    if (token) return;

    // Do not show on auth pages or active chat sessions
    if (pathname.startsWith('/auth/') || pathname.startsWith('/chat/')) return;

    // Check if dismissed during this session
    const isDismissed = sessionStorage.getItem('suroor_welcome_dismissed');
    if (isDismissed) return;

    // Smooth entry after page exploration
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

  if (!mounted || token || !isOpen) return null;

  return (
    <aside
      aria-label="Welcome perks for new guests"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-6 duration-500"
    >
      <div className="relative bg-[#0a1013]/95 backdrop-blur-2xl border border-[#7be4d5]/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(123,228,213,0.15)] overflow-hidden text-white">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-12 -left-12 w-44 h-44 bg-[#7be4d5]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#152328] border border-[#7be4d5]/40 flex items-center justify-center text-[#7be4d5] shadow-lg flex-shrink-0 animate-pulse">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7be4d5]/15 text-[#7be4d5] border border-[#7be4d5]/30">
                  Welcome Gift
                </span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase">100% Free</span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
                Start Roleplaying on Suroor
              </h3>
            </div>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-2.5 rounded-xl">
              <Zap size={14} className="text-amber-400 flex-shrink-0" />
              <span>30 Daily Free Sparks</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-2.5 rounded-xl">
              <Gift size={14} className="text-rose-400 flex-shrink-0" />
              <span>Day 1–7 Welcome Chests</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-2.5 rounded-xl">
              <Sparkles size={14} className="text-[#7be4d5] flex-shrink-0" />
              <span>Hinglish & Hindi Characters</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-2.5 rounded-xl">
              <Shield size={14} className="text-emerald-400 flex-shrink-0" />
              <span>100% Private & Disagree-Free</span>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="pt-1 flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClaim}
              className="flex-1 bg-[#7be4d5] hover:bg-[#6bd6c7] text-black py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Claim Free Sparks <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}