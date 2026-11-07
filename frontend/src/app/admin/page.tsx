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
  const [newBox, setNewBox] = useState({ name: '', color: 'teal' });

  // Advanced Loot Editor State
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      // Endpoints aligned with backend AdminController (@Controller('admin'))
      const results = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/reports'),
        api.get('/admin/pending-review'),
        api.get('/analytics/rewards/active'),
        api.get('/admin/quests'),
        api.get('/admin/available-boxes'),
        api.get('/admin/plans'),
        api.get('/admin/users'),
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
      console.error('Admin data fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchData();
  }, [user, router, fetchData]);

  // --- ACTIONS ---

  const handleStatusUpdate = async (id: string, status: 'PUBLIC' | 'REJECTED') => {
    const note = status === 'REJECTED' ? (prompt('Reason for rejection:') || '') : '';
    if (status === 'REJECTED' && !note.trim()) return;

    try {
      await api.patch(`/admin/characters/${id}/status`, { status, note });
      fetchData();
    } catch (e) {
      alert('Failed to update character status');
    }
  };

  const handleToggleBan = async (u: any) => {
    const isBanning = !u.isBanned;
    let reason = '';
    if (isBanning) {
      reason = prompt('Reason for suspending user account:') || 'Violating community guidelines.';
      if (!reason.trim()) return;
    }
    
    if (confirm(`${isBanning ? 'SUSPEND' : 'RESTORE'} account @${u.username}?`)) {
      try {
        await api.patch(`/admin/users/${u.id}/ban`, { isBanned: isBanning, reason });
        fetchData();
      } catch (e) {
        alert('Failed to update user status');
      }
    }
  };

  const handleAddReward = async () => {
    const days = parseInt(newReward.days, 10);
    if (!newReward.label.trim() || isNaN(days) || days <= 0) {
      alert('Please provide a valid tier label and days count');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/admin/rewards', { 
        label: newReward.label.trim(), 
        daysRequired: days, 
        rewardType: newReward.type,
        creditsGiven: newReward.type === 'CREDITS' ? parseInt(newReward.credits, 10) || 0 : null,
        lootBoxId: newReward.type === 'CHEST' ? newReward.boxId : null,
      });
      setNewReward({ label: '', days: '', credits: '', type: 'CREDITS', boxId: '' });
      fetchData();
    } catch {
      alert('Error creating reward tier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddQuest = async () => {
    const goal = parseInt(newQuest.goal, 10);
    if (!newQuest.title.trim() || isNaN(goal) || goal <= 0) {
      alert('Please provide a valid quest title and numeric goal value');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/admin/quests', {
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
      await api.post(`/admin/loot-boxes/${editingBoxId}/items`, { items: draftItems });
      setEditingBoxId(null);
      fetchData();
    } catch { 
      alert('Error saving drop table items'); 
    }
  };

  const handleDeleteBox = async (id: string) => {
    if (!confirm('Are you sure you want to delete this loot box?')) return;
    try {
      await api.delete(`/admin/loot-boxes/${id}`);
      fetchData();
    } catch {
      alert('Failed to delete box');
    }
  };

  if (loading) {
    return (
      <div className="bg-[#030708] min-h-screen text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#7be4d5]" size={36} />
        <p className="text-slate-400 tracking-widest text-xs uppercase font-medium">Loading Suroor Admin Panel...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#030708] text-white">
      <Sidebar />
      <main className="p-8 flex-1 overflow-y-auto pb-40">
        <header className="mb-10 flex flex-wrap justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">
              Suroor <span className="text-[#7be4d5]">Admin Hub</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-semibold">
              Platform Governance, Character Reviews & Economy Management
            </p>
          </div>
          <div className="bg-[#7be4d5]/10 border border-[#7be4d5]/20 px-6 py-3 rounded-2xl text-right">
             <p className="text-[10px] text-[#7be4d5] font-bold uppercase tracking-wider mb-0.5">Visitor Conversion</p>
             <p className="text-2xl font-black text-white">{stats?.funnel?.conversionRate || 0}%</p>
          </div>
        </header>

        {/* --- 1. CORE METRICS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard icon={<Users className="text-[#7be4d5]" />} label="Total Users" value={stats?.summary?.totalUsers} sub={`+${stats?.summary?.todaySignups || 0} today`} />
          <StatCard icon={<MessageSquare className="text-emerald-400" />} label="Total Messages" value={stats?.summary?.totalMessages} />
          <StatCard icon={<BarChart3 className="text-indigo-400" />} label="User Engagement" value={`${stats?.summary?.stickiness || 0}%`} />
          <StatCard icon={<ShieldAlert className="text-rose-400" />} label="Pending Reports" value={reports.length} />
        </div>

        {/* --- 2. USER MANAGEMENT --- */}
        <section className="mb-12">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-wide text-emerald-400">
            <Users size={20} /> User Directory
          </h2>
          <div className="bg-[#0b1215] border border-white/[0.06] rounded-3xl p-6 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-white/[0.06]">
                    <th className="pb-4 pl-4">User</th>
                    <th className="pb-4">Email</th>
                    <th className="pb-4">Account Status</th>
                    <th className="pb-4">Joined Date</th>
                    <th className="pb-4 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#152328] flex items-center justify-center font-bold text-xs text-[#7be4d5] uppercase">
                            {u.username?.[0] || '?'}
                          </div>
                          <span className="text-sm font-semibold">@{u.username}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-slate-400">{u.email}</td>
                      <td className="py-4">
                        {u.isBanned ? (
                          <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-full font-bold uppercase">Suspended</span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-bold uppercase">Active</span>
                        )}
                      </td>
                      <td className="py-4 text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 pr-4 text-right">
                        <button 
                          onClick={() => handleToggleBan(u)}
                          className={`p-2 rounded-xl transition-colors ${u.isBanned ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'}`}
                          title={u.isBanned ? 'Unban User' : 'Suspend User'}
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

        {/* --- 3. CHARACTER APPROVAL QUEUE --- */}
        <section className="mb-12">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-wide text-amber-400">
            <Clock size={20} /> Character Review Queue
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {pendingBots.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-[#0b1215] border border-white/[0.06] rounded-3xl text-slate-500 font-bold uppercase text-xs">
                No characters pending approval
              </div>
            ) : (
              pendingBots.map((bot: any) => (
                <div key={bot.id} className="p-6 bg-[#0b1215] border border-white/[0.06] rounded-3xl flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#152328] flex items-center justify-center font-black text-lg text-[#7be4d5] uppercase">
                      {bot.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{bot.name}</p>
                      <p className="text-xs text-[#7be4d5] font-medium">by @{bot.creator?.username || 'unknown'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => router.push(`/character/${bot.id}`)} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white transition" title="Preview Profile"><ExternalLink size={18} /></button>
                    <button onClick={() => handleStatusUpdate(bot.id, 'PUBLIC')} className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 hover:bg-emerald-500 hover:text-black transition" title="Approve & Publish"><Check size={18} /></button>
                    <button onClick={() => handleStatusUpdate(bot.id, 'REJECTED')} className="p-3 bg-rose-500/10 rounded-xl text-rose-400 hover:bg-rose-500 hover:text-white transition" title="Reject"><XCircle size={18} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* --- 4. QUEST FACTORY --- */}
        <section className="mb-12">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-wide text-indigo-400">
            <ListChecks size={20} /> Quests & Engagement Objectives
          </h2>
          <div className="bg-[#0b1215] p-8 rounded-3xl border border-white/[0.06]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input value={newQuest.title} onChange={e => setNewQuest({...newQuest, title: e.target.value})} placeholder="Quest Title (e.g. Chat with 3 Characters)" className="bg-black/60 border border-white/10 p-3.5 rounded-xl text-sm outline-none focus:border-[#7be4d5]" />
              <input value={newQuest.description} onChange={e => setNewQuest({...newQuest, description: e.target.value})} placeholder="Description" className="bg-black/60 border border-white/10 p-3.5 rounded-xl text-sm outline-none focus:border-[#7be4d5]" />
              <select value={newQuest.trigger} onChange={e => setNewQuest({...newQuest, trigger: e.target.value as any})} className="bg-black/60 border border-white/10 p-3.5 rounded-xl text-sm outline-none focus:border-[#7be4d5]">
                <option value="MESSAGE_COUNT">Message Count</option>
                <option value="UNIQUE_CHARACTERS">Unique Characters</option>
                <option value="DAILY_LOGIN">Daily Login</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <select value={newQuest.rType} onChange={e => setNewQuest({...newQuest, rType: e.target.value as any})} className="bg-black/60 border border-white/10 p-3.5 rounded-xl text-sm outline-none focus:border-[#7be4d5]">
                <option value="CREDITS">Sparks / Credits</option>
                <option value="CHEST">Loot Box</option>
              </select>
              {newQuest.rType === 'CHEST' ? (
                <select value={newQuest.boxId} onChange={e => setNewQuest({...newQuest, boxId: e.target.value})} className="bg-black/60 border border-white/10 p-3.5 rounded-xl text-sm outline-none focus:border-[#7be4d5]">
                  <option value="">Select Chest...</option>
                  {lootBoxes.map(lb => <option key={lb.id} value={lb.id}>{lb.name}</option>)}
                </select>
              ) : (
                <input value={newQuest.reward} onChange={e => setNewQuest({...newQuest, reward: e.target.value})} type="number" placeholder="Sparks Given" className="bg-black/60 border border-white/10 p-3.5 rounded-xl text-sm outline-none focus:border-[#7be4d5]" />
              )}
              <input value={newQuest.goal} onChange={e => setNewQuest({...newQuest, goal: e.target.value})} type="number" placeholder="Goal Threshold (e.g. 10)" className="bg-black/60 border border-white/10 p-3.5 rounded-xl text-sm outline-none focus:border-[#7be4d5]" />
            </div>
            <button 
              disabled={isSubmitting}
              onClick={handleAddQuest} 
              className="w-full bg-[#7be4d5] text-black hover:bg-[#6bd6c7] disabled:opacity-50 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all"
            >
              {isSubmitting ? 'Creating Quest...' : 'Publish Quest'}
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
               {quests.map((q: any) => (
                 <div key={q.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold text-sm">{q.title}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-mono">{q.trigger} | Goal: {q.goalValue}</p>
                    </div>
                    <button onClick={async () => { await api.delete(`/admin/quests/${q.id}`); fetchData(); }} className="text-slate-500 hover:text-rose-400 transition-colors"><Trash2 size={16}/></button>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* --- 5. STREAK & RETENTION REWARDS --- */}
        <section className="mb-12">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-wide text-[#7be4d5]">
            <Sparkles size={20} /> Daily Login Streaks
          </h2>
          <div className="bg-[#0b1215] border border-white/[0.06] rounded-3xl p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 bg-black/40 p-4 rounded-2xl border border-white/5">
              <input value={newReward.label} onChange={e => setNewReward({...newReward, label: e.target.value})} placeholder="Label (e.g. Day 1 Welcome)" className="bg-black/60 border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-[#7be4d5]" />
              <input value={newReward.days} onChange={e => setNewReward({...newReward, days: e.target.value})} type="number" placeholder="Day Number (1-7)" className="bg-black/60 border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-[#7be4d5]" />
              <select value={newReward.type} onChange={e => setNewReward({...newReward, type: e.target.value as any})} className="bg-black/60 border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-[#7be4d5]">
                <option value="CREDITS">Sparks / Credits</option>
                <option value="CHEST">Loot Box</option>
              </select>
              {newReward.type === 'CHEST' ? (
                <select value={newReward.boxId} onChange={e => setNewReward({...newReward, boxId: e.target.value})} className="bg-black/60 border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-[#7be4d5]">
                  <option value="">Select Box...</option>
                  {lootBoxes.map(lb => <option key={lb.id} value={lb.id}>{lb.name}</option>)}
                </select>
              ) : (
                <input value={newReward.credits} onChange={e => setNewReward({...newReward, credits: e.target.value})} type="number" placeholder="Sparks Amount" className="bg-black/60 border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-[#7be4d5]" />
              )}
              <button 
                disabled={isSubmitting}
                onClick={handleAddReward} 
                className="bg-[#7be4d5] text-black hover:bg-[#6bd6c7] disabled:opacity-50 p-3 rounded-xl font-bold text-xs uppercase transition-all"
              >
                Add Rule
              </button>
            </div>
            <div className="space-y-2">
               {rewardTiers.map((rt: any) => (
                 <div key={rt.id} className="flex justify-between items-center p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl border border-white/5 transition-colors">
                    <div className="flex gap-8 items-center">
                      <span className="text-xs font-bold uppercase text-white w-28">{rt.label}</span>
                      <span className="text-[11px] font-medium text-slate-400">Day {rt.daysRequired}</span>
                      <span className="text-[11px] font-bold text-[#7be4d5]">
                        {rt.rewardType === 'CHEST' ? `🎁 ${rt.lootBox?.name || 'Box'}` : `+${rt.creditsGiven || 0} Sparks`}
                      </span>
                    </div>
                    <button onClick={async () => { await api.delete(`/admin/rewards/${rt.id}`); fetchData(); }} className="text-slate-500 hover:text-rose-400"><Trash2 size={16}/></button>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* --- 6. LOOT BOXES & REWARD TABLES --- */}
        <section className="mb-12">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-wide text-rose-400">
            <Gift size={20} /> Vault & Loot Boxes
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#0b1215] p-6 rounded-3xl border border-white/[0.06] h-fit shadow-2xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Create New Loot Box</h3>
              <div className="space-y-4">
                <input value={newBox.name} onChange={e => setNewBox({...newBox, name: e.target.value})} placeholder="Box Name (e.g. Royal Mehfil Chest)" className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#7be4d5]" />
                <select value={newBox.color} onChange={e => setNewBox({...newBox, color: e.target.value})} className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-sm font-semibold outline-none focus:border-[#7be4d5]">
                   <option value="teal">Teal (Special)</option>
                   <option value="blue">Blue (Common)</option>
                   <option value="purple">Purple (Rare)</option>
                   <option value="gold">Gold (Legendary)</option>
                </select>
                <button 
                  onClick={async () => { 
                    if (!newBox.name.trim()) return alert('Box name required');
                    await api.post('/admin/loot-boxes', newBox); 
                    setNewBox({ name: '', color: 'teal' });
                    fetchData(); 
                  }} 
                  className="w-full bg-[#7be4d5] text-black hover:bg-[#6bd6c7] py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all"
                >
                  Save Box
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {lootBoxes.map(box => (
                <div key={box.id} className="bg-[#0b1215] p-6 rounded-3xl border border-white/[0.06] shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="font-bold uppercase text-white">{box.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{box.items?.length || 0} Drop Outcomes Configured</p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => openLootEditor(box)} className="p-2 bg-white/5 rounded-xl text-[#7be4d5] hover:bg-[#7be4d5] hover:text-black transition-all" title="Edit Drops"><Settings2 size={18} /></button>
                       <button onClick={() => handleDeleteBox(box.id)} className="p-2 bg-white/5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Delete Box"><Trash2 size={18} /></button>
                    </div>
                  </div>

                  {editingBoxId === box.id && (
                    <div className="space-y-4 bg-black/60 p-4 rounded-2xl border border-[#7be4d5]/20 animate-in fade-in duration-200">
                       <div className="flex justify-between items-center mb-2">
                          <p className="text-[10px] font-bold text-[#7be4d5] uppercase tracking-wider">Drop Probability Configuration</p>
                          <button onClick={addDraftRow} className="text-[#7be4d5] hover:underline text-xs flex items-center gap-1"><Plus size={14}/> Add Row</button>
                       </div>
                       {draftItems.map((item, idx) => (
                         <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                            <select value={item.type} onChange={e => updateDraftItem(idx, 'type', e.target.value)} className="col-span-3 bg-[#0b1215] border border-white/10 p-2 rounded-lg text-xs">
                               <option value="CREDITS">Sparks</option>
                               <option value="PLAN">Plan / Pass</option>
                            </select>
                            <input value={item.label} onChange={e => updateDraftItem(idx, 'label', e.target.value)} placeholder="Display Label" className="col-span-3 bg-[#0b1215] border border-white/10 p-2 rounded-lg text-xs" />
                            {item.type === 'PLAN' ? (
                              <select value={item.planId || ''} onChange={e => updateDraftItem(idx, 'planId', e.target.value)} className="col-span-3 bg-[#0b1215] border border-white/10 p-2 rounded-lg text-xs">
                                <option value="">Select Plan...</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            ) : (
                              <input value={item.value} onChange={e => updateDraftItem(idx, 'value', e.target.value)} type="number" placeholder="Sparks" className="col-span-3 bg-[#0b1215] border border-white/10 p-2 rounded-lg text-xs" />
                            )}
                            <input value={item.weight} onChange={e => updateDraftItem(idx, 'weight', e.target.value)} type="number" placeholder="Weight" title="Higher weight = higher probability" className="col-span-2 bg-[#0b1215] border border-white/10 p-2 rounded-lg text-xs" />
                            <button onClick={() => setDraftItems(draftItems.filter((_, i) => i !== idx))} className="col-span-1 text-slate-500 hover:text-rose-400"><X size={16}/></button>
                         </div>
                       ))}
                       <div className="flex gap-2 pt-2">
                          <button onClick={saveLootItems} className="flex-1 bg-[#7be4d5] text-black py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5"><Save size={14}/> Save Probabilities</button>
                          <button onClick={() => setEditingBoxId(null)} className="px-4 bg-white/5 py-2 rounded-xl text-xs font-bold uppercase hover:bg-white/10">Cancel</button>
                       </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 7. FINANCIAL REVENUE --- */}
        <section className="mt-12 bg-[#0b1215] border border-emerald-500/20 p-8 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400"><CreditCard size={20} /></div>
            <h2 className="text-lg font-black uppercase tracking-wide">Financial Overview</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Gross Revenue</p>
              <p className="text-3xl font-black text-emerald-400">₹{stats?.summary?.totalRevenue || 0}</p>
            </div>
            <div className="lg:col-span-2 space-y-2.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Recent Successful Purchases</p>
              {stats?.finance?.recentTransactions?.map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center p-3.5 bg-black/40 rounded-xl border border-white/5 text-xs">
                    <span className="font-semibold text-white">@{tx.user?.username || 'deleted_user'}</span>
                    <span className="text-slate-400">{tx.plan?.name || 'Subscription'}</span>
                    <span className="font-bold text-emerald-400">₹{(tx.amount || 0) / 100}</span>
                    <span className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 8. REPORTS & SAFETY LOG --- */}
        <section className="mt-12">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-wide text-rose-400">
            <ShieldAlert size={20} /> Moderation & Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-[#0b1215] border border-white/[0.06] rounded-3xl text-slate-500 font-bold uppercase text-xs">
                All Clear (No Open Reports)
              </div>
            ) : (
              reports.map((r: any) => (
                <div key={r.id} className="p-5 bg-[#0b1215] border border-rose-500/10 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium text-sm">{r.reason}</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Character ID: {r.characterId?.substring(0, 12) || 'N/A'}</p>
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
    <div className="bg-[#0b1215] border border-white/[0.06] p-6 rounded-3xl shadow-xl">
      <div className="mb-4 bg-white/5 w-fit p-3 rounded-2xl">{icon}</div>
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-black text-white">{value || 0}</p>
        {sub && <span className="text-[10px] text-emerald-400 font-bold">{sub}</span>}
      </div>
    </div>
  );
}