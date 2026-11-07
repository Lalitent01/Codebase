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

    if (!confirm('Are you sure you want to delete this conversation? This history cannot be recovered.')) return;

    setDeletingId(chatId);
    try {
      await api.delete(`/chat/${chatId}`);
      setChats((prev) => prev.filter((c) => c.chatId !== chatId));
    } catch {
      alert('Failed to delete conversation.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#030708] text-white">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
            <MessageSquare className="text-[#7be4d5]" size={28} /> Recent Conversations
          </h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-semibold">
            Continue where you left off
          </p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-[#0a1013] border border-white/[0.06] rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-3xl bg-[#0a1013]/50">
            <Ghost size={48} className="text-slate-600 mb-3" />
            <p className="text-slate-400 font-semibold tracking-wider text-sm">No active chats yet</p>
            <p className="text-slate-500 text-xs mt-1 mb-5">Start your first roleplay with any Indian AI companion.</p>
            <Link 
              href="/dashboard" 
              className="bg-[#7be4d5] hover:bg-[#6bd6c7] text-black font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition"
            >
              Explore Companions →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chats.map((char) => (
              <div 
                key={char.chatId} 
                className="group relative bg-[#0a1013] border border-white/[0.06] p-6 rounded-3xl hover:border-[#7be4d5]/40 transition-all flex flex-col gap-4 shadow-xl"
              >
                {/* Delete Button */}
                <button 
                  type="button"
                  onClick={(e) => handleDeleteChat(e, char.chatId)}
                  disabled={deletingId === char.chatId}
                  className="absolute top-5 right-5 p-2 bg-rose-500/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-xl transition-all z-20 cursor-pointer disabled:opacity-50"
                  title="Delete Conversation"
                  aria-label="Delete Conversation"
                >
                  {deletingId === char.chatId ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>

                {/* Primary Card Link */}
                <Link href={`/chat/${char.id}`} className="flex flex-col gap-4 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#152328] flex items-center justify-center text-xl font-bold text-[#7be4d5] border border-white/10 group-hover:scale-105 transition-transform overflow-hidden flex-shrink-0">
                      {char.avatar ? (
                        <img src={char.avatar} className="w-full h-full object-cover" alt={char.name || 'Character'} />
                      ) : (
                        <span>{char.name?.[0] || '?'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className="font-bold text-white text-base truncate group-hover:text-[#7be4d5] transition-colors tracking-tight">
                        {char.name || 'Unnamed Character'}
                      </h3>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                        <Clock size={12} />
                        <span className="text-[11px] font-medium">
                          {char.lastInteraction ? new Date(char.lastInteraction).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-400 line-clamp-2 italic font-normal h-8">
                    &ldquo;{char.description || 'No description provided.'}&rdquo;
                  </p>

                  <div className="mt-2 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      by @{char.creator?.username || 'Suroor'}
                    </span>
                    <div className="flex items-center gap-1.5 text-[#7be4d5] font-bold text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                      Resume <PlayCircle size={15} />
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