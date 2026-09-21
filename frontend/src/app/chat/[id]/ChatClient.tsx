'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Send, ChevronLeft, AlertTriangle, RotateCcw, 
  Edit2, X, Check, ShieldCheck, Lock, Heart 
} from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { FormattedMessage } from '@/components/FormattedMessage';

export default function ChatClient({ id }: { id: string }) {
  const router = useRouter();
  const characterId = id;
  const { user, decreaseCredits, fetchUser } = useAuthStore();
  
  const [chatId, setChatId] = useState<string | null>(null);
  const [character, setCharacter] = useState<any>(null);
  const [chatInfo, setChatData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Inline Message Editing States
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (scrollRef.current && !editingMsgId) { 
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
    }
  }, [messages, isTyping, editingMsgId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.push(`/auth/login?redirect=/chat/${characterId}`);
    }
  }, [characterId, router]);

  const fetchHistory = useCallback(async () => {
    if (isInitializing.current) return;
    isInitializing.current = true;
    setIsLoading(true);

    try {
      const res = await api.post(`/chat/init/${characterId}`);
      setChatData(res.data.chat);
      setMessages(res.data.messages || []);
      setChatId(res.data.chat.id); 
    } catch (e) { 
      console.error('Error fetching chat history:', e); 
    } finally {
      setIsLoading(false);
      isInitializing.current = false;
    }
  }, [characterId]);

  useEffect(() => {
    api.get(`/characters/${characterId}`)
      .then((res) => setCharacter(res.data))
      .catch((err) => console.error('Failed to load character info', err));

    fetchHistory();

    return () => { 
      isInitializing.current = false; 
    };
  }, [characterId, fetchHistory]);

  const updateUIMessage = (content: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      if (lastIdx >= 0 && updated[lastIdx].role === 'ASSISTANT') {
        updated[lastIdx] = { ...updated[lastIdx], content };
      }
      return updated;
    });
  };

  const startStream = async (activeChatId: string) => {
    setIsTyping(true);
    let fullAiContent = '';
    let hasDeductedCredits = false;
    let hiddenMode = false;

    setMessages((prev) => [...prev, { role: 'ASSISTANT', content: '' }]);
    
    try {
      const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
      const cleanBase = rawBase.replace(/\/$/, '');
      const token = localStorage.getItem('token');

      const response = await fetch(`${cleanBase}/chat/${activeChatId}/stream`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
      });

      if (!response.ok) throw new Error(`Stream connection failed: ${response.statusText}`);
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream available');

      const decoder = new TextDecoder();
      let buffer = ''; 

      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          setIsTyping(false); 
          if (fetchUser) await fetchUser(); 
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(trimmedLine.replace(/^data:\s*/, ''));
            if (data.usage || data.debugPrompt) continue;

            const content = data.content;
            if (!content) continue;

            if (content.includes('POLICY VIOLATION') || content.includes('LIMIT_REACHED')) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'ASSISTANT', content };
                return updated;
              });
              setIsTyping(false);
              return;
            }

            if (!hiddenMode) {
              fullAiContent += content;

              if (fullAiContent.includes('###')) {
                const visiblePart = fullAiContent.split('###')[0];
                const cleanContent = visiblePart.replace(/^[\s\n\r]+/, '');
                updateUIMessage(cleanContent);
                hiddenMode = true;
                continue;
              }

              const cleanContent = fullAiContent.replace(/^[\s\n\r]+/, '');

              if (cleanContent.length > 0) {
                if (!hasDeductedCredits && decreaseCredits) {
                  decreaseCredits();
                  hasDeductedCredits = true;
                }
                updateUIMessage(cleanContent);
              }
            }
          } catch {
            // Ignore non-JSON chunks
          }
        }
      }
    } catch (err) {
      console.error('Neural Link Error:', err);
      setIsTyping(false);

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'ASSISTANT' && !last.content) {
          last.content = '⚠️ Neural link interrupted. Please try regenerating.';
        }
        return updated;
      });
    }
  };

  const handleRegenerate = async () => {
    if (isTyping || !chatId) return;

    setMessages((prev) => prev.filter((m, idx) => !(m.role === 'ASSISTANT' && idx === prev.length - 1)));

    try {
      await api.delete(`/chat/${chatId}/regenerate`);
      startStream(chatId);
    } catch (e) {
      console.error('Failed to regenerate response', e);
    }
  };

  const handleOpenEdit = (msg: any) => {
    if (isTyping) return;
    setEditingMsgId(msg.id || 'last-msg');
    setEditInput(msg.content);
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!chatId || !editInput.trim()) return;
    const newText = editInput.trim();

    setEditingMsgId(null);
    setIsTyping(true);

    setMessages((prev) => {
      const msgIdx = prev.findIndex((m) => m.id === msgId);
      if (msgIdx === -1) return prev;
      const truncated = prev.slice(0, msgIdx + 1);
      truncated[msgIdx] = { ...truncated[msgIdx], content: newText };
      return truncated;
    });

    try {
      await api.patch(`/chat/${chatId}/message/${msgId}`, { content: newText });
      startStream(chatId);
    } catch (err: any) {
      console.error('Edit failed:', err);
      setIsTyping(false);
      await fetchHistory();
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatId || isTyping || isLoading) return;
    
    const userMsg = input.trim(); 
    setInput('');

    setMessages((prev) => [...prev, { role: 'USER', content: userMsg }]);
    
    try {
      const res = await api.post(`/chat/${chatId}/message`, { content: userMsg, role: 'USER' });
      const savedMsg = res.data;

      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'USER' && !updated[i].id) {
            updated[i] = savedMsg;
            break;
          }
        }
        return updated;
      });

      startStream(chatId);
    } catch (err: any) { 
      const errorMsg = err.response?.data?.message || 'Failed to send message';
      console.error('Failed to send message:', errorMsg); 
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'ASSISTANT', content: `⚠️ ${errorMsg}` },
      ]);
    }
  };

  const lastUserMsg = messages.slice().reverse().find((m) => m.role === 'USER');
  const lastUserMsgId = lastUserMsg?.id;
  const isUnfiltered = Boolean(character?.unfiltered);

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HEADER */}
        <header className="p-4 border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-md flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-full transition" aria-label="Back to Dashboard">
              <ChevronLeft size={20} />
            </Link>
            
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
              {character?.avatar ? (
                <img src={character.avatar} className="w-full h-full object-cover" alt={character.name} />
              ) : (
                <span className="font-black text-blue-500 uppercase italic">{character?.name?.[0] || 'A'}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base leading-none">{character?.name || 'Connecting...'}</h2>

                {/* SFW ROMANCE VS 18+ VISUAL BADGE */}
                {isUnfiltered ? (
                  <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Lock size={10} /> 18+ Uncensored
                  </span>
                ) : (
                  <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Heart size={10} fill="currentColor" /> SFW Romance
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-green-500 font-bold uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
                </span>
                {chatInfo && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-full border border-white/10">
                    <span className="text-[9px] text-slate-500 uppercase font-black">Mood:</span>
                    <span className="text-[9px] text-blue-400 font-bold uppercase">{chatInfo.mood || 'Neutral'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleRegenerate} 
            disabled={isTyping || isLoading} 
            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
            title="Regenerate last response"
          >
            <RotateCcw size={18} />
          </button>
        </header>

        {/* CHAT BUBBLE STREAM */}
        <div 
          ref={scrollRef} 
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/5 via-transparent to-transparent"
        >
          {messages.map((msg, i) => {
            if (msg.role === 'ASSISTANT' && msg.content === '' && i === messages.length - 1) return null;
            const isSystemError = msg.content?.includes('POLICY VIOLATION') || msg.content?.includes('LIMIT_REACHED') || msg.content?.includes('⚠️');
            
            const isThisLastUserMsg = msg.role === 'USER' && (msg.id ? msg.id === lastUserMsgId : msg === lastUserMsg);
            const isCurrentlyEditing = editingMsgId === (msg.id || 'last-msg');

            return (
              <div 
                key={msg.id || `msg-${i}`} 
                className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`relative max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm ${
                  msg.role === 'USER' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : isSystemError 
                      ? 'bg-red-950/40 border border-red-500/50 text-red-200' 
                      : 'bg-[#16191f] text-slate-200 rounded-tl-none border border-white/5'
                }`}>
                  {isSystemError && <AlertTriangle size={14} className="mb-2 text-red-500 inline mr-1" />}

                  {/* INLINE EDIT MODE */}
                  {isCurrentlyEditing ? (
                    <div className="flex flex-col gap-2 min-w-[220px] sm:min-w-[300px]">
                      <textarea
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        className="w-full bg-[#1c2026] text-white p-3 rounded-xl border border-white/20 focus:outline-none focus:border-blue-400 text-sm md:text-base resize-none"
                        rows={Math.min(5, Math.max(2, editInput.split('\n').length))}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingMsgId(null)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer flex items-center gap-1"
                        >
                          <X size={13} /> Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!editInput.trim() || editInput.trim() === msg.content}
                          onClick={() => handleSaveEdit(msg.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-500 hover:bg-blue-400 disabled:opacity-50 transition cursor-pointer flex items-center gap-1 shadow-md shadow-blue-950/40"
                        >
                          <Check size={13} /> Save & Generate
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm md:text-base leading-relaxed break-words">
                      <FormattedMessage content={msg.content} />
                    </div>
                  )}

                  {/* HOVER PEN ICON (Active only on last user message) */}
                  {isThisLastUserMsg && !isTyping && !isCurrentlyEditing && (
                    <button 
                      type="button"
                      onClick={() => handleOpenEdit(msg)} 
                      className="absolute -left-9 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#16191f] sm:bg-transparent text-slate-400 hover:text-white sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer shadow-md sm:shadow-none"
                      title="Edit message (Generates new response)"
                      aria-label="Edit last message"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {isTyping && (messages.length === 0 || messages[messages.length - 1]?.content === '') && (
            <div className="flex justify-start">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 ml-1 uppercase font-bold tracking-widest">
                  {character?.name || 'Character'} is thinking
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center shadow-lg">
                    {character?.avatar ? (
                      <img src={character.avatar} className="w-full h-full object-cover" alt="Thinking" />
                    ) : (
                      <span className="font-black text-blue-500 uppercase italic text-[10px]">{character?.name?.[0] || 'A'}</span>
                    )}
                  </div>
                  <div className="bg-[#16191f] border border-white/5 p-4 rounded-2xl rounded-tl-none flex gap-1 w-fit animate-pulse">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* INPUT FORM */}
        <form onSubmit={sendMessage} className="p-4 bg-[#0f1115] border-t border-white/5">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder={isLoading ? 'Synchronizing neural link...' : isTyping ? 'Generating response...' : `Message ${character?.name || 'Character'}...`} 
              disabled={isTyping || isLoading} 
              className="flex-1 bg-[#1c2026] text-white p-4 rounded-2xl border border-white/5 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 disabled:opacity-50 text-sm" 
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping || isLoading} 
              className="bg-blue-600 p-4 rounded-2xl text-white hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20 cursor-pointer"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}