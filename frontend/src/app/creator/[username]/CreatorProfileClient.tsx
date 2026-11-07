'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import Link from 'next/link';
import { 
  ArrowLeft, Share2, Heart, Users, MessageSquare, 
  Sparkles, Loader2, PlayCircle, ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';

export default function CreatorProfileClient({ username }: { username: string }) {
  const router = useRouter();
  const { token, user: currentUser } = useAuthStore();
  const { openAuthModal } = useUIStore();

  const [creator, setCreator] = useState<any>(null);
  const [bots, setBots] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.get(`/characters/creator/${username}`)
      .then((res) => {
        if (!isMounted) return;
        setCreator(res.data.creator);
        setBots(res.data.bots || []);
      })
      .catch((err) => {
        console.error('Failed to load creator profile:', err);
        router.push('/dashboard');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [username, router]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert('Creator profile link copied to clipboard!');
      } else {
        window.prompt('Copy profile link:', url);
      }
    } catch {
      window.prompt('Copy profile link:', url);
    }
  };

  const handleToggleFollow = async () => {
    if (!token) {
      openAuthModal('login');
      return;
    }

    if (!creator?.id) return;

    try {
      const res = await api.post(`/characters/creator/${creator.id}/follow`);
      setIsFollowing(res.data.followed);
    } catch (err: any) {
      console.error('Follow action failed:', err);
    }
  };

  if (loading || !creator) {
    return (
      <div className="bg-[#030708] min-h-screen text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#7be4d5]" size={36} />
        <p className="text-slate-400 tracking-widest text-xs uppercase font-medium">Loading Creator Profile...</p>
      </div>
    );
  }

  const isSelf = currentUser?.username === creator.username;

  return (
    <div className="flex min-h-screen bg-[#030708] text-white">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto pb-24">
        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.back()} 
            className="p-2.5 bg-[#0a1013] border border-white/10 rounded-2xl hover:bg-white/5 transition text-slate-300"
            aria-label="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <button 
            onClick={handleShare} 
            className="p-2.5 bg-[#0a1013] border border-white/10 rounded-2xl hover:bg-white/5 transition text-slate-300 flex items-center gap-2 text-xs font-semibold"
          >
            <Share2 size={16} /> Share Profile
          </button>
        </div>

        {/* CREATOR HEADER CARD */}
        <div className="bg-[#0a1013] border border-white/[0.06] rounded-3xl p-6 md:p-8 mb-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#7be4d5]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
            <div className="w-24 h-24 rounded-3xl bg-[#152328] border-2 border-[#7be4d5]/30 overflow-hidden flex items-center justify-center text-3xl font-black text-[#7be4d5] shadow-lg flex-shrink-0">
              {creator.avatar ? (
                <img src={creator.avatar} className="w-full h-full object-cover" alt={creator.username} />
              ) : (
                <span>{creator.username?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  @{creator.username}
                </h1>
                <span className="bg-[#7be4d5]/10 text-[#7be4d5] border border-[#7be4d5]/20 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={12} /> Creator
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4 max-w-xl leading-relaxed">
                {creator.bio || 'Creating immersive Indian AI companions on Suroor.'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 font-medium">
                  <Sparkles size={14} className="text-[#7be4d5]" />
                  <span className="text-white font-bold">{bots.length}</span> Characters Created
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Users size={14} className="text-slate-400" />
                  Joined {new Date(creator.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {!isSelf && (
              <button 
                onClick={handleToggleFollow}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  isFollowing 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-[#7be4d5] text-black hover:bg-[#6bd6c7] shadow-md shadow-[#7be4d5]/10'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {/* CHARACTER ROSTER */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2 text-white">
              <Sparkles className="text-[#7be4d5]" size={18} /> Public Characters ({bots.length})
            </h2>
          </div>

          {bots.length === 0 ? (
            <div className="bg-[#0a1013] border border-white/[0.06] rounded-3xl p-12 text-center text-slate-500">
              <p className="text-sm font-semibold">No public characters published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {bots.map((bot) => (
                <Link 
                  key={bot.id} 
                  href={`/character/${bot.id}`} 
                  className="group bg-[#0a1013] border border-white/[0.06] hover:border-[#7be4d5]/30 rounded-3xl p-5 transition-all shadow-xl flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#152328] border border-white/10 flex items-center justify-center font-bold text-[#7be4d5] text-lg overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                      {bot.avatar ? (
                        <img src={bot.avatar} className="w-full h-full object-cover" alt={bot.name} />
                      ) : (
                        <span>{bot.name?.[0] || '?'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base truncate group-hover:text-[#7be4d5] transition-colors">
                        {bot.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                        {bot.language || 'HINGLISH'} • {bot.gender || 'OTHER'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 italic mb-4">
                    &ldquo;{bot.description}&rdquo;
                  </p>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={12} className="text-[#7be4d5]" /> {bot.chatCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} className="text-rose-400" /> {bot.likesCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[#7be4d5] font-bold text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                      Chat <PlayCircle size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}