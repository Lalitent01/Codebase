'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { User, Plus, Trash2, Edit2, Loader2, Sparkles, Check } from 'lucide-react';

export default function PersonasPage({ hideSidebar = false }: { hideSidebar?: boolean }) {
  const router = useRouter();
  const { user } = useAuthStore();

  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchPersonas = useCallback(async () => {
    try {
      const res = await api.get('/auth/personas');
      setPersonas(res.data || []);
    } catch (e) { 
      console.error('Failed to load personas', e); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.push('/auth/login?redirect=/personas');
      return;
    }
    fetchPersonas();
  }, [router, fetchPersonas]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Please enter a persona name');

    setSaving(true);
    try {
      if (isEditing === 'new') {
        await api.post('/auth/personas', formData);
      } else {
        await api.patch(`/auth/personas/${isEditing}`, formData);
      }
      setIsEditing(null);
      setFormData({ name: '', description: '' });
      fetchPersonas();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error saving persona');
    } finally {
      setSaving(false);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await api.post(`/auth/personas/${id}/active`);
      fetchPersonas();
    } catch {
      alert('Failed to switch active persona');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this persona?')) return;
    try {
      await api.delete(`/auth/personas/${id}`);
      fetchPersonas();
    } catch {
      alert('Failed to delete persona');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#030708] text-white">
      {!hideSidebar && <Sidebar />}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto pb-24">
        <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Sparkles className="text-[#7be4d5]" size={24} /> My Personas
            </h1>
            <p className="text-slate-400 mt-1 text-xs md:text-sm">
              Define how characters perceive and talk to you ({personas.length}/5 slots used)
            </p>
          </div>

          {personas.length < 5 && (
            <button 
              type="button"
              onClick={() => { setIsEditing('new'); setFormData({ name: '', description: '' }); }}
              className="bg-[#7be4d5] hover:bg-[#6bd6c7] text-black px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs uppercase tracking-wider cursor-pointer"
            >
              <Plus size={16} /> New Persona
            </button>
          )}
        </header>

        {/* Editor Form */}
        {isEditing && (
          <div className="mb-10 bg-[#0a1013] border border-[#7be4d5]/30 p-6 rounded-3xl animate-in fade-in duration-200 shadow-2xl">
            <h2 className="text-lg font-bold mb-4 text-white">
              {isEditing === 'new' ? 'Create Persona' : 'Edit Persona'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Persona Name *
                </label>
                <input 
                  placeholder="e.g. Arjun, Kabir, College Senior, Secret Admirer" 
                  className="w-full bg-black/60 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-[#7be4d5] text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Backstory & Appearance (How characters should treat you) *
                </label>
                <textarea 
                  placeholder="Describe your appearance, personality, relationship to the character, or temperament..." 
                  rows={4}
                  className="w-full bg-black/60 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-[#7be4d5] text-sm resize-none leading-relaxed"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-[#7be4d5] text-black hover:bg-[#6bd6c7] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin text-black" />}
                  {saving ? 'Saving...' : 'Save Persona'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(null)} 
                  className="bg-white/5 hover:bg-white/10 px-6 py-2.5 rounded-xl font-bold text-xs text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
            <Loader2 size={24} className="animate-spin text-[#7be4d5]" />
            <span className="text-xs uppercase tracking-wider font-semibold">Loading personas...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {personas.map((p) => (
              <div 
                key={p.id} 
                className={`p-6 rounded-3xl border transition-all ${
                  p.isActive 
                    ? 'bg-[#0e1a1c] border-[#7be4d5]/40 shadow-lg shadow-[#7be4d5]/5' 
                    : 'bg-[#0a1013] border-white/[0.06]'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${p.isActive ? 'bg-[#7be4d5] text-black' : 'bg-white/5 text-slate-400'}`}>
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{p.name}</h3>
                      {p.isActive && (
                        <span className="text-[9px] bg-[#7be4d5]/20 text-[#7be4d5] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Active In Chat
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      type="button"
                      onClick={() => { setIsEditing(p.id); setFormData({ name: p.name, description: p.description }); }} 
                      className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition"
                      title="Edit persona"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDelete(p.id)} 
                      className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-rose-400 transition"
                      title="Delete persona"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-slate-400 text-xs line-clamp-3 mb-6 leading-relaxed">
                  {p.description || 'No backstory provided.'}
                </p>
                
                {!p.isActive && (
                  <button 
                    type="button"
                    onClick={() => handleSetActive(p.id)}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    Select This Persona
                  </button>
                )}
              </div>
            ))}

            {personas.length < 5 && (
              <div 
                onClick={() => { setIsEditing('new'); setFormData({ name: '', description: '' }); }}
                className="p-6 rounded-3xl border border-dashed border-white/10 hover:border-[#7be4d5]/40 hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px]"
              >
                <Plus className="text-[#7be4d5] mb-2" size={28} />
                <p className="text-sm font-bold text-slate-300">Add Persona ({personas.length}/5)</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Create diverse profiles to roleplay different ages, backgrounds, or relationship dynamics.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}