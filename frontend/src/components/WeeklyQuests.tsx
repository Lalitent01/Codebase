'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import { Trophy, CheckCircle2, Zap, ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function WeeklyQuests() {
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedNotice, setClaimedNotice] = useState<{ id: string; text: string } | null>(null);
  const { fetchUser } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchQuests = useCallback(() => {
    api.get('/analytics/quests/my-progress')
      .then((res) => setQuests(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch on mount and whenever the user returns to the tab
  useEffect(() => { 
    fetchQuests(); 

    const onFocus = () => fetchQuests();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchQuests]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // 1-Click Instant Claim (No alert popup)
  const handleClaim = async (q: any) => {
    const progressId = q.id;
    if (claimingId || q.isClaimed || !q.isCompleted) return;

    setClaimingId(progressId);

    try {
      const res = await api.post(`/analytics/quests/claim/${progressId}`);
      const rewardText = res.data.type === 'CREDITS' 
        ? `+${res.data.reward} Credits Added!` 
        : '🎁 Chest Added to Vault!';
      
      // Inline success feedback (no blocking browser alert)
      setClaimedNotice({ id: progressId, text: rewardText });

      // Optimistically mark as claimed in local UI
      setQuests((prev) =>
        prev.map((item) => (item.id === progressId ? { ...item, isClaimed: true } : item))
      );

      // Immediately refresh user balance in sidebar
      if (fetchUser) await fetchUser(); 
      fetchQuests();
    } catch (e: any) { 
      const errorMsg = e.response?.data?.message || 'Failed to claim reward.';
      alert(`Claim Error: ${errorMsg}`);
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) return <div className="h-32 w-full animate-pulse bg-white/5 rounded-[2.5rem] mb-10" />;
  if (quests.length === 0) return null;

  return (
    <div className="relative group bg-[#111318] border border-white/5 p-6 rounded-[2.5rem] mb-10 shadow-xl overflow-hidden">
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-xl text-purple-500">
            <Trophy size={18} />
          </div>
          <div>
            <h2 className="text-base font-black uppercase italic tracking-tighter leading-none mb-1">Missions</h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-blue-500 leading-none">
              Neural Rewards
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => scroll('left')} 
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5 cursor-pointer"
            aria-label="Previous Quests"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            type="button"
            onClick={() => scroll('right')} 
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5 cursor-pointer"
            aria-label="Next Quests"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x">
        {quests.map((q: any) => {
          const goal = Math.max(1, q.quest?.goalValue || 1);
          const current = q.currentValue || 0;
          const rawPercent = Math.round((current / goal) * 100);
          const progress = isNaN(rawPercent) ? 0 : Math.min(Math.max(0, rawPercent), 100);
          const canClaim = q.isCompleted && !q.isClaimed;
          const isThisClaiming = claimingId === q.id;
          const isNoticeActive = claimedNotice?.id === q.id;

          return (
            <div 
              key={q.id} 
              onClick={() => canClaim && handleClaim(q)}
              className={`flex-shrink-0 w-[260px] snap-start p-5 rounded-3xl border transition-all relative select-none ${
                q.isClaimed 
                  ? 'bg-green-500/5 border-green-500/10 opacity-60' 
                  : canClaim 
                    ? 'bg-blue-600/15 border-blue-500/50 shadow-lg shadow-blue-900/20 cursor-pointer hover:scale-[1.02] active:scale-95' 
                    : 'bg-white/5 border-white/5'
              }`}
            >
              <div className="flex justify-between items-start mb-4 h-10">
                <div className="flex-1 mr-2">
                  <h4 className={`font-bold text-[11px] uppercase tracking-tight ${q.isClaimed ? 'text-slate-400' : 'text-white'}`}>
                    {q.quest?.title || 'Objective'}
                  </h4>
                  <p className="text-[8px] text-slate-500 uppercase font-black line-clamp-1">
                    {isNoticeActive ? (
                      <span className="text-green-400 font-bold">{claimedNotice.text}</span>
                    ) : (
                      q.quest?.description || ''
                    )}
                  </p>
                </div>

                {q.isClaimed ? (
                  <div className="flex items-center gap-1 text-green-500 font-bold text-[10px]">
                    <CheckCircle2 size={16} />
                  </div>
                ) : canClaim ? (
                  <button 
                    type="button"
                    disabled={isThisClaiming}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClaim(q);
                    }} 
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-lg animate-bounce cursor-pointer flex items-center gap-1 transition-transform"
                  >
                    {isThisClaiming ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={10} />
                        Claim
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-blue-400 font-black text-[10px]">
                    +{q.quest?.rewardValue || 0} <Zap size={10} />
                  </div>
                )}
              </div>

              {!q.isClaimed && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-[8px] font-black uppercase text-slate-500">
                    <span>{progress >= 100 ? 'Ready to Claim' : 'Progress'}</span>
                    <span>{current}/{goal}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${
                        progress >= 100 
                          ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                          : 'bg-blue-600'
                      }`} 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}