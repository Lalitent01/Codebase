'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { 
  User, Settings, ShieldCheck, Clock, CheckCircle, 
  XCircle, EyeOff, Info, CreditCard, Sparkles, 
  Trash2, Mail, Fingerprint, Edit2, PlayCircle,
  ExternalLink, Flame, Gift, Package, Wallet, Trash
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

  // Neural Energy Sum Calculation (Sum of all 4 wallets)
  const totalNeuralEnergy = (user?.walletDaily || 0) + (user?.walletBonus || 0) + (user?.walletPaid || 0) + (user?.walletEnhanced || 0);

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
      setMyBots(botsRes.data);
      setRewardStatus(streakRes.data);
      setInventory(invRes.data);
      setFavorites(favRes.data);
      setFollowing(followRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [activeTab, token]);

  const handleUpdateBio = async () => {
    try {
      await api.patch('/auth/update-profile', { bio });
      alert("Neural Bio Link Updated!");
      fetchUser();
    } catch (e) { alert("Update failed."); }
  };

  const handleClaim = async (day: number) => {
    try {
      await api.post('/analytics/streak/claim', { day });
      alert("System Reward Claimed!");
      fetchUser(); fetchData();
    } catch (e) { alert("Eligibility mismatch."); }
  };

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm("Are you sure? This will delete all memories associated with this soul.")) return;
    try {
      await api.delete(`/characters/${id}`);
      fetchData();
    } catch (e) { alert("Severance failed."); }
  };

  if (!mounted || !token) return null;

  return (
    <div className="flex min-h-screen bg-[#0a0a0c] text-white">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto pb-20">
        <header className="mb-10 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                <User className="text-blue-500" size={28} /> My Profile
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest font-sans">Neural Pilot Protocol</p>
                <Link href={`/creator/${user?.username}`} className="flex items-center gap-1.5 text-[9px] bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-blue-400 font-black uppercase tracking-tighter hover:bg-white/10 transition-all">
                  <ExternalLink size={10} /> Public Identity
                </Link>
              </div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 px-5 py-3 rounded-[2rem] flex items-center gap-4 shadow-lg shadow-orange-900/10">
               <Flame className="text-orange-500 fill-current animate-pulse" size={24} />
               <div>
                  <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest leading-none mb-1">Active Streak</p>
                  <p className="text-xl font-black text-white leading-none">{user?.currentStreak} Days</p>
               </div>
            </div>
        </header>

        <div className="flex gap-8 border-b border-white/5 mb-10 overflow-x-auto no-scrollbar">
          <TabLink active={activeTab === 'characters'} label="Creations" count={myBots.length} onClick={() => setActiveTab('characters')} />
          <TabLink active={activeTab === 'favorites'} label="Favorites" count={favorites.length} onClick={() => setActiveTab('favorites')} />
          <TabLink active={activeTab === 'following'} label="Following" count={following.length} onClick={() => setActiveTab('following')} />
          <TabLink active={activeTab === 'identities'} label="Identities" onClick={() => setActiveTab('identities')} />
          <TabLink active={activeTab === 'vault'} label="Vault" count={inventory.reduce((a, b) => a + b.count, 0)} onClick={() => setActiveTab('vault')} />
          <TabLink active={activeTab === 'settings'} label="System" onClick={() => setActiveTab('settings')} />
        </div>

        <div className="animate-in fade-in duration-500">
          {activeTab === 'characters' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {myBots.map((bot) => (
                <MyCharacterCard 
                    key={bot.id} 
                    bot={bot} 
                    onEdit={() => router.push(`/character/edit/${bot.id}`)} 
                    onDelete={() => handleDeleteCharacter(bot.id)}
                    onChat={() => router.push(`/chat/${bot.id}`)} 
                />
              ))}
              <div onClick={() => router.push('/character/create')} className="group border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center p-8 hover:border-blue-500/30 hover:bg-blue-600/5 transition-all cursor-pointer min-h-[200px]">
                <Sparkles className="text-slate-600 group-hover:text-blue-500 transition-all" size={32} />
                <p className="mt-4 font-black uppercase text-[10px] tracking-widest text-slate-600 group-hover:text-blue-500">Birth New Soul</p>
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {favorites.map(fav => (
                 <Link href={`/character/${fav.id}`} key={fav.id} className="group bg-[#111318] p-6 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {fav.avatar ? <img src={fav.avatar} className="w-full h-full object-cover" /> : <span className="font-black text-blue-500">{fav.name[0]}</span>}
                    </div>
                    <div>
                        <h4 className="font-bold text-white uppercase italic group-hover:text-blue-400 transition-colors">{fav.name}</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-black">by @{fav.creator?.username}</p>
                    </div>
                 </Link>
               ))}
               {favorites.length === 0 && <div className="col-span-full py-10 text-center text-slate-600 uppercase font-black text-xs">No favorites saved in local memory.</div>}
            </div>
          )}

          {activeTab === 'following' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {following.map(f => (
                 <Link href={`/creator/${f.following.username}`} key={f.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-black">
                      {f.following.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white">@{f.following.username}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Linked Pilot</p>
                    </div>
                 </Link>
               ))}
               {following.length === 0 && <div className="col-span-full py-10 text-center text-slate-600 uppercase font-black text-xs">No active subscriptions to other pilots.</div>}
            </div>
          )}

          {activeTab === 'vault' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
               {inventory.map(item => (
                 <div key={item.id} className="bg-[#111318] p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center group relative overflow-hidden shadow-xl">
                    <Package className={`text-${item.box.color === 'gold' ? 'yellow' : item.box.color}-500 mb-4 group-hover:scale-110 transition-transform`} size={48} />
                    <p className="text-sm font-black uppercase italic text-center mb-1">{item.box.name}</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Units: {item.count}</p>
                    <button onClick={() => setOpenBoxData({ id: item.boxId, name: item.box.name, color: item.box.color })} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95">De-encrypt</button>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl space-y-6">
               {/* 7-Day Reward UI */}
               {rewardStatus?.isEligible && (
                 <div className="bg-gradient-to-br from-blue-600/10 to-[#111318] border border-blue-500/20 p-8 rounded-[2.5rem] shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                       <Gift className="text-blue-500" size={24} />
                       <h3 className="text-xl font-black uppercase italic tracking-tighter">Welcome Week Protocols</h3>
                    </div>
                    <div className="grid grid-cols-7 gap-3">
                       {[1,2,3,4,5,6,7].map(d => {
                          const isClaimed = rewardStatus.claims.some((c: any) => c.dayNumber === d);
                          const isCurrent = rewardStatus.currentDay === d;
                          const canClaim = isCurrent && !rewardStatus.isClaimedToday;
                          return (
                            <button key={d} disabled={!canClaim} onClick={() => handleClaim(d)} className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${isClaimed ? 'bg-green-500/10 border-green-500/20 opacity-30' : canClaim ? 'bg-blue-600 border-blue-400 scale-105 shadow-blue-900/40 shadow-xl' : 'bg-white/5 border-white/5'}`}>
                               <span className="text-[8px] font-black uppercase mb-2">D{d}</span>
                               <Gift size={16} className={canClaim ? "animate-bounce" : ""} />
                            </button>
                          );
                       })}
                    </div>
                 </div>
               )}

               <div className="bg-[#111318] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 italic">Neural Bio-Link</h3>
                 <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Introduce your identity..." className="w-full bg-black/50 border border-white/10 p-5 rounded-3xl text-white outline-none focus:border-blue-500 transition-all font-sans text-sm resize-none" rows={3} />
                 <button onClick={handleUpdateBio} className="mt-4 px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg active:scale-95 transition-all">Sync Identity</button>
               </div>

               <div className="bg-gradient-to-r from-blue-600/10 to-transparent p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Total Neural Capacity</p>
                        <p className="text-5xl font-black italic tracking-tighter text-white">{totalNeuralEnergy}</p>
                    </div>
                    <Link href="/pricing" className="text-xs font-black text-blue-500 hover:underline uppercase tracking-widest">Upgrade →</Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <WalletSmall label="Daily" value={user?.walletDaily} color="text-blue-500" />
                     <WalletSmall label="Bonus" value={user?.walletBonus} color="text-yellow-500" />
                     <WalletSmall label="Paid" value={user?.walletPaid} color="text-emerald-500" />
                     <WalletSmall label="Enhanced" value={user?.walletEnhanced} color="text-purple-500" />
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'identities' && <div className="max-w-5xl mx-auto"><PersonasPage hideSidebar /></div>}
        </div>

        {openBoxData && <LootBoxOpener boxId={openBoxData.id} boxName={openBoxData.name} color={openBoxData.color} onClose={() => { setOpenBoxData(null); fetchData(); }} />}
      </main>
    </div>
  );
}

function TabLink({ active, label, count, onClick }: any) {
  return (
    <button onClick={onClick} className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all flex items-center gap-2 ${active ? 'text-blue-500 border-blue-500' : 'text-slate-600 border-transparent hover:text-slate-400'}`}>
      {label} {count !== undefined && <span className={`text-[10px] px-2 py-0.5 rounded-lg ${active ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-600'}`}>{count}</span>}
    </button>
  );
}

function WalletSmall({ label, value, color }: any) {
    return (
        <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">{label}</p>
            <p className={`text-sm font-black ${color}`}>{value || 0}</p>
        </div>
    )
}

function MyCharacterCard({ bot, onEdit, onChat, onDelete }: any) {
  const statusStyles: any = {
    PUBLIC: { color: 'text-green-500', icon: <CheckCircle size={12}/>, bg: 'bg-green-500/10' },
    PENDING: { color: 'text-amber-500', icon: <Clock size={12}/>, bg: 'bg-amber-500/10' },
    REJECTED: { color: 'text-red-500', icon: <XCircle size={12}/>, bg: 'bg-red-500/10' },
    PRIVATE: { color: 'text-slate-400', icon: <EyeOff size={12}/>, bg: 'bg-white/5' }
  };
  const style = statusStyles[bot.status] || statusStyles.PRIVATE;

  return (
    <div className="bg-[#111318] border border-white/5 p-6 rounded-[2.5rem] hover:border-white/10 transition-all group flex flex-col shadow-2xl h-full">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center">
                {bot.avatar ? <img src={bot.avatar} className="w-full h-full object-cover" /> : <span className="font-black text-blue-500">{bot.name[0]}</span>}
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${style.bg} ${style.color} text-[9px] font-black uppercase tracking-widest border border-current/10`}>
                {style.icon} {bot.status}
            </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-2 text-slate-500 hover:text-white bg-white/5 rounded-lg"><Edit2 size={14}/></button>
            <button onClick={onDelete} className="p-2 text-red-500/50 hover:text-red-500 bg-white/5 rounded-lg"><Trash size={14}/></button>
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-tight italic group-hover:text-blue-400 transition-colors line-clamp-1">{bot.name}</h3>
        <p className="text-xs text-slate-500 line-clamp-3 mb-6 leading-relaxed font-medium">{bot.description}</p>
      </div>
      <button onClick={onChat} className="w-full py-4 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 uppercase font-black">
        <PlayCircle size={16} /> Link Resume
      </button>
    </div>
  );
}