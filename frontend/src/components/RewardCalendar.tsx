'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { Gift, Lock, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function RewardCalendar() {
  const [status, setStatus] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const { fetchUser } = useAuthStore();

  const fetchStatus = useCallback(() => {
    api.get('/analytics/streak/status')
      .then((res) => setStatus(res.data))
      .catch((err) => console.error('Streak status fetch failed', err));
  }, []);

  useEffect(() => { 
    fetchStatus(); 
  }, [fetchStatus]);

  const handleClaim = async (day: number) => {
    if (claiming) return;

    setClaiming(true);
    try {
      const res = await api.post('/analytics/streak/claim', { day });
      alert(`Success! You earned ${res.data.rewardAmount} bonus credits!`);
      if (fetchUser) await fetchUser(); // Sync user balance immediately
      fetchStatus();
    } catch {
      alert('Could not claim reward.');
    } finally {
      setClaiming(false);
    }
  };

  if (!status || !status.isEligible) return null;

  return (
    <div className="bg-[#111318] border border-white/5 p-6 rounded-[2.5rem] mb-10 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-600/20 rounded-xl text-blue-500">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="text-lg font-black uppercase italic tracking-tighter">Welcome Week</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Daily rewards for new pilots</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const claims = status.claims || [];
          const isClaimed = claims.some((c: any) => c.dayNumber === day);
          const isCurrent = status.currentDay === day;
          const isLocked = day > status.currentDay;
          const canClaim = isCurrent && !status.isClaimedToday;

          return (
            <div 
              key={day}
              className={`relative flex flex-col items-center p-3 rounded-2xl border transition-all ${
                isClaimed ? 'bg-green-500/5 border-green-500/20 opacity-50 cursor-default' :
                canClaim ? 'bg-blue-600 border-blue-400 cursor-pointer hover:scale-105 shadow-lg shadow-blue-900/30' :
                isCurrent ? 'bg-white/5 border-blue-500/50 cursor-default' :
                'bg-white/5 border-white/5 cursor-default'
              }`}
              onClick={() => canClaim && !claiming && handleClaim(day)}
            >
              <span className="text-[10px] font-black mb-2 uppercase opacity-50">Day {day}</span>
              {isClaimed ? (
                <CheckCircle2 size={20} className="text-green-500" />
              ) : isLocked ? (
                <Lock size={20} className="text-slate-700" />
              ) : claiming && isCurrent ? (
                <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                <Gift size={20} className={canClaim ? 'text-white animate-bounce' : 'text-blue-500'} />
              )}
              
              {canClaim && (
                <span className="mt-2 text-[8px] font-black uppercase tracking-widest text-white">
                  {claiming ? 'Claiming' : 'Claim'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}