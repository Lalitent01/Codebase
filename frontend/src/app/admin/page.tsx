'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import Sidebar from '@/components/Sidebar';
import { 
  Users, MessageSquare, ShieldAlert, BarChart3, 
  Trash2, CheckCircle, Clock, Check, XCircle, 
  ExternalLink, Sparkles, Plus, ListChecks, Gift, 
  Settings2, Save, X, CreditCard, Ban, Loader2
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  // Data States
  const [stats, setStats] = useState<any>(null); 
  const [reports, setReports] = useState<any[]>([]);
  const [pendingBots, setPendingBots] = useState<any[]>([]);
  const [rewardTiers, setRewardTiers] = useState<any[]>([]);
  const [quests, setQuests] = useState<any[]>([]);
  const [lootBoxes, setLootBoxes] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [newReward, setNewReward] = useState({ label: '', days: '', credits: '', type: 'CREDITS', boxId: '' });
  const [newQuest, setNewQuest] = useState({ title: '', description: '', trigger: 'MESSAGE_COUNT', goal: '', reward: '', type: 'DAILY', rType: 'CREDITS', boxId: '' });
  const [newBox, setNewBox] = useState({ name: '', color: 'blue' });

  // Advanced Loot Editor State
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      // Use allSettled so one failing endpoint doesn't crash the entire dashboard
      const results = await Promise.allSettled([
        api.get('/analytics/admin/stats'),
        api.get('/analytics/admin/reports'),
        api.get('/analytics/admin/pending-review'),
        api.get('/analytics/rewards/active'),
        api.get('/analytics/admin/quests'),
        api.get('/analytics/admin/available-boxes'),
        api.get('/analytics/admin/plans'),
        api.get('/analytics/admin/users'),
      ]);

      const [
        statsRes, reportsRes, pendingRes, rewardsRes, 
        questRes, lootRes, plansRes, usersRes
      ] = results;

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data || []);
      if (pendingRes.status === 'fulfilled') setPendingBots(pendingRes.value.data || []);
      if (rewardsRes.status === 'fulfilled') setRewardTiers(rewardsRes.value.data || []);
      if (questRes.status === 'fulfilled') setQuests(questRes.value.data || []);
      if (lootRes.status === 'fulfilled') setLootBoxes(lootRes.value.data || []);
      if (plansRes.status === 'fulfilled') setPlans(plansRes.value.data || []);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data || []);
    } catch (e: any) {
      console.error('Admin fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait until auth state is determined
    if (user === undefined) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchData();
  }, [user, router, fetchData]);

  // --- ACTIONS ---

  const handleStatusUpdate = async (id: string, status: 'PUBLIC' | 'REJECTED') => {
    const note = status === 'REJECTED' ? (prompt('Reason for rejection:') || '') : '';
    if (status === 'REJECTED' && !note.trim()) return;

    try {
      await api.patch(`/analytics/admin/characters/${id}/status`, { status, note });
      fetchData();
    } catch (e) {
      alert('Failed to update character status');
    }
  };

  const handleToggleBan = async (u: any) => {
    const isBanning = !u.isBanned;
    let reason = '';
    if (isBanning) {
      reason = prompt('Reason for banning this user:') || 'Violating community guidelines.';
      if (!reason.trim()) return;
    }
    
    if (confirm(`${isBanning ? 'BAN' : 'UNBAN'} user @${u.username}?`)) {
      try {
        await api.patch(`/analytics/admin/users/${u.id}/ban`, { isBanned: isBanning, reason });
        fetchData();
      } catch (e) {
        alert('Failed to update ban status');
      }
    }
  };

  const handleAddReward = async () => {
    const days = parseInt(newReward.days, 10);
    if (!newReward.label.trim() || isNaN(days) || days <= 0) {
      alert('Please provide a valid label and day count');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/analytics/admin/rewards', { 
        label: newReward.label.trim(), 
        daysRequired: days, 
        rewardType: newReward.type,
        creditsGiven: newReward.type === 'CREDITS' ? parseInt(newReward.credits, 10) || 0 : null,
        lootBoxId: newReward.type === 'CHEST' ? newReward.boxId : null,
      });
      setNewReward({ label: '', days: '', credits: '', type: 'CREDITS', boxId: '' });
      fetchData();
    } catch {
      alert('Error creating reward rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddQuest = async () => {
    const goal = parseInt(newQuest.goal, 10);
    if (!newQuest.title.trim() || isNaN(goal) || goal <= 0) {
      alert('Please provide a valid title and positive goal value');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/analytics/admin/quests', {
        title: newQuest.title.trim(),
        description: newQuest.description.trim() || `Complete ${newQuest.title}`,  
        trigger: newQuest.trigger,
        goalValue: goal,
        rewardType: newQuest.rType,
        rewardValue: newQuest.rType === 'CREDITS' ? parseInt(newQuest.reward, 10) || 10 : 1,
        lootBoxId: newQuest.rType === 'CHEST' ? newQuest.boxId : null,
        type: newQuest.type,
      });
      setNewQuest({ title: '', description: '', trigger: 'MESSAGE_COUNT', goal: '', reward: '', type: 'DAILY', rType: 'CREDITS', boxId: '' });
      fetchData();
    } catch {
      alert('Error creating quest');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLootEditor = (box: any) => {
    setEditingBoxId(box.id);
    setDraftItems(box.items && box.items.length > 0 ? box.items : [{ type: 'CREDITS', label: '', value: 10, weight: 10, planId: '' }]);
  };

  const addDraftRow = () => {
    setDraftItems([...draftItems, { type: 'CREDITS', label: '', value: 10, weight: 10, planId: '' }]);
  };

  const updateDraftItem = (index: number, field: string, value: any) => {
    const newItems = [...draftItems];
    newItems[index][field] = value;
    setDraftItems(newItems);
  };

  const saveLootItems = async () => {
    if (!editingBoxId) return;
    try {
      await api.post(`/analytics/admin/loot-boxes/${editingBoxId}/items`, { items: draftItems });
      setEditingBoxId(null);
      fetchData();
    } catch { 
      alert('Error saving items'); 
    }
  };

  const handleDeleteBox = async (id: string) => {
    if (!confirm('Are you sure you want to delete this box?')) return;
    try {
      await api.delete(`/analytics/admin/loot-boxes/${id}`);
      fetchData();
    } catch {
      alert('Failed to delete box');
    }
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen text-white flex flex-col items-center justify-center font-mono gap-4 uppercase">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <p className="animate-pulse tracking-widest text-xs">Initializing_Command_Chain...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <Sidebar />
      <main className="p-8 flex-1 overflow-y-auto pb-40">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-white uppercase italic text-blue-500">Control Center</h1>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-[0.2em] font-bold">Governance & Economy Factory</p>
          </div>
          <div className="bg-blue-600/10 border border-blue-600/20 px-6 py-3 rounded-2xl text-right">
             <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Conv. Engine</p>
             <p className="text-xl font-black text-white">{stats?.funnel?.conversionRate || 0}%</p>
          </div>
        </header>

        {/* --- 1. METRICS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard icon={<Users className="text-blue-500" />} label="Population" value={stats?.summary?.totalUsers} sub={`+${stats?.summary?.todaySignups || 0} today`} />
          <StatCard icon={<MessageSquare className="text-green-500" />} label="Neural Exchanges" value={stats?.summary?.totalMessages} />
          <StatCard icon={<BarChart3 className="text-purple-500" />} label="Stickiness" value={`${stats?.summary?.stickiness || 0}%`} />
          <StatCard icon={<ShieldAlert className="text-red-500" />} label="Alerts" value={reports.length} />
        </div>

        {/* --- 2. USER DIRECTORY --- */}
        <section className="mb-12">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 uppercase italic text-emerald-500"><Users /> User Directory</h2>
          <div className="bg-[#111318] border border-white/5 rounded-[2.5rem] p-6 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-white/5">
                    <th className="pb-4 pl-4">User</th>
                    <th className="pb-4">Email</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Joined</th>
                    <th className="pb-4 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u: any) => (
                    <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-black text-xs text-blue-500 uppercase">
                            {u.username?.[0] || '?'}
                          </div>
                          <span className="text-sm font-bold">@{u.username}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-slate-400">{u.email}</td>
                      <td className="py-4">
                        {u.isBanned ? (
                          <span className="text-[9px] bg-red-600/20 text-red-500 px-2 py-0.5 rounded font-black uppercase">Suspended</span>
                        ) : (
                          <span className="text-[9px] bg-green-600/20 text-green-500 px-2 py-0.5 rounded font-black uppercase">Active</span>
                        )}
                      </td>
                      <td className="py-4 text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 pr-4 text-right">
                        <button 
                          onClick={() => handleToggleBan(u)}
                          className={`p-2 rounded-lg transition-colors ${u.isBanned ? 'text-green-500 hover:bg-green-500/10' : 'text-red-500/40 hover:text-red-500 hover:bg-red-500/10'}`}
                          title={u.isBanned ? 'Unban User' : 'Ban User'}
                        >
                          {u.isBanned ? <CheckCircle size={18} /> : <Ban size={18} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* --- 3. APPROVAL QUEUE --- */}
        <section className="mb-12">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 uppercase italic text-amber-500"><Clock /> Approval Queue</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {pendingBots.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-[#111318] rounded-[2rem] text-slate-500 font-bold uppercase text-[10px]">Queue Clean</div>
            ) : (
              pendingBots.map((bot: any) => (
                <div key={bot.id} className="p-6 bg-[#111318] border border-white/5 rounded-3xl flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-xl text-blue-500 uppercase">
                      {bot.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-white font-black uppercase text-sm">{bot.name}</p>
                      <p className="text-[10px] text-blue-500 font-bold uppercase">by @{bot.creator?.username || 'unknown'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => router.push(`/character/${bot.id}`)} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white transition" title="Preview"><ExternalLink size={18} /></button>
                    <button onClick={() => handleStatusUpdate(bot.id, 'PUBLIC')} className="p-3 bg-green-500/10 rounded-xl text-green-500 hover:bg-green-500 hover:text-white transition" title="Approve"><Check size={18} /></button>
                    <button onClick={() => handleStatusUpdate(bot.id, 'REJECTED')} className="p-3 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition" title="Reject"><XCircle size={18} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* --- 4. QUEST FACTORY --- */}
        <section className="mb-12">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 uppercase italic text-purple-500"><ListChecks /> Quest Factory</h2>
          <div className="bg-[#111318] p-8 rounded-[2.5rem] border border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <input value={newQuest.title} onChange={e => setNewQuest({...newQuest, title: e.target.value})} placeholder="Quest Title" className="bg-black/50 border border-white/10 p-4 rounded-2xl text-sm outline-none" />
              <input value={newQuest.description} onChange={e => setNewQuest({...newQuest, description: e.target.value})} placeholder="Description" className="bg-black/50 border border-white/10 p-4 rounded-2xl text-sm outline-none" />
              <select value={newQuest.trigger} onChange={e => setNewQuest({...newQuest, trigger: e.target.value as any})} className="bg-black/50 border border-white/10 p-4 rounded-2xl text-sm outline-none">
                <option value="MESSAGE_COUNT">Message Count</option>
                <option value="UNIQUE_CHARACTERS">Unique Bots</option>
                <option value="DAILY_LOGIN">Logins</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <select value={newQuest.rType} onChange={e => setNewQuest({...newQuest, rType: e.target.value as any})} className="bg-black/50 border border-white/10 p-4 rounded-2xl text-sm outline-none">
                <option value="CREDITS">Raw Credits</option>
                <option value="CHEST">Lucky Chest</option>
              </select>
              {newQuest.rType === 'CHEST' ? (
                <select value={newQuest.boxId} onChange={e => setNewQuest({...newQuest, boxId: e.target.value})} className="bg-black/50 border border-white/10 p-4 rounded-2xl text-sm outline-none">
                  <option value="">Select Chest...</option>
                  {lootBoxes.map(lb => <option key={lb.id} value={lb.id}>{lb.name}</option>)}
                </select>
              ) : (
                <input value={newQuest.reward} onChange={e => setNewQuest({...newQuest, reward: e.target.value})} type="number" placeholder="Credits" className="bg-black/50 border border-white/10 p-4 rounded-2xl text-sm outline-none" />
              )}
              <input value={newQuest.goal} onChange={e => setNewQuest({...newQuest, goal: e.target.value})} type="number" placeholder="Goal Value" className="bg-black/50 border border-white/10 p-4 rounded-2xl text-sm outline-none" />
            </div>
            <button 
              disabled={isSubmitting}
              onClick={handleAddQuest} 
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all"
            >
              {isSubmitting ? 'Processing...' : 'Launch Objective'}
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
               {quests.map((q: any) => (
                 <div key={q.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center">
                    <div><p className="text-white font-bold text-sm">{q.title}</p><p className="text-[9px] text-slate-500 uppercase">{q.trigger} | Goal: {q.goalValue}</p></div>
                    <button onClick={async () => { await api.delete(`/analytics/admin/quests/${q.id}`); fetchData(); }} className="text-red-500/40 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* --- 5. STREAK ECONOMY --- */}
        <section className="mb-12">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 uppercase italic text-blue-500"><Sparkles /> Streak Economy</h2>
          <div className="bg-[#111318] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10 bg-white/5 p-4 rounded-3xl border border-white/5">
              <input value={newReward.label} onChange={e => setNewReward({...newReward, label: e.target.value})} placeholder="Label" className="bg-black/50 border border-white/10 p-4 rounded-2xl text-xs outline-none" />
              <input value={newReward.days} onChange={e => setNewReward({...newReward, days: e.target.value})} type="number" placeholder="Day" className="bg-black/50 border border-white/10 p-4 rounded-2xl text-xs outline-none" />
              <select value={newReward.type} onChange={e => setNewReward({...newReward, type: e.target.value as any})} className="bg-black/50 border border-white/10 p-4 rounded-2xl text-xs outline-none">
                <option value="CREDITS">Credits</option>
                <option value="CHEST">Chest</option>
              </select>
              {newReward.type === 'CHEST' ? (
                <select value={newReward.boxId} onChange={e => setNewReward({...newReward, boxId: e.target.value})} className="bg-black/50 border border-white/10 p-4 rounded-2xl text-xs outline-none">
                  <option value="">Select Box...</option>
                  {lootBoxes.map(lb => <option key={lb.id} value={lb.id}>{lb.name}</option>)}
                </select>
              ) : (
                <input value={newReward.credits} onChange={e => setNewReward({...newReward, credits: e.target.value})} type="number" placeholder="Amount" className="bg-black/50 border border-white/10 p-4 rounded-2xl text-xs outline-none" />
              )}
              <button 
                disabled={isSubmitting}
                onClick={handleAddReward} 
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 p-4 rounded-2xl font-black text-[10px] uppercase transition-all"
              >
                Add Rule
              </button>
            </div>
            <div className="space-y-2">
               {rewardTiers.map((rt: any) => (
                 <div key={rt.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex gap-10 items-center">
                      <span className="text-xs font-black uppercase text-white w-24">{rt.label}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Day {rt.daysRequired}</span>
                      <span className="text-[10px] font-black text-green-500 uppercase">{rt.rewardType === 'CHEST' ? `🎁 ${rt.lootBox?.name || 'Chest'}` : `+${rt.creditsGiven || 0} CR`}</span>
                    </div>
                    <button onClick={async () => { await api.delete(`/analytics/admin/rewards/${rt.id}`); fetchData(); }} className="text-red-500/30 hover:text-red-500"><Trash2 size={16}/></button>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* --- 6. LOOT FACTORY --- */}
        <section className="mb-12">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 uppercase italic text-pink-500"><Gift /> Loot Factory</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#111318] p-8 rounded-[2rem] border border-white/5 h-fit shadow-2xl">
              <h3 className="text-xs font-black text-slate-500 uppercase mb-6 tracking-widest">Construct New Hull</h3>
              <div className="space-y-4">
                <input value={newBox.name} onChange={e => setNewBox({...newBox, name: e.target.value})} placeholder="Unique Chest Name" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm outline-none" />
                <select value={newBox.color} onChange={e => setNewBox({...newBox, color: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm font-bold outline-none">
                   <option value="blue">Blue (Common)</option>
                   <option value="purple">Purple (Rare)</option>
                   <option value="gold">Gold (Epic)</option>
                </select>
                <button 
                  onClick={async () => { 
                    if (!newBox.name.trim()) return alert('Box name required');
                    await api.post('/analytics/admin/loot-boxes', newBox); 
                    setNewBox({ name: '', color: 'blue' });
                    fetchData(); 
                  }} 
                  className="w-full bg-pink-600 py-4 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all"
                >
                  Commit Box
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {lootBoxes.map(box => (
                <div key={box.id} className="bg-[#111318] p-6 rounded-3xl border border-white/5 shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className={`font-black uppercase italic ${box.color === 'blue' ? 'text-blue-500' : 'text-yellow-500'}`}>{box.name}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">{box.items?.length || 0} Drops Configured</p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => openLootEditor(box)} className="p-2.5 bg-blue-600/10 rounded-xl text-blue-500 hover:bg-blue-600 hover:text-white transition-all"><Settings2 size={18} /></button>
                       <button onClick={() => handleDeleteBox(box.id)} className="p-2.5 bg-red-600/10 rounded-xl text-red-500 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                    </div>
                  </div>

                  {editingBoxId === box.id && (
                    <div className="space-y-4 bg-black/40 p-4 rounded-2xl border border-blue-500/20 animate-in fade-in zoom-in duration-200">
                       <div className="flex justify-between items-center mb-2">
                          <p className="text-[10px] font-black text-blue-400 uppercase">Configuring Drop Probabilities</p>
                          <button onClick={addDraftRow} className="text-blue-500 hover:text-blue-400"><Plus size={16}/></button>
                       </div>
                       {draftItems.map((item, idx) => (
                         <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                            <select value={item.type} onChange={e => updateDraftItem(idx, 'type', e.target.value)} className="col-span-3 bg-black border border-white/5 p-2 rounded-lg text-[9px] font-bold">
                               <option value="CREDITS">Credits</option>
                               <option value="PLAN">Plan</option>
                            </select>
                            <input value={item.label} onChange={e => updateDraftItem(idx, 'label', e.target.value)} placeholder="Label" className="col-span-3 bg-black border border-white/5 p-2 rounded-lg text-[9px]" />
                            {item.type === 'PLAN' ? (
                              <select value={item.planId || ''} onChange={e => updateDraftItem(idx, 'planId', e.target.value)} className="col-span-3 bg-black border border-white/5 p-2 rounded-lg text-[9px] font-bold">
                                <option value="">Select Plan...</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            ) : (
                              <input value={item.value} onChange={e => updateDraftItem(idx, 'value', e.target.value)} type="number" placeholder="Amt" className="col-span-3 bg-black border border-white/5 p-2 rounded-lg text-[9px]" />
                            )}
                            <input value={item.weight} onChange={e => updateDraftItem(idx, 'weight', e.target.value)} type="number" placeholder="W" className="col-span-2 bg-black border border-white/5 p-2 rounded-lg text-[9px]" />
                            <button onClick={() => setDraftItems(draftItems.filter((_, i) => i !== idx))} className="col-span-1 text-red-500/50 hover:text-red-500"><X size={14}/></button>
                         </div>
                       ))}
                       <div className="flex gap-2 pt-2">
                          <button onClick={saveLootItems} className="flex-1 bg-blue-600 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"><Save size={12}/> Save Table</button>
                          <button onClick={() => setEditingBoxId(null)} className="px-4 bg-white/5 py-2 rounded-xl text-[10px] font-black uppercase">Cancel</button>
                       </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 7. FINANCIAL LEDGER --- */}
        <section className="mt-12 bg-[#0a0a0c] border border-emerald-500/20 p-8 rounded-[2rem] shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-500"><CreditCard size={20} /></div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Financial Ledger</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Gross Revenue</p>
              <p className="text-3xl font-black text-emerald-500">₹{stats?.summary?.totalRevenue || 0}</p>
            </div>
            <div className="lg:col-span-2 space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Recent Successes</p>
              {stats?.finance?.recentTransactions?.map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 text-xs">
                    {/* Safe optional chaining to prevent crash if user is deleted */}
                    <span className="font-bold">@{tx.user?.username || 'deleted_user'}</span>
                    <span className="text-slate-500">{tx.plan?.name || 'Custom'}</span>
                    <span className="font-black text-emerald-500">₹{(tx.amount || 0) / 100}</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">{new Date(tx.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 8. SECURITY & REPORTS --- */}
        <section className="mt-12">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 italic uppercase text-red-500"><ShieldAlert /> Security Log</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-[#111318] rounded-[2rem] text-slate-600 uppercase font-black text-[10px]">Neural Shield Secure</div>
            ) : (
              reports.map((r: any) => (
                <div key={r.id} className="p-6 bg-[#111318]/50 border border-red-500/10 rounded-3xl flex justify-between items-center">
                  <div>
                    <p className="text-white font-bold text-sm">{r.reason}</p>
                    <p className="text-[9px] text-slate-500 uppercase">Target: {r.characterId?.substring(0, 8) || 'N/A'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: any) {
  return (
    <div className="bg-[#111318] border border-white/5 p-6 rounded-[2rem] shadow-2xl">
      <div className="mb-4 bg-white/5 w-fit p-3 rounded-2xl">{icon}</div>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-black italic tracking-tighter">{value || 0}</p>
        {sub && <span className="text-[10px] text-green-500 font-bold uppercase">{sub}</span>}
      </div>
    </div>
  );
}