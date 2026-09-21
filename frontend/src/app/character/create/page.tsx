'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/axios';
import Sidebar from '@/components/Sidebar';
import { 
  Globe, X, ChevronRight, AlertCircle, 
  Loader2, Lock, User as UserIcon 
} from 'lucide-react';
import { MASTER_TAGS } from '@/constants/tags';
import { useAuthStore } from '@/store/useAuthStore';

export default function CreateCharacterPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const characterId = Array.isArray(rawId) ? rawId[0] : rawId;

  const { user } = useAuthStore();
  const [tab, setTab] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: '',
    personality: '',
    greeting: '',
    scenario: '',
    exampleDialogue: '',
    tags: [] as string[],
    gender: 'OTHER',
    language: 'ENGLISH',
    unfiltered: false,
    isPublicRequest: false,
  });

  const isInitializing = useRef(false);

  // Authentication Guard
  useEffect(() => {
    if (user === null) {
      router.push('/auth/login?redirect=/character/create');
    }
  }, [user, router]);

  // Load existing character if in Edit mode
  useEffect(() => {
    if (characterId && !isInitializing.current) {
      isInitializing.current = true;
      setLoading(true);

      api.get(`/characters/${characterId}`)
        .then((res) => {
          const d = res.data;
          setFormData({
            name: d.name || '',
            description: d.description || '',
            avatar: d.avatar || '',
            personality: d.personality || '',
            greeting: d.greeting || '',
            scenario: d.scenario || '',
            exampleDialogue: d.exampleDialogue || '',
            tags: Array.isArray(d.tags) ? d.tags : [],
            gender: d.gender || 'OTHER',
            language: d.language || 'ENGLISH',
            unfiltered: Boolean(d.unfiltered),
            isPublicRequest: d.status === 'PENDING' || d.status === 'PUBLIC',
          });
        })
        .catch(() => {
          alert('Could not load character details.');
          router.push('/profile');
        })
        .finally(() => setLoading(false));
    }
  }, [characterId, router]);

  const validations = {
    identity: () => formData.name.trim() !== '' && formData.description.trim() !== '' && formData.tags.length > 0,
    voice: () => formData.greeting.trim() !== '',
    mind: () => formData.personality.trim() !== '',
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        return alert('Please select a valid image file.');
      }
      if (file.size > 2 * 1024 * 1024) {
        return alert('Image too large (max 2MB)');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (tab === 1 && !validations.identity()) {
      return alert('Please fill in Display Name, Hook, and at least one Tag.');
    }
    if (tab === 2 && !validations.voice()) {
      return alert('Please enter a First Greeting for your character.');
    }
    setTab((prev) => Math.min(prev + 1, 3));
  };

  const handleBirthOrUpdate = async () => {
    if (!validations.identity() || !validations.voice() || !validations.mind()) {
      return alert('Please fill in all mandatory fields before saving.');
    }

    setIsSaving(true);
    try {
      if (characterId) {
        await api.patch(`/characters/${characterId}`, formData);
        router.push(`/character/${characterId}`);
      } else {
        const res = await api.post('/characters', formData);
        router.push(`/character/${res.data.id || ''}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error saving character. Please try again.';
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = (t: string) => {
    if (!t) return;
    if (!formData.tags.includes(t)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, t] }));
    }
  };

  const removeTag = (t: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== t) }));
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0c] text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-black mb-10 flex items-center gap-3 italic text-blue-500 uppercase tracking-tighter">
            {characterId ? 'Update Character' : 'Character Studio'}
          </h1>
          
          <div className="flex border-b border-white/5 mb-8 gap-8 overflow-x-auto no-scrollbar">
            <TabHeader id={1} label="IDENTITY" active={tab === 1} valid={validations.identity()} onClick={(id) => setTab(id)} />
            <TabHeader id={2} label="VOICE" active={tab === 2} valid={validations.voice()} onClick={(id) => setTab(id)} />
            <TabHeader id={3} label="SETTINGS" active={tab === 3} valid={true} onClick={(id) => setTab(id)} />
          </div>

          <div className="bg-[#111318] p-8 rounded-3xl border border-white/5 space-y-6 shadow-2xl relative">
            {(loading || isSaving) && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl gap-3">
                <Loader2 className="animate-spin text-blue-500" size={40} />
                <p className="text-xs uppercase font-bold tracking-widest text-slate-400">
                  {isSaving ? 'Binding Neural DNA...' : 'Loading Data...'}
                </p>
              </div>
            )}

            {tab === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col items-center gap-4 p-6 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                  <div className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-white/10 overflow-hidden flex items-center justify-center">
                    {formData.avatar ? (
                      <img src={formData.avatar} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <UserIcon size={40} className="text-slate-600" />
                    )}
                  </div>
                  <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all">
                    UPLOAD AVATAR
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Display Name *" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} placeholder="Character Name" />
                  <div className="grid grid-cols-2 gap-4">
                    <Select label="Gender" value={formData.gender} options={['MALE', 'FEMALE', 'OTHER']} onChange={(v) => setFormData({ ...formData, gender: v })} />
                    <Select label="Language" value={formData.language} options={['ENGLISH', 'HINDI', 'HINGLISH']} onChange={(v) => setFormData({ ...formData, language: v })} />
                  </div>
                </div>

                <Field label="Short Hook *" value={formData.description} onChange={(v) => setFormData({ ...formData, description: v })} placeholder="One sentence description" />

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Tags *</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.tags.map((t) => (
                      <span key={t} className="bg-blue-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-2">
                        {t} 
                        <X size={12} className="cursor-pointer hover:text-red-300 transition-colors" onClick={() => removeTag(t)} />
                      </span>
                    ))}
                  </div>
                  <select 
                    value="" 
                    onChange={(e) => addTag(e.target.value)} 
                    className="w-full bg-[#16191f] border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-blue-500/50 cursor-pointer text-sm"
                  >
                    <option value="" disabled>+ Add Tag...</option>
                    {MASTER_TAGS.map((t) => (
                      <option key={t.id} value={t.label}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {tab === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Field label="First Greeting *" value={formData.greeting} onChange={(v) => setFormData({ ...formData, greeting: v })} placeholder="Their first message to users" />
                <Textarea label="Core Personality *" value={formData.personality} onChange={(v) => setFormData({ ...formData, personality: v })} placeholder="Behavioral traits, background, secret desires..." rows={10} />
              </div>
            )}

            {tab === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Textarea label="Scenario (Optional)" value={formData.scenario} onChange={(v) => setFormData({ ...formData, scenario: v })} placeholder="Current setting and world context..." rows={3} />
                <Textarea label="Example Dialogue (Optional)" value={formData.exampleDialogue} onChange={(v) => setFormData({ ...formData, exampleDialogue: v })} placeholder="<START>\nUser: Hi\nChar: Hey..." rows={4} />
                
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <Toggle 
                    label="Request Public Listing" 
                    sub="Bot will stay private until Admin approves it into Discovery." 
                    checked={formData.isPublicRequest} 
                    onChange={(v) => setFormData({ ...formData, isPublicRequest: v })} 
                    icon={<Globe size={16} />} 
                  />
                  <Toggle 
                    label="Unfiltered (18+)" 
                    sub="Enables mature roleplay and uncensored interactions." 
                    checked={formData.unfiltered} 
                    onChange={(v) => setFormData({ ...formData, unfiltered: v })} 
                    icon={<Lock size={16} className="text-red-500" />} 
                    color="text-red-400" 
                  />
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-white/5 flex justify-between items-center">
              <button 
                type="button" 
                onClick={() => setTab((t) => Math.max(1, t - 1))} 
                className="text-slate-500 font-bold text-xs uppercase hover:text-white transition"
              >
                Back
              </button>
              <div className="flex items-center gap-4">
                {tab < 3 ? (
                  <button 
                    type="button" 
                    onClick={handleNext} 
                    className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition"
                  >
                    Next <ChevronRight size={18} />
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleBirthOrUpdate} 
                    disabled={isSaving} 
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-10 py-3 rounded-xl font-black text-xs tracking-widest shadow-lg active:scale-95 uppercase transition"
                  >
                    {characterId ? 'Update Soul' : 'Birth Character'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TabHeader({ id, label, active, valid, onClick }: { id: number; label: string; active: boolean; valid: boolean; onClick: (id: number) => void }) {
  return (
    <button 
      type="button" 
      onClick={() => onClick(id)} 
      className={`pb-4 text-[10px] font-black tracking-widest border-b-2 transition-all flex items-center gap-2 ${
        active ? 'text-blue-500 border-blue-500' : 'text-slate-600 border-transparent hover:text-slate-400'
      }`}
    >
      {!valid && <AlertCircle size={12} className="text-orange-500" />}
      {label}
    </button>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">{label}</label>
      <input 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder} 
        className="w-full bg-[#16191f] border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-colors text-sm" 
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; rows: number }) {
  return (
    <div>
      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">{label}</label>
      <textarea 
        rows={rows} 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder} 
        className="w-full bg-[#16191f] border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-blue-500/50 resize-none transition-colors text-sm" 
      />
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full bg-[#16191f] border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-blue-500/50 cursor-pointer text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, sub, checked, onChange, icon, color = 'text-white' }: { label: string; sub: string; checked: boolean; onChange: (v: boolean) => void; icon: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/5 rounded-lg text-slate-400">{icon}</div>
        <div>
          <p className={`text-sm font-bold ${color}`}>{label}</p>
          <p className="text-[10px] text-slate-500">{sub}</p>
        </div>
      </div>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
        className="w-5 h-5 rounded accent-blue-600 cursor-pointer" 
      />
    </div>
  );
}