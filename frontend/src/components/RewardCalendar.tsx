'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { Gift, Lock, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function RewardCalendar() {
  const [status, setStatus] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimNotice, setClaimNotice] = useState<string | null>(null);
  const { fetchUser } = useAuthStore();

  const fetchStatus = useCallback(() => {
    api.get('/analytics/streak/status')
      .then((res) => setStatus(res.data))
      .catch((err) => console.error('Streak status fetch failed:', err));
  }, []);

  useEffect(() => { 
    fetchStatus(); 
    const onFocus = () => fetchStatus();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchStatus]);

  const handleClaim = async (day: number) => {
    if (claiming) return;

    setClaiming(true);
    setClaimNotice(null);

    try {
      const res = await api.post('/analytics/streak/claim', { day });
      const amount = res.data.rewardAmount;
      setClaimNotice(
        res.data.type === 'CHEST' 
          ? '🎁 Welcome Chest added to your Vault!' 
          : `+${amount} Bonus Sparks Claimed!`
      );
      if (fetchUser) await fetchUser(); // Instantly sync wallet balance in sidebar
      fetchStatus();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not claim reward.');
    } finally {
      setClaiming(false);
    }
  };

  if (!status || !status.isEligible) return null;

  return (
    <div className="bg-[#0a1013] border border-white/[0.06] p-6 rounded-3xl mb-8 shadow-xl text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#7be4d5]/10 rounded-xl text-[#7be4d5]">
            <Gift size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white leading-none mb-1">
              Welcome Week Rewards
            </h2>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider leading-none">
              Log in daily to claim bonus sparks and loot chests
            </p>
          </div>
        </div>

        {claimNotice && (
          <div className="text-xs font-bold text-[#7be4d5] animate-in fade-in duration-300">
            {claimNotice}
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const claims = status.claims || [];
          const isClaimed = claims.some((c: any) => c.dayNumber === day);
          const isCurrent = status.currentDay === day;
          const isLocked = day > status.currentDay;
          const canClaim = isCurrent && !status.isClaimedToday;

          return (
            <button 
              key={day}
              type="button"
              disabled={!canClaim || claiming}
              onClick={() => handleClaim(day)}
              className={`relative flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all text-center ${
                isClaimed 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400 opacity-60 cursor-default' 
                  : canClaim 
                    ? 'bg-[#7be4d5] text-black border-[#7be4d5] shadow-lg shadow-[#7be4d5]/20 scale-105 cursor-pointer font-bold hover:bg-[#6bd6c7] active:scale-95' 
                    : isCurrent 
                      ? 'bg-white/5 border-[#7be4d5]/40 text-slate-300 cursor-default' 
                      : 'bg-white/[0.02] border-white/5 text-slate-500 cursor-not-allowed opacity-70'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${canClaim ? 'text-black' : 'text-slate-400'}`}>
                Day {day}
              </span>

              <div className="my-1 flex items-center justify-center">
                {isClaimed ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : isLocked ? (
                  <Lock size={18} className="text-slate-600" />
                ) : claiming && isCurrent ? (
                  <Loader2 size={18} className="animate-spin text-black" />
                ) : (
                  <Gift size={18} className={canClaim ? 'text-black animate-bounce' : 'text-[#7be4d5]'} />
                )}
              </div>
              
              <span className={`text-[9px] font-bold uppercase mt-1 ${canClaim ? 'text-black' : 'text-slate-400'}`}>
                {isClaimed ? 'Claimed' : canClaim ? (claiming ? 'Claiming' : 'Claim!') : day === 7 ? 'Chest' : 'Sparks'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}