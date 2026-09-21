'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { 
  MessageSquare, ShieldCheck, Calendar, Sparkles, 
  UserPlus, UserMinus, Loader2, UserX 
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function CreatorProfileClient({ username }: { username: string }) {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(`/characters/creator/${username}`);
      if (!res.data) {
        setNotFound(true);
      } else {
        setData(res.data);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNotFound(true);
      }
      console.error('Failed to load creator profile', err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) fetchData();
  }, [username, fetchData]);

  const handleFollow = async () => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    try {
      const res = await api.post(`/characters/creator/${data.creator.id}/follow`);
      setData((prev: any) => ({ ...prev, isFollowing: res.data.followed }));
    } catch {
      alert('Action failed.');
    }
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen text-white flex flex-col items-center justify-center font-mono gap-4 uppercase tracking-[0.3em]">
        <Loader2 className="animate-spin text-blue-500" size={36} />
        <p className="animate-pulse text-xs">Neural_Pilot_Searching...</p>
      </div>
    );
  }

  if (notFound || !data?.creator) {
    return (
      <div className="flex min-h-screen bg-[#050505] text-white">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <UserX size={48} className="text-slate-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Creator Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">No neural signature exists for @{username}.</p>
          <Link href="/dashboard" className="px-6 py-2 bg-blue-600 rounded-xl text-xs font-bold uppercase hover:bg-blue-700 transition">
            Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  // Safe Total Signal math preventing NaN
  const totalSignal = (data.bots || []).reduce((acc: number, b: any) => acc + (b.chatCount || 0), 0);

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="h-72 bg-gradient-to-b from-blue-600/20 to-transparent border-b border-white/5 relative">
          <div className="max-w-6xl mx-auto px-8 h-full flex items-end pb-12">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-end w-full">
              {/* CREATOR AVATAR (Now supports image avatar if set) */}
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-800 border-4 border-[#050505] shadow-2xl flex items-center justify-center text-5xl font-black text-blue-500 uppercase italic overflow-hidden flex-shrink-0">
                {data.creator.avatar ? (
                  <img src={data.creator.avatar} className="w-full h-full object-cover" alt={data.creator.username} />
                ) : (
                  <span>{data.creator.username?.[0] || '?'}</span>
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
                    @{data.creator.username}
                  </h1>
                  <ShieldCheck size={24} className="text-blue-400" />
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-blue-500"/> {data.bots?.length || 0} Neural Links
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-500"/> Registered {new Date(data.creator.createdAt).getFullYear()}
                  </span>
                </div>
              </div>

              {currentUser?.id !== data.creator.id && (
                <button 
                  onClick={handleFollow}
                  className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                    data.isFollowing 
                      ? 'bg-white/5 border border-white/10 text-white hover:bg-red-500/10 hover:text-red-500' 
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  {data.isFollowing ? <><UserMinus size={16} /> Unlink</> : <><UserPlus size={16} /> Follow</>}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="space-y-12">
              <section>
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-6">Identity Logs</h3>
                <p className="text-slate-300 leading-relaxed italic text-lg font-medium">
                  {data.creator.bio || 'Mysterious neural signature detected. No bio logs found.'}
                </p>
              </section>
              <section className="p-6 bg-[#111318] border border-white/5 rounded-[2.5rem]">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Platform Impact</p>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Total Signal</span>
                  <span className="text-2xl font-black text-white">{totalSignal}</span>
                </div>
              </section>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                <Sparkles size={14} /> Soul Portfolio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(data.bots || []).map((bot: any) => (
                  <Link 
                    href={`/character/${bot.id}`} 
                    key={bot.id} 
                    className="group bg-[#111318] border border-white/5 p-6 rounded-[2.5rem] hover:border-blue-500/30 transition-all shadow-xl flex items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/5 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                      {bot.avatar ? (
                        <img src={bot.avatar} className="w-full h-full object-cover" alt={bot.name} />
                      ) : (
                        <span className="font-black text-blue-500 italic">{bot.name?.[0] || '?'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors uppercase italic truncate">
                        {bot.name}
                      </h4>
                      <p className="text-[9px] text-slate-500 uppercase font-black">{bot.chatCount || 0} Chats</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}