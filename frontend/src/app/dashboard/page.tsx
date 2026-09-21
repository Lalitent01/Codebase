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
  ChevronDown, Check, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { MASTER_TAGS } from '@/constants/tags';
import RewardCalendar from '@/components/RewardCalendar';
import WeeklyQuests from '@/components/WeeklyQuests';

export default function DashboardPage() {
  const { token, user, isInitialized } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);

  // Pagination States (Option B: 12 per page)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Tag Dropdown Popover State
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const gridTopRef = useRef<HTMLDivElement>(null);

  // Adaptive Engagement Hub State
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

  // Sync default sort on initial login
  useEffect(() => {
    if (isInitialized && token && sort === 'new') {
      setSort('recommended');
    }
  }, [token, isInitialized, sort, setSort]);

  // Engagement hub status check
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
        if (sort) params.append('sort', sort);
        if (gender !== 'ALL') params.append('gender', gender);
        if (language !== 'ALL') params.append('language', language);
        if (showUnfiltered) params.append('unfiltered', 'true');
        params.append('page', page.toString());
        params.append('limit', '12'); // 12 characters per page
        selectedTags.forEach((t) => params.append('tags', t));

        const res = await api.get(`/characters?${params.toString()}`);
        
        // Supports both object with metadata and raw array fallback
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

    const timer = setTimeout(fetchDiscovery, 300);
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

  if (!mounted || !isInitialized) {
    return <div className="bg-[#0a0a0c] min-h-screen" />;
  }

  const showEngagementHub = Boolean(token && (hasActiveStreak || hasActiveQuests));

  return (
    <div className="flex min-h-screen bg-[#0a0a0c] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
        {/* TOP SEARCH & CTA HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pt-12 lg:pt-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search names, traits, or stories..." 
              className="w-full bg-[#111318] border border-white/5 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-500/50 transition-all text-sm shadow-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <button 
            type="button"
            onClick={() => token ? router.push('/character/create') : openAuthModal('signup')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black text-xs tracking-widest uppercase transition-all shadow-lg shadow-blue-900/40 cursor-pointer text-center"
          >
            + Birth Character
          </button>
        </header>

        {/* EMAIL VERIFICATION NOTICE */}
        {user && !user.isEmailVerified && (
          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-[1.5rem] mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-xl text-orange-500">
                <AlertTriangle size={20} />
              </div>
              <p className="text-xs text-orange-200/70 font-medium">
                Verify your email to unlock custom character creation.
              </p>
            </div>
            <button 
              type="button"
              onClick={handleResendEmail} 
              disabled={resending} 
              className="bg-orange-500 hover:bg-orange-600 text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all disabled:opacity-50 cursor-pointer"
            >
              {resending ? 'Sending...' : 'Resend Link'}
            </button>
          </div>
        )}

        {/* ENGAGEMENT HUB */}
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
            {/* Sort Tabs */}
            <div className="flex bg-[#111318] p-1 rounded-xl border border-white/5 shadow-inner">
              <button 
                type="button"
                onClick={() => setSort('recommended')} 
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  sort === 'recommended' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                FOR YOU
              </button>
              <button 
                type="button"
                onClick={() => setSort('new')} 
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  sort === 'new' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                NEW
              </button>
              <button 
                type="button"
                onClick={() => setSort('top')} 
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  sort === 'top' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                TOP
              </button>
            </div>

            {/* Dropdowns Group */}
            <div className="flex flex-wrap items-center gap-2 bg-[#111318] p-1 rounded-xl border border-white/5">
              {/* Gender Dropdown */}
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value)} 
                className="bg-transparent text-[10px] font-bold uppercase p-2 outline-none text-slate-400 cursor-pointer"
              >
                <option value="ALL">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>

              {/* Language Dropdown */}
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)} 
                className="bg-transparent text-[10px] font-bold uppercase p-2 outline-none text-slate-400 cursor-pointer border-l border-white/5 pl-2"
              >
                <option value="ALL">All Languages</option>
                <option value="ENGLISH">English</option>
                <option value="HINDI">Hindi</option>
                <option value="HINGLISH">Hinglish</option>
              </select>

              {/* Multi-Select Tag Popover Trigger (Matches Dropdown Styling) */}
              <div className="relative border-l border-white/5 pl-1" ref={tagDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsTagDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 p-2 text-[10px] font-bold uppercase text-slate-400 hover:text-white cursor-pointer"
                >
                  <span>
                    {selectedTags.length === 0 
                      ? 'All Tags' 
                      : selectedTags.length === 1 
                        ? selectedTags[0] 
                        : `Tags (${selectedTags.length})`}
                  </span>
                  {selectedTags.length > 0 && (
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  )}
                  <ChevronDown size={12} className={`transition-transform duration-200 ${isTagDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Floating Multi-Select Tags Menu */}
                {isTagDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-56 sm:w-64 bg-[#111318] border border-white/10 rounded-2xl shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex justify-between items-center pb-2 mb-2 border-b border-white/5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Filter Tags</span>
                      {selectedTags.length > 0 && (
                        <button
                          type="button"
                          onClick={() => selectedTags.forEach((t) => toggleTag(t))}
                          className="text-[9px] font-bold text-blue-400 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="max-h-56 overflow-y-auto no-scrollbar space-y-1">
                      {MASTER_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag.label);
                        return (
                          <div
                            key={tag.id}
                            onClick={() => toggleTag(tag.label)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-blue-600/20 text-blue-400 font-bold' 
                                : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <span>#{tag.label}</span>
                            {isSelected && <Check size={14} className="text-blue-500" />}
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
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[10px] font-black transition-all border cursor-pointer ${
                showUnfiltered 
                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/30' 
                  : 'bg-red-600/5 border-red-500/20 text-red-500 hover:bg-red-600/10'
              }`}
            >
              <ShieldCheck size={14} /> 18+ UNFILTERED
            </button>

            {/* Clear All Filters Pill */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  resetFilters(Boolean(token));
                  setSearch('');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* --- CHARACTER GRID (AT LEAST 2 PER ROW ON MOBILE) --- */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {loading ? (
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="aspect-[3/4] sm:aspect-[4/5] bg-white/5 rounded-2xl sm:rounded-3xl animate-pulse" />
              ))
            ) : characters.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-500 italic bg-[#111318] rounded-3xl border border-white/5 border-dashed uppercase tracking-widest text-xs">
                No souls identified in this quadrant...
              </div>
            ) : (
              characters.map((char) => (
                <CharacterCard key={char.id} char={char} router={router} />
              ))
            )}
          </div>
        </section>

        {/* --- NUMBERED PAGINATION (OPTION B) --- */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-white/5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Showing Page {page} of {totalPages} ({totalCount} Characters)
            </p>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-[#111318] border border-white/5 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={16} /> <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Numbered Page Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => {
                  const prevVal = arr[idx - 1];
                  const hasGap = prevVal && p - prevVal > 1;

                  return (
                    <div key={p} className="flex items-center">
                      {hasGap && <span className="px-1 text-slate-600 text-xs">...</span>}
                      <button
                        type="button"
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-black transition cursor-pointer ${
                          page === p
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                            : 'bg-[#111318] border border-white/5 text-slate-400 hover:text-white'
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
                className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-[#111318] border border-white/5 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
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
      className="group relative flex flex-col bg-[#111318] rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-blue-500/30 transition-all hover:-translate-y-1 shadow-2xl cursor-pointer h-full"
      onClick={() => router.push(`/character/${char.id}`)}
    >
      <div className="aspect-[3/4] sm:aspect-[4/5] bg-slate-900 relative overflow-hidden">
        {char.avatar ? (
          <img 
            src={char.avatar} 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            alt={char.name || 'Character'} 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl sm:text-7xl font-black text-white/5 uppercase italic select-none">
            {char.name?.[0] || '?'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-transparent to-transparent z-10" />
        
        {/* Badges */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20 flex gap-1">
           {char.unfiltered && (
             <span className="bg-red-600 text-[7px] sm:text-[8px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg uppercase shadow-lg text-white">
               18+
             </span>
           )}
           <span className="bg-black/50 backdrop-blur-md text-[7px] sm:text-[8px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg uppercase border border-white/10">
             {char.language || 'ENGLISH'}
           </span>
        </div>

        {/* Character Title & Creator */}
        <div className="absolute bottom-2 sm:bottom-4 left-3 sm:left-5 z-20 pr-2 sm:pr-4">
           <h3 className="font-black text-white text-sm sm:text-xl leading-tight group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter truncate">
             {char.name || 'Unnamed'}
           </h3>
           <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold mt-0.5 sm:mt-1 truncate">
             by{' '}
             <span 
               onClick={(e) => { 
                 e.stopPropagation(); 
                 if (creatorUsername) {
                   router.push(`/creator/${creatorUsername}`); 
                 }
               }} 
               className="hover:text-blue-400 hover:underline cursor-pointer relative z-30"
             >
               @{creatorUsername || 'System'}
             </span>
           </p>       
        </div>
      </div>

      <div className="p-3 sm:p-5 flex-1 flex flex-col">
        <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-2 h-7 sm:h-8 leading-relaxed mb-2 sm:mb-4">
          {char.description || 'No description provided.'}
        </p>
        <div className="flex flex-wrap gap-1 mt-auto">
          {char.tags?.slice(0, 2).map((tag: string) => (
            <span 
              key={tag} 
              className="text-[7px] sm:text-[8px] bg-white/5 text-slate-500 border border-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md uppercase font-black tracking-wider truncate max-w-[80px]"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}