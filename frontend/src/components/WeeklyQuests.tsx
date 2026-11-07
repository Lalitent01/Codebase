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

  const handleClaim = async (q: any) => {
    const progressId = q.id;
    if (claimingId || q.isClaimed || !q.isCompleted) return;

    setClaimingId(progressId);

    try {
      const res = await api.post(`/analytics/quests/claim/${progressId}`);
      const rewardText = res.data.type === 'CREDITS' 
        ? `+${res.data.reward} Sparks Added!` 
        : '🎁 Chest Added to Vault!';
      
      setClaimedNotice({ id: progressId, text: rewardText });

      setQuests((prev) =>
        prev.map((item) => (item.id === progressId ? { ...item, isClaimed: true } : item))
      );

      if (fetchUser) await fetchUser(); 
      fetchQuests();
    } catch (e: any) { 
      const errorMsg = e.response?.data?.message || 'Failed to claim reward.';
      alert(`Claim Error: ${errorMsg}`);
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) return <div className="h-32 w-full animate-pulse bg-white/5 rounded-3xl mb-8" />;
  if (quests.length === 0) return null;

  return (
    <div className="relative group bg-[#0a1013] border border-white/[0.06] p-6 rounded-3xl mb-8 shadow-xl overflow-hidden text-white">
      <div className="flex justify-between items-center mb-5 px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#7be4d5]/10 rounded-xl text-[#7be4d5]">
            <Trophy size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white leading-none mb-1">Roleplay Quests</h2>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider leading-none">
              Complete goals to earn bonus sparks
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button 
            type="button"
            onClick={() => scroll('left')} 
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition text-slate-300 hover:text-white border border-white/5 cursor-pointer"
            aria-label="Previous Quests"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            type="button"
            onClick={() => scroll('right')} 
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition text-slate-300 hover:text-white border border-white/5 cursor-pointer"
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
              className={`flex-shrink-0 w-[260px] snap-start p-4 rounded-2xl border transition-all relative select-none ${
                q.isClaimed 
                  ? 'bg-emerald-500/5 border-emerald-500/10 opacity-60' 
                  : canClaim 
                    ? 'bg-[#7be4d5]/10 border-[#7be4d5]/40 shadow-lg cursor-pointer hover:scale-[1.02] active:scale-95' 
                    : 'bg-white/[0.02] border-white/5'
              }`}
            >
              <div className="flex justify-between items-start mb-3 h-10">
                <div className="flex-1 mr-2">
                  <h4 className={`font-bold text-xs tracking-tight truncate ${q.isClaimed ? 'text-slate-400' : 'text-white'}`}>
                    {q.quest?.title || 'Objective'}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {isNoticeActive ? (
                      <span className="text-[#7be4d5] font-semibold">{claimedNotice.text}</span>
                    ) : (
                      q.quest?.description || ''
                    )}
                  </p>
                </div>

                {q.isClaimed ? (
                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
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
                    className="bg-[#7be4d5] text-black px-3 py-1 rounded-lg text-[10px] font-bold uppercase shadow-md animate-bounce cursor-pointer flex items-center gap-1 transition"
                  >
                    {isThisClaiming ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={11} /> Claim
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-[#7be4d5] font-bold text-xs">
                    +{q.quest?.rewardValue || 0} <Zap size={11} className="fill-current" />
                  </div>
                )}
              </div>

              {!q.isClaimed && (
                <div className="space-y-1.5 mt-3">
                  <div className="flex justify-between text-[10px] font-medium text-slate-400">
                    <span>{progress >= 100 ? 'Ready to Claim' : 'Progress'}</span>
                    <span>{current}/{goal}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#152328] rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        progress >= 100 
                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' 
                          : 'bg-[#7be4d5]'
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