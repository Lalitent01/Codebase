'use client';

import { useState } from 'react';
import { Package, Sparkles, X, Zap, Loader2, Coins, CalendarCheck } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

interface OpenerProps {
  boxId: string;
  boxName: string;
  color: string;
  onClose: () => void;
}

const textColorMap: Record<string, string> = {
  blue: 'text-blue-500',
  purple: 'text-purple-500',
  gold: 'text-yellow-500',
  yellow: 'text-yellow-500',
};

const glowColorMap: Record<string, string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  gold: 'bg-yellow-500',
  yellow: 'bg-yellow-500',
};

export default function LootBoxOpener({ boxId, boxName, color, onClose }: OpenerProps) {
  const [stage, setStage] = useState<'idle' | 'opening' | 'revealed'>('idle');
  const [prize, setPrize] = useState<any>(null);
  const { fetchUser } = useAuthStore();

  const textColor = textColorMap[color] || 'text-blue-500';
  const glowColor = glowColorMap[color] || 'bg-blue-500';

  const handleOpen = async () => {
    setStage('opening');
    
    // 1.5s suspense animation
    setTimeout(async () => {
      try {
        const res = await api.post('/analytics/vault/open', { boxId });
        setPrize(res.data.item);
        setStage('revealed');
        if (fetchUser) await fetchUser(); // Sync balance & pass expiry immediately
      } catch {
        alert('Decryption failed. Please try again.');
        onClose();
      }
    }, 1500);
  };

  const isCredits = prize?.type === 'CREDITS';
  const isPlan = prize?.type === 'PLAN';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/90 animate-in fade-in duration-200">
      <div className="relative max-w-sm w-full bg-[#0a0a0c] border border-white/10 rounded-[3rem] p-8 text-center shadow-2xl overflow-hidden">
        
        {/* Glow */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] opacity-25 ${glowColor}`} />

        {/* 1. IDLE */}
        {stage === 'idle' && (
          <div className="animate-in zoom-in duration-300">
            <Package size={80} className={`mx-auto mb-6 ${textColor}`} />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">{boxName}</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-blue-500">
              Neural Cargo Locked
            </p>
            <button 
              type="button"
              onClick={handleOpen}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              Start Decryption
            </button>
          </div>
        )}

        {/* 2. OPENING ANIMATION */}
        {stage === 'opening' && (
          <div className="flex flex-col items-center py-10">
            <Package size={80} className={`${textColor} animate-bounce`} />
            <div className="mt-10 flex items-center gap-2 text-blue-500 font-mono text-[9px] tracking-[0.4em] uppercase">
              <Loader2 className="animate-spin" size={14} />
              Accessing_Relay_Core...
            </div>
          </div>
        )}

        {/* 3. REVEALED REWARD SCREEN */}
        {stage === 'revealed' && (
          <div className="animate-in zoom-in duration-500">
            <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Sparkles className="absolute inset-0 text-yellow-400 animate-spin" size={96} />
              {isCredits ? (
                <Coins size={44} className="text-yellow-400 relative z-10 fill-current" />
              ) : isPlan ? (
                <CalendarCheck size={44} className="text-blue-400 relative z-10" />
              ) : (
                <Zap size={44} className="text-white relative z-10 fill-current" />
              )}
            </div>

            {/* Reward Type Tag */}
            <div className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 border border-white/10 bg-white/5">
              {isCredits ? (
                <span className="text-yellow-400">Bonus Credits Awarded</span>
              ) : isPlan ? (
                <span className="text-blue-400">Access Pass Activated</span>
              ) : (
                <span className="text-slate-400">Loot Decrypted</span>
              )}
            </div>

            {/* Main Reward Title */}
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">
              {isCredits 
                ? `+${prize?.value} Credits` 
                : prize?.plan?.name || prize?.planName || prize?.label || 'Premium Pass'}
            </h2>

            {/* Context Subtitle */}
            <p className="text-slate-400 text-xs font-medium leading-relaxed mb-8 px-2">
              {isCredits ? (
                <>Added to your <strong className="text-white">Bonus Bank</strong>. Available immediately for AI messaging.</>
              ) : isPlan ? (
                <>Your <strong className="text-white">Unlimited Time Pass</strong> is now active on your account.</>
              ) : (
                prize?.label || 'Item successfully added.'
              )}
            </p>

            <button 
              type="button"
              onClick={onClose}
              className="w-full py-4 bg-white text-black hover:bg-slate-200 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all cursor-pointer"
            >
              Collect & Continue
            </button>
          </div>
        )}

        {stage !== 'opening' && (
          <button 
            type="button"
            onClick={onClose} 
            className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
}