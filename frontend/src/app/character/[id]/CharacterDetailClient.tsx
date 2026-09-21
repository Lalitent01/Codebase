'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { 
  ArrowLeft, Heart, Share2, Play, ShieldCheck, 
  BarChart, Loader2
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';

export default function CharacterDetailClient({ id }: { id: string }) {
  const router = useRouter();
  
  // Auth & UI State
  const { token } = useAuthStore();
  const { openAuthModal } = useUIStore();

  const [char, setChar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    api.get(`/characters/${id}`)
      .then((res) => {
        if (isMounted) setChar(res.data);
      })
      .catch(() => {
        if (isMounted) router.push('/dashboard');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, router]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert('Neural Link copied to clipboard!');
      } else {
        // Fallback for older browsers
        window.prompt('Copy this character link:', url);
      }
    } catch {
      window.prompt('Copy this character link:', url);
    }
  };

  const handleLike = async () => {
    if (!token) {
      openAuthModal('login');
      return;
    }

    try {
      const res = await api.post(`/characters/${id}/like`);
      const isLiked = res.data.liked;

      setChar((prev: any) => ({
        ...prev,
        isLiked,
        likesCount: isLiked
          ? (prev.likesCount || 0) + 1
          : Math.max(0, (prev.likesCount || 0) - 1),
      }));
    } catch (e) {
      console.error('Like action failed', e);
    }
  };

  const handleStartChat = () => {
    if (!token) {
      openAuthModal('signup');
      return;
    }
    router.push(`/chat/${char.id}`);
  };

  if (loading || !char) {
    return (
      <div className="bg-black min-h-screen text-white flex flex-col items-center justify-center font-mono gap-4 uppercase tracking-[0.3em]">
        <Loader2 className="animate-spin text-blue-500" size={36} />
        <p className="animate-pulse text-xs">Deciphering_Neural_DNA...</p>
      </div>
    );
  }

  const creatorUsername = char.creator?.username;

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20">
        {/* HERO BANNER */}
        <div className="relative h-[45vh] w-full overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
          
          <button 
            onClick={() => router.back()} 
            className="absolute top-8 left-8 p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-all z-20"
            aria-label="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* CONTENT CONTAINER */}
        <div className="max-w-6xl mx-auto px-8 -mt-40 relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 items-end">
            
            {/* AVATAR HERO */}
            <div className="w-72 h-96 bg-slate-800 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-[#050505] flex-shrink-0 overflow-hidden relative flex items-center justify-center group shadow-2xl">
              {char.avatar ? (
                <img 
                  src={char.avatar} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  alt={char.name || 'Character Avatar'} 
                />
              ) : (
                <div className="text-8xl font-black text-slate-700 uppercase italic select-none">
                  {char.name?.[0] || '?'}
                </div>
              )}
            </div>

            {/* INFO PANEL */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-blue-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-900/20">
                  <ShieldCheck size={14} /> {char.status === 'PUBLIC' ? 'Verified Soul' : 'System Draft'}
                </span>
                {char.unfiltered && (
                  <span className="bg-red-600/20 text-red-500 border border-red-500/20 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                    Unfiltered 18+
                  </span>
                )}
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase mb-4 text-white">
                {char.name}
              </h1>

              {creatorUsername ? (
                <Link href={`/creator/${creatorUsername}`} className="inline-block group mb-8">
                  <p className="text-blue-400 font-bold text-xl group-hover:text-blue-300 group-hover:underline transition-all">
                    by @{creatorUsername}
                  </p>
                </Link>
              ) : (
                <p className="text-slate-500 font-bold text-xl mb-8">by System</p>
              )}

              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handleStartChat} 
                  className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-5 rounded-[1.5rem] font-black text-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-900/40 uppercase italic tracking-tighter"
                >
                  <Play fill="currentColor" size={24} /> Start Chat
                </button>

                <button 
                  onClick={handleLike} 
                  className={`p-5 border border-white/10 rounded-[1.5rem] transition-all hover:scale-105 active:scale-90 ${
                    char.isLiked 
                      ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-900/20' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  aria-label="Like character"
                >
                  <Heart size={28} fill={char.isLiked ? 'currentColor' : 'none'} />
                </button>

                <button 
                  onClick={handleShare} 
                  className="p-5 bg-white/5 border border-white/10 rounded-[1.5rem] hover:bg-white/10 transition-colors"
                  aria-label="Share character link"
                >
                  <Share2 size={28} />
                </button>
              </div>
            </div>
          </div>

          {/* DNA & SPECS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-20">
            <div className="lg:col-span-2 space-y-12">
              <section className="animate-in fade-in duration-700">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Transmission Hook</h3>
                <p className="text-2xl text-slate-200 leading-relaxed font-medium italic">
                  &ldquo;{char.description}&rdquo;
                </p>
              </section>

              <section className="bg-[#111318] p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -z-10" />
                <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                  <BarChart size={16} /> Neural Blueprint
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <DNACard label="Identity" value={char.gender} />
                  <DNACard label="Language" value={char.language} />
                  <DNACard label="Vibe" value={char.tags?.[0] || 'Original'} />
                </div>
              </section>

              {char.scenario && (
                <section className="animate-in fade-in duration-1000">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Current Scenario</h3>
                  <div className="p-8 bg-white/5 border border-white/5 rounded-[2rem] text-slate-300 leading-relaxed italic text-lg shadow-inner">
                    {char.scenario}
                  </div>
                </section>
              )}
            </div>

            {/* SIDEBAR METRICS */}
            <div className="space-y-6">
              <div className="bg-blue-600/5 border border-blue-600/10 p-8 rounded-[2.5rem] shadow-xl">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Total Exchanges</p>
                <p className="text-5xl font-black italic tracking-tighter">{char.chatCount || 0}</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase mt-2 tracking-widest">Active Links Established</p>
              </div>

              <div className="bg-[#111318] border border-white/5 p-8 rounded-[2.5rem] shadow-lg">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Discovery Tags</p>
                <div className="flex flex-wrap gap-2">
                  {char.tags && char.tags.length > 0 ? (
                    char.tags.map((t: string) => (
                      <span 
                        key={t} 
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-blue-400 hover:border-blue-400/30 transition-all cursor-default"
                      >
                        #{t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-600">No tags assigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DNACard({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</p>
      <p className="font-black text-white uppercase text-base tracking-tight italic">{value || 'Unknown'}</p>
    </div>
  );
}