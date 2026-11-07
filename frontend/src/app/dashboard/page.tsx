'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useFilterStore } from '@/store/useFilterStore';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import { 
  Search, ShieldCheck, AlertTriangle, RotateCcw, 
  ChevronDown, Check, ChevronLeft, ChevronRight, Plus
} from 'lucide-react';
import { MASTER_TAGS } from '@/constants/tags';
import RewardCalendar from '@/components/RewardCalendar';
import WeeklyQuests from '@/components/WeeklyQuests';

export default function DashboardPage() {
  const { token, user } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);

  // Pagination States (12 per page)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Tag Dropdown State
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const gridTopRef = useRef<HTMLDivElement>(null);

  // Engagement Hub State
  const [hasActiveStreak, setHasActiveStreak] = useState(false);
  const [hasActiveQuests, setHasActiveQuests] = useState(false);

  // Local Search Input
  const [search, setSearch] = useState('');

  // Persistent Filters
  const {
    selectedTags,
    toggleTag,
    sort,
    setSort,
    gender,
    setGender,
    language,
    setLanguage,
    showUnfiltered,
    setShowUnfiltered,
    resetFilters,
  } = useFilterStore();

  useEffect(() => { 
    setMounted(true); 
  }, []);

  // Close tag dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Engagement status check
  const checkEngagementStatus = useCallback(async () => {
    if (!token) {
      setHasActiveStreak(false);
      setHasActiveQuests(false);
      return;
    }

    try {
      const [streakRes, questsRes] = await Promise.allSettled([
        api.get('/analytics/streak/status'),
        api.get('/analytics/quests/my-progress'),
      ]);

      if (streakRes.status === 'fulfilled' && streakRes.value.data) {
        const s = streakRes.value.data;
        const isDay7Claimed = (s.claims || []).some((c: any) => c.dayNumber === 7);
        setHasActiveStreak(Boolean(s.isEligible && !isDay7Claimed));
      } else {
        setHasActiveStreak(false);
      }

      if (questsRes.status === 'fulfilled' && Array.isArray(questsRes.value.data)) {
        const qList = questsRes.value.data;
        const hasUnclaimed = qList.length > 0 && qList.some((q: any) => !q.isClaimed);
        setHasActiveQuests(hasUnclaimed);
      } else {
        setHasActiveQuests(false);
      }
    } catch {
      setHasActiveStreak(false);
      setHasActiveQuests(false);
    }
  }, [token]);

  useEffect(() => {
    checkEngagementStatus();
    const onFocus = () => checkEngagementStatus();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [checkEngagementStatus]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedTags, sort, gender, language, showUnfiltered]);

  // Fetch Characters with Pagination
  useEffect(() => {
    if (!mounted) return;

    const fetchDiscovery = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.append('search', search.trim());
        params.append('sort', sort || 'new');
        if (gender !== 'ALL') params.append('gender', gender);
        if (language !== 'ALL') params.append('language', language);
        
        // Explicitly send true or false so backend never defaults to undefined
        params.append('unfiltered', showUnfiltered ? 'true' : 'false');
        
        params.append('page', page.toString());
        params.append('limit', '12');
        selectedTags.forEach((t) => params.append('tags', t));

        const res = await api.get(`/characters?${params.toString()}`);
        
        if (res.data?.characters) {
          setCharacters(res.data.characters);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.totalCount || 0);
        } else {
          setCharacters(Array.isArray(res.data) ? res.data : []);
        }
      } catch (e: any) {
        console.error('Discovery fetch failed:', e.response?.data || e.message);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchDiscovery, 250);
    return () => clearTimeout(timer);
  }, [mounted, search, selectedTags, sort, gender, language, showUnfiltered, page]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification');
      alert('Verification link sent to your inbox!');
    } catch {
      alert('Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const hasActiveFilters = Boolean(
    selectedTags.length > 0 ||
    gender !== 'ALL' ||
    language !== 'ALL' ||
    showUnfiltered ||
    search.trim() !== ''
  );

  if (!mounted) {
    return (
      <div className="bg-[#030708] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#7be4d5] border-t-transparent animate-spin" />
      </div>
    );
  }

  const showEngagementHub = Boolean(token && (hasActiveStreak || hasActiveQuests));

  return (
    <div className="flex min-h-screen bg-[#030708] text-white">
      <Sidebar />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
        {/* TOP SEARCH & BRAND HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pt-12 lg:pt-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Indian characters, traits, or stories..." 
              className="w-full bg-[#0a1013] border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-[#7be4d5] transition-all text-sm text-white placeholder-slate-500 shadow-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <button 
            type="button"
            onClick={() => token ? router.push('/character/create') : openAuthModal('signup')}
            className="w-full sm:w-auto bg-[#7be4d5] hover:bg-[#6bd6c7] text-black px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#7be4d5]/10 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus size={16} /> Create Character
          </button>
        </header>

        {/* SEO PAGE HEADING */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Explore Indian AI Characters & Hinglish Roleplay
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Chat freely with authentic Indian companions in natural Hinglish, Hindi, and English. Choose from romantic partners, college drama, or uncensored fictional storylines.
          </p>
        </div>

        {/* EMAIL VERIFICATION NOTICE */}
        {user && !user.isEmailVerified && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
                <AlertTriangle size={18} />
              </div>
              <p className="text-xs text-amber-200/80 font-medium">
                Please verify your email address to unlock public character publishing.
              </p>
            </div>
            <button 
              type="button"
              onClick={handleResendEmail} 
              disabled={resending} 
              className="bg-amber-400 hover:bg-amber-300 text-black px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
            >
              {resending ? 'Sending...' : 'Resend Link'}
            </button>
          </div>
        )}

        {/* ENGAGEMENT REWARD HUB */}
        {showEngagementHub && (
          <div 
            className={`grid gap-6 mb-10 transition-all duration-500 ${
              hasActiveStreak && hasActiveQuests ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {hasActiveStreak && <RewardCalendar />}
            {hasActiveQuests && <WeeklyQuests />}
          </div>
        )}

        {/* --- FILTERS TOOLBAR --- */}
        <div ref={gridTopRef} className="space-y-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Tabs (New is default) */}
            <div className="flex bg-[#0a1013] p-1 rounded-xl border border-white/[0.08]">
              <button 
                type="button"
                onClick={() => setSort('new')} 
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sort === 'new' ? 'bg-[#7be4d5] text-black shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                New
              </button>
              <button 
                type="button"
                onClick={() => setSort('recommended')} 
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sort === 'recommended' ? 'bg-[#7be4d5] text-black shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                For You
              </button>
              <button 
                type="button"
                onClick={() => setSort('top')} 
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sort === 'top' ? 'bg-[#7be4d5] text-black shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Popular
              </button>
            </div>

            {/* Dropdowns Group */}
            <div className="flex flex-wrap items-center gap-2 bg-[#0a1013] p-1 rounded-xl border border-white/[0.08]">
              {/* Gender Dropdown */}
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value)} 
                className="bg-transparent text-xs font-semibold p-2 outline-none text-slate-300 cursor-pointer"
              >
                <option value="ALL" className="bg-[#0a1013]">All Genders</option>
                <option value="FEMALE" className="bg-[#0a1013]">Female</option>
                <option value="MALE" className="bg-[#0a1013]">Male</option>
                <option value="OTHER" className="bg-[#0a1013]">Other</option>
              </select>

              {/* Language Dropdown */}
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)} 
                className="bg-transparent text-xs font-semibold p-2 outline-none text-slate-300 cursor-pointer border-l border-white/10 pl-2"
              >
                <option value="ALL" className="bg-[#0a1013]">All Languages</option>
                <option value="HINGLISH" className="bg-[#0a1013]">Hinglish</option>
                <option value="HINDI" className="bg-[#0a1013]">Hindi (हिंदी)</option>
                <option value="ENGLISH" className="bg-[#0a1013]">English</option>
              </select>

              {/* Tag Popover Trigger */}
              <div className="relative border-l border-white/10 pl-1" ref={tagDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsTagDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 p-2 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  <span>
                    {selectedTags.length === 0 
                      ? 'Categories' 
                      : selectedTags.length === 1 
                        ? selectedTags[0] 
                        : `Tags (${selectedTags.length})`}
                  </span>
                  {selectedTags.length > 0 && (
                    <span className="w-1.5 h-1.5 bg-[#7be4d5] rounded-full animate-pulse" />
                  )}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isTagDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Floating Tags Menu */}
                {isTagDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-60 bg-[#0a1013] border border-white/10 rounded-2xl shadow-2xl z-50 p-3 animate-in fade-in duration-150">
                    <div className="flex justify-between items-center pb-2 mb-2 border-b border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filter Tags</span>
                      {selectedTags.length > 0 && (
                        <button
                          type="button"
                          onClick={() => selectedTags.forEach((t) => toggleTag(t))}
                          className="text-[10px] font-bold text-[#7be4d5] hover:underline cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {MASTER_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag.label);
                        return (
                          <div
                            key={tag.id}
                            onClick={() => toggleTag(tag.label)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-[#7be4d5]/15 text-[#7be4d5] font-bold' 
                                : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <span>#{tag.label}</span>
                            {isSelected && <Check size={14} className="text-[#7be4d5]" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 18+ Unfiltered Toggle */}
            <button 
              type="button"
              onClick={() => token ? setShowUnfiltered(!showUnfiltered) : openAuthModal('login')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                showUnfiltered 
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-950/40' 
                  : 'bg-rose-500/5 border-rose-500/20 text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <ShieldCheck size={14} /> 18+ Unfiltered
            </button>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  resetFilters(Boolean(token));
                  setSearch('');
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* --- CHARACTER CARD GRID --- */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {loading ? (
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="aspect-[3/4] sm:aspect-[4/5] bg-[#0a1013] border border-white/5 rounded-2xl sm:rounded-3xl animate-pulse" />
              ))
            ) : characters.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-400 bg-[#0a1013] rounded-3xl border border-white/[0.08] text-sm">
                No companions found matching your current filters.
              </div>
            ) : (
              characters.map((char) => (
                <CharacterCard key={char.id} char={char} router={router} />
              ))
            )}
          </div>
        </section>

        {/* --- PAGINATION CONTROLS --- */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-white/[0.08]">
            <p className="text-xs font-medium text-slate-400">
              Showing Page {page} of {totalPages} ({totalCount} Characters)
            </p>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-[#0a1013] border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={16} /> <span className="hidden sm:inline">Prev</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => {
                  const prevVal = arr[idx - 1];
                  const hasGap = prevVal && p - prevVal > 1;

                  return (
                    <div key={p} className="flex items-center">
                      {hasGap && <span className="px-1 text-slate-500 text-xs">...</span>}
                      <button
                        type="button"
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                          page === p
                            ? 'bg-[#7be4d5] text-black shadow-md'
                            : 'bg-[#0a1013] border border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })}

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-[#0a1013] border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <span className="hidden sm:inline">Next</span> <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function CharacterCard({ char, router }: { char: any; router: any }) {
  const creatorUsername = char.creator?.username;

  return (
    <div 
      className="group relative flex flex-col bg-[#0a1013] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/[0.08] hover:border-[#7be4d5]/40 transition-all hover:-translate-y-1 shadow-xl cursor-pointer h-full"
      onClick={() => router.push(`/character/${char.id}`)}
    >
      <div className="aspect-[3/4] sm:aspect-[4/5] bg-[#152328] relative overflow-hidden">
        {char.avatar ? (
          <img 
            src={char.avatar} 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            alt={char.name || 'Character'} 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl sm:text-6xl font-black text-white/5 uppercase italic select-none">
            {char.name?.[0] || '?'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1013] via-transparent to-transparent z-10" />
        
        {/* Badges */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-20 flex gap-1">
           {char.unfiltered && (
             <span className="bg-rose-500 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase text-white shadow-md">
               18+
             </span>
           )}
           <span className="bg-black/60 backdrop-blur-md text-[8px] font-bold px-2 py-0.5 rounded-md uppercase border border-white/10 text-slate-200">
             {char.language || 'HINGLISH'}
           </span>
        </div>

        {/* Character Title & Creator */}
        <div className="absolute bottom-2 sm:bottom-3 left-3 sm:left-4 z-20 pr-2 sm:pr-4">
           <h3 className="font-bold text-white text-sm sm:text-lg leading-tight group-hover:text-[#7be4d5] transition-colors truncate">
             {char.name || 'Unnamed'}
           </h3>
           <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
             by{' '}
             <span 
               onClick={(e) => { 
                 e.stopPropagation(); 
                 if (creatorUsername) {
                   router.push(`/creator/${creatorUsername}`); 
                 }
               }} 
               className="hover:text-[#7be4d5] hover:underline cursor-pointer relative z-30"
             >
               @{creatorUsername || 'Suroor'}
             </span>
           </p>       
        </div>
      </div>

      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {char.description || 'No description provided.'}
        </p>
        <div className="flex flex-wrap gap-1 mt-auto">
          {char.tags?.slice(0, 2).map((tag: string) => (
            <span 
              key={tag} 
              className="text-[9px] bg-white/5 text-slate-400 border border-white/5 px-2 py-0.5 rounded-md uppercase font-semibold truncate max-w-[90px]"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}