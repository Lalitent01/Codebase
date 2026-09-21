'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { User, Plus, Trash2, Edit2, Sparkles, Loader2 } from 'lucide-react';

export default function PersonasPage({ hideSidebar = false }: { hideSidebar?: boolean }) {
  const router = useRouter(); // FIX: Added missing router
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
    if (!confirm('Are you sure you want to delete this identity?')) return;
    try {
      await api.delete(`/auth/personas/${id}`);
      fetchPersonas();
    } catch {
      alert('Failed to delete persona');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0c] text-white">
      {!hideSidebar && <Sidebar />}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Identities</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Manage the personas you use in your stories. ({personas.length}/5 slots used)
            </p>
          </div>

          {personas.length < 5 && (
            <button 
              type="button"
              onClick={() => { setIsEditing('new'); setFormData({ name: '', description: '' }); }}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition text-sm cursor-pointer"
            >
              <Plus size={18} /> Create New
            </button>
          )}
        </header>

        {/* Editor Form */}
        {isEditing && (
          <div className="mb-10 bg-[#111318] border border-blue-500/30 p-6 rounded-3xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4">{isEditing === 'new' ? 'New Persona' : 'Edit Persona'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input 
                placeholder="Persona Name (e.g. Hero, Student, Cyber-Detective)" 
                className="w-full bg-[#16191f] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <textarea 
                placeholder="Description (How do you look? What is your personality? Your backstory?)" 
                rows={4}
                className="w-full bg-[#16191f] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 text-sm resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
              <div className="flex gap-3">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? 'Saving...' : 'Save Persona'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(null)} 
                  className="bg-white/5 hover:bg-white/10 px-8 py-3 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
            <Loader2 size={24} className="animate-spin text-blue-500" />
            <span>Loading identities...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {personas.map((p) => (
              <div 
                key={p.id} 
                className={`p-6 rounded-3xl border transition-all ${
                  p.isActive ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-900/20' : 'bg-[#111318] border-white/5'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${p.isActive ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500'}`}>
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{p.name}</h3>
                      {p.isActive && (
                        <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                          Active Identity
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => { setIsEditing(p.id); setFormData({ name: p.name, description: p.description }); }} 
                      className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white"
                      title="Edit persona"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDelete(p.id)} 
                      className="p-2 hover:bg-white/5 rounded-lg text-red-500/50 hover:text-red-500"
                      title="Delete persona"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-slate-400 text-sm line-clamp-3 mb-6 leading-relaxed">
                  {p.description || 'No backstory provided.'}
                </p>
                
                {!p.isActive && (
                  <button 
                    type="button"
                    onClick={() => handleSetActive(p.id)}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition cursor-pointer"
                  >
                    Switch to this Identity
                  </button>
                )}
              </div>
            ))}

            {personas.length < 5 && (
              <div 
                onClick={() => { setIsEditing('new'); setFormData({ name: '', description: '' }); }}
                className="p-6 rounded-3xl border border-dashed border-white/10 hover:border-blue-500/40 hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px]"
              >
                <Plus className="text-blue-500 mb-2" size={32} />
                <p className="text-sm font-bold text-slate-300">Add Identity ({personas.length}/5)</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Create different personas to roleplay distinct personalities and backgrounds.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}