'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Clock, PlayCircle, Ghost, Trash2, Loader2 } from 'lucide-react';

export default function RecentChatsPage() {
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchChats = () => {
    setLoading(true);
    api.get('/characters/recent')
      .then((res) => setChats(res.data || []))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push('/auth/login?redirect=/chats');
        }
        console.error('Failed to load recent chats', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.push('/auth/login?redirect=/chats');
      return;
    }
    fetchChats();
  }, [router]);

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) return;

    setDeletingId(chatId);
    try {
      await api.delete(`/chat/${chatId}`);
      setChats((prev) => prev.filter((c) => c.chatId !== chatId));
    } catch {
      alert('Failed to delete chat.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0c] text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3 text-blue-500">
            <MessageSquare size={28} /> Recent History
          </h1>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">Your neural link archive</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-white/5 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-[3rem]">
            <Ghost size={48} className="text-slate-700 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No neural links established</p>
            <Link href="/dashboard" className="mt-4 text-blue-500 hover:underline font-bold text-sm">
              Find a companion →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chats.map((char) => (
              <div 
                key={char.chatId} 
                className="group relative bg-[#111318] border border-white/5 p-6 rounded-[2rem] hover:border-blue-500/30 transition-all flex flex-col gap-4 shadow-xl"
              >
                {/* Delete Button (Separated from Link to avoid DOM nesting warning) */}
                <button 
                  type="button"
                  onClick={(e) => handleDeleteChat(e, char.chatId)}
                  disabled={deletingId === char.chatId}
                  className="absolute top-6 right-6 p-2 bg-red-500/10 text-red-500/40 hover:text-red-500 hover:bg-red-500/20 rounded-xl transition-all z-20 cursor-pointer disabled:opacity-50"
                  title="Delete Conversation"
                  aria-label="Delete Conversation"
                >
                  {deletingId === char.chatId ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>

                {/* Primary Card Link */}
                <Link href={`/chat/${char.id}`} className="flex flex-col gap-4 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-2xl font-black text-blue-500 border border-white/5 group-hover:scale-105 transition-transform uppercase overflow-hidden flex-shrink-0">
                      {char.avatar ? (
                        <img src={char.avatar} className="w-full h-full object-cover" alt={char.name || 'Bot'} />
                      ) : (
                        <span>{char.name?.[0] || '?'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className="font-bold text-white text-lg truncate group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter">
                        {char.name || 'Unnamed Character'}
                      </h3>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock size={12} />
                        <span className="text-[10px] font-black uppercase">
                          {char.lastInteraction ? new Date(char.lastInteraction).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 line-clamp-2 italic font-medium h-8">
                    &ldquo;{char.description || 'No description provided.'}&rdquo;
                  </p>

                  <div className="mt-2 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      by @{char.creator?.username || 'System'}
                    </span>
                    <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                      Continue <PlayCircle size={16} />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}