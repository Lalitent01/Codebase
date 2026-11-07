'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { 
  User, CheckCircle, XCircle, EyeOff, Sparkles, 
  Trash2, Edit2, PlayCircle, ExternalLink, Flame, 
  Gift, Package, Clock, Zap
} from 'lucide-react';
import PersonasPage from '../personas/page';
import Link from 'next/link';
import LootBoxOpener from '@/components/LootBoxOpener';

export default function ProfileHub() {
  const { user, token, fetchUser } = useAuthStore();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'characters' | 'identities' | 'vault' | 'settings' | 'favorites' | 'following'>('characters');
  const [myBots, setMyBots] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [rewardStatus, setRewardStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [bio, setBio] = useState('');
  const [openBoxData, setOpenBoxData] = useState<{id: string, name: string, color: string} | null>(null);

  // Sparks sum calculation
  const totalSparks = (user?.walletDaily || 0) + (user?.walletBonus || 0) + (user?.walletPaid || 0) + (user?.walletEnhanced || 0);

  useEffect(() => {
    setMounted(true);
    if (user?.bio) setBio(user.bio);
  }, [user]);

  useEffect(() => {
    if (mounted && !token) router.push('/auth/login');
  }, [mounted, token, router]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [botsRes, streakRes, invRes, favRes, followRes] = await Promise.all([
        api.get('/characters/my-collection'),
        api.get('/analytics/streak/status'),
        api.get('/analytics/vault/inventory'),
        api.get('/characters/favorites'),
        api.get('/characters/following')
      ]);
      setMyBots(botsRes.data || []);
      setRewardStatus(streakRes.data);
      setInventory(invRes.data || []);
      setFavorites(favRes.data || []);
      setFollowing(followRes.data || []);
    } catch (err) { 
      console.error('Failed to load profile data:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [activeTab, token]);

  const handleUpdateBio = async () => {
    try {
      await api.patch('/auth/update-profile', { bio });
      alert("Profile bio updated!");
      fetchUser();
    } catch (e) { 
      alert("Failed to update bio."); 
    }
  };

  const handleClaim = async (day: number) => {
    try {
      await api.post('/analytics/streak/claim', { day });
      alert("Daily reward claimed!");
      fetchUser(); 
      fetchData();
    } catch (e) { 
      alert("Reward claim unavailable."); 
    }
  };

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm("Are you sure? This will delete the character and all associated conversation history.")) return;
    try {
      await api.delete(`/characters/${id}`);
      fetchData();
    } catch (e) { 
      alert("Failed to delete character."); 
    }
  };

  if (!mounted || !token) return null;

  return (
    <div className="flex min-h-screen bg-[#030708] text-white">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto pb-24">
        <header className="mb-8 flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5 text-white">
              <User className="text-[#7be4d5]" size={26} /> My Account
            </h1>
            <div className="flex items-center gap-3 mt-1.5">
              <p className="text-slate-400 text-xs font-semibold">@{user?.username || 'user'}</p>
              <Link 
                href={`/creator/${user?.username}`} 
                className="flex items-center gap-1 text-[11px] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-md text-[#7be4d5] hover:bg-white/10 transition font-medium"
              >
                <ExternalLink size={11} /> Public Profile
              </Link>
            </div>
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-3">
             <Flame className="text-amber-400 fill-current animate-pulse" size={22} />
             <div>
                <p className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">Login Streak</p>
                <p className="text-lg font-black text-white leading-none">{user?.currentStreak || 0} Days</p>
             </div>
          </div>
        </header>

        {/* NAVIGATION TABS */}
        <div className="flex gap-6 border-b border-white/[0.08] mb-8 overflow-x-auto no-scrollbar">
          <TabLink active={activeTab === 'characters'} label="My Characters" count={myBots.length} onClick={() => setActiveTab('characters')} />
          <TabLink active={activeTab === 'favorites'} label="Favorites" count={favorites.length} onClick={() => setActiveTab('favorites')} />
          <TabLink active={activeTab === 'following'} label="Following" count={following.length} onClick={() => setActiveTab('following')} />
          <TabLink active={activeTab === 'identities'} label="Personas" onClick={() => setActiveTab('identities')} />
          <TabLink active={activeTab === 'vault'} label="Vault (Loot)" count={inventory.reduce((a, b) => a + b.count, 0)} onClick={() => setActiveTab('vault')} />
          <TabLink active={activeTab === 'settings'} label="Sparks & Settings" onClick={() => setActiveTab('settings')} />
        </div>

        <div className="animate-in fade-in duration-300">
          {/* 1. CREATIONS */}
          {activeTab === 'characters' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {myBots.map((bot) => (
                <MyCharacterCard 
                    key={bot.id} 
                    bot={bot} 
                    onEdit={() => router.push(`/character/edit/${bot.id}`)} 
                    onDelete={() => handleDeleteCharacter(bot.id)}
                    onChat={() => router.push(`/chat/${bot.id}`)} 
                />
              ))}
              <div 
                onClick={() => router.push('/character/create')} 
                className="group border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 hover:border-[#7be4d5]/40 hover:bg-white/[0.02] transition-all cursor-pointer min-h-[190px]"
              >
                <Sparkles className="text-slate-500 group-hover:text-[#7be4d5] transition-colors" size={28} />
                <p className="mt-3 font-bold uppercase text-xs tracking-wider text-slate-400 group-hover:text-white">Create New Character</p>
              </div>
            </div>
          )}

          {/* 2. FAVORITES */}
          {activeTab === 'favorites' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
               {favorites.map(fav => (
                 <Link 
                   href={`/character/${fav.id}`} 
                   key={fav.id} 
                   className="group bg-[#0a1013] p-4 rounded-2xl border border-white/[0.06] hover:border-[#7be4d5]/40 transition-all flex items-center gap-3.5 shadow-md"
                 >
                    <div className="w-12 h-12 rounded-xl bg-[#152328] border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {fav.avatar ? <img src={fav.avatar} className="w-full h-full object-cover" alt={fav.name} /> : <span className="font-bold text-[#7be4d5]">{fav.name[0]}</span>}
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm group-hover:text-[#7be4d5] transition-colors">{fav.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">by @{fav.creator?.username || 'Suroor'}</p>
                    </div>
                 </Link>
               ))}
               {favorites.length === 0 && (
                 <div className="col-span-full py-16 text-center text-slate-500 text-xs font-semibold">
                   No favorite characters saved yet.
                 </div>
               )}
            </div>
          )}

          {/* 3. FOLLOWING */}
          {activeTab === 'following' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {following.map(f => (
                 <Link 
                   href={`/creator/${f.following.username}`} 
                   key={f.id} 
                   className="p-4 bg-[#0a1013] border border-white/[0.06] rounded-2xl flex items-center gap-3.5 hover:border-[#7be4d5]/30 transition-all"
                 >
                    <div className="w-10 h-10 rounded-full bg-[#152328] border border-[#7be4d5]/30 flex items-center justify-center font-bold text-[#7be4d5] text-sm">
                      {f.following.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">@{f.following.username}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Creator</p>
                    </div>
                 </Link>
               ))}
               {following.length === 0 && (
                 <div className="col-span-full py-16 text-center text-slate-500 text-xs font-semibold">
                   You are not following any creators yet.
                 </div>
               )}
            </div>
          )}

          {/* 4. VAULT (LOOT BOXES) */}
          {activeTab === 'vault' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
               {inventory.map(item => (
                 <div key={item.id} className="bg-[#0a1013] p-5 rounded-3xl border border-white/[0.06] flex flex-col items-center group relative overflow-hidden shadow-xl text-center">
                    <Package className="text-[#7be4d5] mb-3 group-hover:scale-110 transition-transform" size={40} />
                    <p className="text-xs font-bold text-white mb-1 truncate w-full">{item.box.name}</p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Quantity: {item.count}</p>
                    <button 
                      onClick={() => setOpenBoxData({ id: item.boxId, name: item.box.name, color: item.box.color })} 
                      className="w-full bg-[#7be4d5] text-black hover:bg-[#6bd6c7] py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all"
                    >
                      Open Box
                    </button>
                 </div>
               ))}
               {inventory.length === 0 && (
                 <div className="col-span-full py-16 text-center text-slate-500 text-xs font-semibold">
                   Your vault is empty. Earn chests from daily streaks and quests!
                 </div>
               )}
            </div>
          )}

          {/* 5. SPARKS & SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl space-y-6">
               {/* 7-Day Welcome Streak Reward */}
               {rewardStatus?.isEligible && (
                 <div className="bg-[#0a1013] border border-[#7be4d5]/20 p-6 md:p-8 rounded-3xl shadow-xl">
                    <div className="flex items-center gap-2.5 mb-6">
                       <Gift className="text-[#7be4d5]" size={20} />
                       <h3 className="text-base font-bold uppercase tracking-wider text-white">Welcome Week Rewards</h3>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                       {[1,2,3,4,5,6,7].map(d => {
                          const isClaimed = rewardStatus.claims?.some((c: any) => c.dayNumber === d);
                          const isCurrent = rewardStatus.currentDay === d;
                          const canClaim = isCurrent && !rewardStatus.isClaimedToday;
                          return (
                            <button 
                              key={d} 
                              disabled={!canClaim} 
                              onClick={() => handleClaim(d)} 
                              className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                                isClaimed 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 opacity-40 cursor-default' 
                                  : canClaim 
                                    ? 'bg-[#7be4d5] text-black border-[#7be4d5] shadow-lg scale-105 cursor-pointer font-bold' 
                                    : 'bg-black/40 border-white/5 opacity-60 cursor-not-allowed'
                              }`}
                            >
                               <span className="text-[9px] uppercase font-bold mb-1">D{d}</span>
                               <Gift size={15} className={canClaim ? "animate-bounce" : ""} />
                            </button>
                          );
                       })}
                    </div>
                 </div>
               )}

               {/* Bio */}
               <div className="bg-[#0a1013] border border-white/[0.06] p-6 md:p-8 rounded-3xl shadow-xl">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Creator Bio</h3>
                 <textarea 
                   value={bio} 
                   onChange={(e) => setBio(e.target.value)} 
                   placeholder="Introduce yourself to fellow roleplayers and creators..." 
                   className="w-full bg-black/60 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-[#7be4d5] transition-all text-xs md:text-sm resize-none" 
                   rows={3} 
                 />
                 <button 
                   onClick={handleUpdateBio} 
                   className="mt-3 px-6 py-2.5 bg-[#7be4d5] text-black hover:bg-[#6bd6c7] rounded-xl font-bold uppercase text-xs tracking-wider transition"
                 >
                   Save Bio
                 </button>
               </div>

               {/* Energy Balance Hub */}
               <div className="bg-[#0a1013] p-6 md:p-8 rounded-3xl border border-white/[0.06] shadow-xl">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                        <p className="text-[10px] font-bold text-[#7be4d5] uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Zap size={12} /> Total Sparks Available
                        </p>
                        <p className="text-3xl md:text-4xl font-black text-white">{totalSparks}</p>
                    </div>
                    <Link href="/pricing" className="text-xs font-bold text-[#7be4d5] hover:underline uppercase tracking-wider">Get More Sparks →</Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     <WalletSmall label="Daily Allowance" value={user?.walletDaily} color="text-[#7be4d5]" />
                     <WalletSmall label="Bonus Sparks" value={user?.walletBonus} color="text-amber-400" />
                     <WalletSmall label="Paid Sparks" value={user?.walletPaid} color="text-emerald-400" />
                     <WalletSmall label="Priority Bursts" value={user?.walletEnhanced} color="text-indigo-400" />
                  </div>
               </div>
            </div>
          )}

          {/* 6. IDENTITIES */}
          {activeTab === 'identities' && <div className="max-w-4xl"><PersonasPage hideSidebar /></div>}
        </div>

        {openBoxData && (
          <LootBoxOpener 
            boxId={openBoxData.id} 
            boxName={openBoxData.name} 
            color={openBoxData.color} 
            onClose={() => { setOpenBoxData(null); fetchData(); }} 
          />
        )}
      </main>
    </div>
  );
}

function TabLink({ active, label, count, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
        active ? 'text-[#7be4d5] border-[#7be4d5]' : 'text-slate-500 border-transparent hover:text-slate-300'
      }`}
    >
      {label} {count !== undefined && <span className={`text-[10px] px-2 py-0.5 rounded-full ${active ? 'bg-[#7be4d5] text-black font-bold' : 'bg-white/5 text-slate-400'}`}>{count}</span>}
    </button>
  );
}

function WalletSmall({ label, value, color }: any) {
    return (
        <div className="bg-black/40 p-3.5 rounded-2xl border border-white/5">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</p>
            <p className={`text-base font-bold ${color}`}>{value || 0}</p>
        </div>
    );
}

function MyCharacterCard({ bot, onEdit, onChat, onDelete }: any) {
  const statusStyles: any = {
    PUBLIC: { color: 'text-emerald-400', icon: <CheckCircle size={12}/>, bg: 'bg-emerald-500/10' },
    PENDING: { color: 'text-amber-400', icon: <Clock size={12}/>, bg: 'bg-amber-500/10' },
    REJECTED: { color: 'text-rose-400', icon: <XCircle size={12}/>, bg: 'bg-rose-500/10' },
    PRIVATE: { color: 'text-slate-400', icon: <EyeOff size={12}/>, bg: 'bg-white/5' }
  };
  const style = statusStyles[bot.status] || statusStyles.PRIVATE;

  return (
    <div className="bg-[#0a1013] border border-white/[0.06] p-5 rounded-3xl hover:border-[#7be4d5]/30 transition-all group flex flex-col shadow-xl h-full justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#152328] border border-white/10 overflow-hidden flex items-center justify-center font-bold text-[#7be4d5]">
                  {bot.avatar ? <img src={bot.avatar} className="w-full h-full object-cover" alt={bot.name} /> : <span>{bot.name[0]}</span>}
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${style.bg} ${style.color} text-[10px] font-bold uppercase tracking-wider border border-current/10`}>
                  {style.icon} {bot.status}
              </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onEdit} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg"><Edit2 size={13}/></button>
              <button onClick={onDelete} className="p-2 text-rose-400/60 hover:text-rose-400 bg-white/5 rounded-lg"><Trash2 size={13}/></button>
          </div>
        </div>
        <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-[#7be4d5] transition-colors line-clamp-1">{bot.name}</h3>
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{bot.description}</p>
      </div>

      <button 
        onClick={onChat} 
        className="w-full py-2.5 bg-white/5 hover:bg-[#7be4d5] text-slate-200 hover:text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <PlayCircle size={15} /> Chat Now
      </button>
    </div>
  );
}