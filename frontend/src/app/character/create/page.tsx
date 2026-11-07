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
    language: 'HINGLISH', // Defaults to Hinglish for Suroor
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

  // Load existing character in Edit mode
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
            language: d.language || 'HINGLISH',
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
        return alert('Image is too large (maximum 2MB)');
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
      return alert('Please enter a First Greeting for your companion.');
    }
    setTab((prev) => Math.min(prev + 1, 3));
  };

  const handleSave = async () => {
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
    <div className="flex min-h-screen bg-[#030708] text-white">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-black mb-8 tracking-tight">
            {characterId ? 'Edit Character' : 'Create Character'}
          </h1>
          
          <div className="flex border-b border-white/[0.08] mb-8 gap-8 overflow-x-auto no-scrollbar">
            <TabHeader id={1} label="IDENTITY" active={tab === 1} valid={validations.identity()} onClick={(id) => setTab(id)} />
            <TabHeader id={2} label="VOICE & PERSONALITY" active={tab === 2} valid={validations.voice()} onClick={(id) => setTab(id)} />
            <TabHeader id={3} label="SETTINGS" active={tab === 3} valid={true} onClick={(id) => setTab(id)} />
          </div>

          <div className="bg-[#0a1013] p-8 rounded-3xl border border-white/[0.08] space-y-6 shadow-2xl relative">
            {(loading || isSaving) && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl gap-3">
                <Loader2 className="animate-spin text-[#7be4d5]" size={40} />
                <p className="text-xs uppercase font-bold tracking-widest text-slate-300">
                  {isSaving ? 'Saving Character...' : 'Loading Data...'}
                </p>
              </div>
            )}

            {tab === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col items-center gap-4 p-6 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                  <div className="w-24 h-24 rounded-2xl bg-[#152328] border border-white/10 overflow-hidden flex items-center justify-center">
                    {formData.avatar ? (
                      <img src={formData.avatar} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <UserIcon size={36} className="text-slate-500" />
                    )}
                  </div>
                  <label className="cursor-pointer bg-[#7be4d5] hover:bg-[#6bd6c7] text-black px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition">
                    Upload Avatar
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Display Name *" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} placeholder="e.g. Ananya, Kabir, Aisha" />
                  <div className="grid grid-cols-2 gap-3">
                    <Select label="Gender" value={formData.gender} options={['FEMALE', 'MALE', 'OTHER']} onChange={(v) => setFormData({ ...formData, gender: v })} />
                    <Select label="Language" value={formData.language} options={['HINGLISH', 'HINDI', 'ENGLISH']} onChange={(v) => setFormData({ ...formData, language: v })} />
                  </div>
                </div>

                <Field label="Short Hook *" value={formData.description} onChange={(v) => setFormData({ ...formData, description: v })} placeholder="A single-line intriguing intro that appears on the card" />

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Tags *</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((t) => (
                      <span key={t} className="bg-[#7be4d5]/10 text-[#7be4d5] border border-[#7be4d5]/20 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                        {t} 
                        <X size={12} className="cursor-pointer hover:text-rose-400 transition" onClick={() => removeTag(t)} />
                      </span>
                    ))}
                  </div>
                  <select 
                    value="" 
                    onChange={(e) => addTag(e.target.value)} 
                    className="w-full bg-black/60 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-[#7be4d5] cursor-pointer text-sm"
                  >
                    <option value="" disabled>+ Add Tag (e.g. Romance, College, Roommate)...</option>
                    {MASTER_TAGS.map((t) => (
                      <option key={t.id} value={t.label}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {tab === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Field label="First Greeting *" value={formData.greeting} onChange={(v) => setFormData({ ...formData, greeting: v })} placeholder="e.g. *smiles as you walk through the door* Arre tum aa gaye? I've been waiting for hours!" />
                <Textarea label="Core Personality *" value={formData.personality} onChange={(v) => setFormData({ ...formData, personality: v })} placeholder="Detailed behavioral traits, speaking nuances, emotional depth, secrets, and how they treat the user..." rows={8} />
              </div>
            )}

            {tab === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Textarea label="World Scenario (Optional)" value={formData.scenario} onChange={(v) => setFormData({ ...formData, scenario: v })} placeholder="Current setting, relationship history with user, room context..." rows={3} />
                <Textarea label="Example Dialogue (Optional)" value={formData.exampleDialogue} onChange={(v) => setFormData({ ...formData, exampleDialogue: v })} placeholder="<START>\nUser: How was your day?\nChar: *sighs and sits close* Tum the nahi toh boring hi tha na..." rows={4} />
                
                <div className="pt-4 border-t border-white/[0.08] space-y-4">
                  <Toggle 
                    label="Request Public Listing" 
                    sub="Character will be reviewed by admin to appear on the public explore feed." 
                    checked={formData.isPublicRequest} 
                    onChange={(v) => setFormData({ ...formData, isPublicRequest: v })} 
                    icon={<Globe size={18} className="text-[#7be4d5]" />} 
                  />
                  <Toggle 
                    label="Unfiltered (18+)" 
                    sub="Allows mature romantic roleplay and uncensored sensory expressions." 
                    checked={formData.unfiltered} 
                    onChange={(v) => setFormData({ ...formData, unfiltered: v })} 
                    icon={<Lock size={18} className="text-rose-400" />} 
                    color="text-rose-400" 
                  />
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-white/[0.08] flex justify-between items-center">
              <button 
                type="button" 
                onClick={() => setTab((t) => Math.max(1, t - 1))} 
                className="text-slate-400 font-semibold text-xs uppercase hover:text-white transition"
              >
                Back
              </button>
              <div className="flex items-center gap-4">
                {tab < 3 ? (
                  <button 
                    type="button" 
                    onClick={handleNext} 
                    className="bg-[#7be4d5] text-black px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition hover:bg-[#6bd6c7]"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="bg-[#7be4d5] text-black hover:bg-[#6bd6c7] disabled:opacity-50 px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition active:scale-95"
                  >
                    {characterId ? 'Save Changes' : 'Create Character'}
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
      className={`pb-3 text-xs font-bold tracking-wider border-b-2 transition-all flex items-center gap-2 ${
        active ? 'text-[#7be4d5] border-[#7be4d5]' : 'text-slate-500 border-transparent hover:text-slate-300'
      }`}
    >
      {!valid && <AlertCircle size={14} className="text-amber-400" />}
      {label}
    </button>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">{label}</label>
      <input 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder} 
        className="w-full bg-black/60 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-[#7be4d5] transition-colors text-sm" 
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; rows: number }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">{label}</label>
      <textarea 
        rows={rows} 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder} 
        className="w-full bg-black/60 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-[#7be4d5] resize-none transition-colors text-sm leading-relaxed" 
      />
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full bg-black/60 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-[#7be4d5] cursor-pointer text-sm"
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
    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-white/5 rounded-xl">{icon}</div>
        <div>
          <p className={`text-sm font-semibold ${color}`}>{label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
        </div>
      </div>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
        className="w-5 h-5 rounded accent-[#7be4d5] cursor-pointer" 
      />
    </div>
  );
}