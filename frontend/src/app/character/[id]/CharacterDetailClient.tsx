'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { 
  ArrowLeft, Heart, Share2, MessageCircle, ShieldCheck, 
  Sparkles, Loader2
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';

export default function CharacterDetailClient({ id }: { id: string }) {
  const router = useRouter();
  
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
        alert('Character link copied to clipboard!');
      } else {
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
      <div className="bg-[#030708] min-h-screen text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#7be4d5]" size={36} />
        <p className="text-slate-400 tracking-widest text-xs uppercase font-medium">Awakening Companion...</p>
      </div>
    );
  }

  const creatorUsername = char.creator?.username;

  return (
    <div className="flex min-h-screen bg-[#030708] text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-24">
        {/* HERO BANNER */}
        <div className="relative h-[40vh] w-full overflow-hidden border-b border-white/[0.06]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7be4d5]/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030708] via-[#030708]/50 to-transparent" />
          
          <button 
            onClick={() => router.back()} 
            className="absolute top-8 left-8 p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-all z-20"
            aria-label="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* CONTENT CONTAINER */}
        <div className="max-w-6xl mx-auto px-6 -mt-36 relative z-10">
          <div className="flex flex-col lg:flex-row gap-10 items-end">
            
            {/* AVATAR HERO */}
            <div className="w-64 h-80 md:w-72 md:h-96 bg-[#0a1013] rounded-[2.5rem] border-4 border-[#030708] flex-shrink-0 overflow-hidden relative flex items-center justify-center shadow-2xl">
              {char.avatar ? (
                <img 
                  src={char.avatar} 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                  alt={char.name || 'Character Avatar'} 
                />
              ) : (
                <div className="text-7xl font-black text-slate-700 uppercase italic select-none">
                  {char.name?.[0] || '?'}
                </div>
              )}
            </div>

            {/* INFO PANEL */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="bg-[#7be4d5]/10 text-[#7be4d5] border border-[#7be4d5]/20 text-[10px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} /> {char.status === 'PUBLIC' ? 'Public Companion' : 'Private'}
                </span>
                {char.unfiltered && (
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Unfiltered 18+
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase mb-2 text-white">
                {char.name}
              </h1>

              {creatorUsername ? (
                <Link href={`/creator/${creatorUsername}`} className="inline-block group mb-6">
                  <p className="text-slate-400 font-medium text-base group-hover:text-[#7be4d5] transition-colors">
                    Created by <span className="text-white font-semibold underline decoration-[#7be4d5]/40">@{creatorUsername}</span>
                  </p>
                </Link>
              ) : (
                <p className="text-slate-500 text-sm mb-6">Created by Suroor</p>
              )}

              <div className="flex flex-wrap gap-3.5">
                <button 
                  onClick={handleStartChat} 
                  className="bg-[#7be4d5] hover:bg-[#6bd6c7] text-black px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-2.5 transition active:scale-95 shadow-lg shadow-[#7be4d5]/10 uppercase tracking-wide"
                >
                  <MessageCircle fill="currentColor" size={20} /> Start Chatting
                </button>

                <button 
                  onClick={handleLike} 
                  className={`p-4 border rounded-2xl transition active:scale-90 ${
                    char.isLiked 
                      ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-900/20' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                  aria-label="Like character"
                >
                  <Heart size={22} fill={char.isLiked ? 'currentColor' : 'none'} />
                </button>

                <button 
                  onClick={handleShare} 
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition text-slate-300"
                  aria-label="Share character link"
                >
                  <Share2 size={22} />
                </button>
              </div>
            </div>
          </div>

          {/* ATTRIBUTES & STORY GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-16">
            <div className="lg:col-span-2 space-y-10">
              <section>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Story Hook</h3>
                <p className="text-xl text-slate-200 leading-relaxed font-normal italic">
                  &ldquo;{char.description}&rdquo;
                </p>
              </section>

              <section className="bg-[#0a1013] p-8 rounded-3xl border border-white/[0.06] shadow-xl">
                <h3 className="text-xs font-bold text-[#7be4d5] uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Sparkles size={16} /> Character Persona
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <DNACard label="Gender" value={char.gender} />
                  <DNACard label="Language" value={char.language} />
                  <DNACard label="Primary Vibe" value={char.tags?.[0] || 'Original'} />
                </div>
              </section>

              {char.scenario && (
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Roleplay Scenario</h3>
                  <div className="p-6 bg-[#0a1013] border border-white/[0.06] rounded-2xl text-slate-300 leading-relaxed text-sm">
                    {char.scenario}
                  </div>
                </section>
              )}
            </div>

            {/* STATS & TAGS */}
            <div className="space-y-6">
              <div className="bg-[#0a1013] border border-white/[0.06] p-6 rounded-3xl shadow-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Conversations</p>
                <p className="text-4xl font-black tracking-tight text-white">{char.chatCount || 0}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase mt-1 tracking-wider">Active Conversations</p>
              </div>

              <div className="bg-[#0a1013] border border-white/[0.06] p-6 rounded-3xl shadow-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Discovery Tags</p>
                <div className="flex flex-wrap gap-2">
                  {char.tags && char.tags.length > 0 ? (
                    char.tags.map((t: string) => (
                      <span 
                        key={t} 
                        className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-slate-300 hover:text-[#7be4d5] hover:border-[#7be4d5]/30 transition-all cursor-default"
                      >
                        #{t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No tags assigned</span>
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
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="font-semibold text-white uppercase text-sm tracking-tight">{value || 'Unknown'}</p>
    </div>
  );
}