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
  teal: 'text-[#7be4d5]',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  gold: 'text-amber-400',
  yellow: 'text-amber-400',
};

const glowColorMap: Record<string, string> = {
  teal: 'bg-[#7be4d5]',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  gold: 'bg-amber-500',
  yellow: 'bg-amber-500',
};

export default function LootBoxOpener({ boxId, boxName, color, onClose }: OpenerProps) {
  const [stage, setStage] = useState<'idle' | 'opening' | 'revealed'>('idle');
  const [prize, setPrize] = useState<any>(null);
  const { fetchUser } = useAuthStore();

  const textColor = textColorMap[color] || 'text-[#7be4d5]';
  const glowColor = glowColorMap[color] || 'bg-[#7be4d5]';

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
        alert('Could not open chest. Please try again.');
        onClose();
      }
    }, 1500);
  };

  const isCredits = prize?.type === 'CREDITS';
  const isPlan = prize?.type === 'PLAN';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/85 animate-in fade-in duration-200">
      <div className="relative max-w-sm w-full bg-[#0a1013] border border-white/10 rounded-3xl p-8 text-center shadow-2xl overflow-hidden text-white">
        
        {/* Ambient Glow */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] opacity-25 ${glowColor}`} />

        {/* 1. IDLE STATE */}
        {stage === 'idle' && (
          <div className="animate-in zoom-in duration-300">
            <Package size={72} className={`mx-auto mb-5 ${textColor}`} />
            <h2 className="text-xl font-bold tracking-tight mb-1 text-white">{boxName}</h2>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-6 text-[#7be4d5]">
              Ready to Open
            </p>
            <button 
              type="button"
              onClick={handleOpen}
              className="w-full py-3.5 bg-[#7be4d5] hover:bg-[#6bd6c7] text-black rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg transition active:scale-95 cursor-pointer"
            >
              Open Chest
            </button>
          </div>
        )}

        {/* 2. OPENING ANIMATION */}
        {stage === 'opening' && (
          <div className="flex flex-col items-center py-10">
            <Package size={72} className={`${textColor} animate-bounce`} />
            <div className="mt-8 flex items-center gap-2 text-[#7be4d5] text-xs font-semibold tracking-wider uppercase">
              <Loader2 className="animate-spin" size={16} />
              Unlocking Rewards...
            </div>
          </div>
        )}

        {/* 3. REVEALED REWARD SCREEN */}
        {stage === 'revealed' && (
          <div className="animate-in zoom-in duration-500">
            <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Sparkles className="absolute inset-0 text-amber-400 animate-spin" size={90} />
              {isCredits ? (
                <Coins size={44} className="text-amber-400 relative z-10 fill-current" />
              ) : isPlan ? (
                <CalendarCheck size={44} className="text-[#7be4d5] relative z-10" />
              ) : (
                <Zap size={44} className="text-white relative z-10 fill-current" />
              )}
            </div>

            {/* Reward Type Tag */}
            <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 border border-white/10 bg-white/5">
              {isCredits ? (
                <span className="text-amber-400">Bonus Sparks Credited</span>
              ) : isPlan ? (
                <span className="text-[#7be4d5]">VIP Pass Activated</span>
              ) : (
                <span className="text-slate-400">Reward Unlocked</span>
              )}
            </div>

            {/* Main Reward Title */}
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              {isCredits 
                ? `+${prize?.value} Sparks` 
                : prize?.plan?.name || prize?.planName || prize?.label || 'Premium Pass'}
            </h2>

            {/* Subtitle */}
            <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6 px-2">
              {isCredits ? (
                <>Added to your <strong className="text-white">Bonus Bank</strong>. Available immediately for conversations.</>
              ) : isPlan ? (
                <>Your <strong className="text-white">Unlimited Time Pass</strong> is now active on your account.</>
              ) : (
                prize?.label || 'Item added to account.'
              )}
            </p>

            <button 
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-white text-black hover:bg-slate-200 rounded-xl font-bold uppercase tracking-wider text-xs shadow-xl active:scale-95 transition cursor-pointer"
            >
              Collect & Continue
            </button>
          </div>
        )}

        {stage !== 'opening' && (
          <button 
            type="button"
            onClick={onClose} 
            className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}