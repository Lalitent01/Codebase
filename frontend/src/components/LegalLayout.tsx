'use client';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
export default function LegalLayout({ title, lastUpdated, children }: { title: string, lastUpdated: string, children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-20 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-white mb-10 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          
          <header className="mb-12">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">{title}</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Last Updated: {lastUpdated}</p>
          </header>

          <div className="prose prose-invert prose-slate max-w-none 
            prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter
            prose-p:text-slate-400 prose-p:leading-relaxed
            prose-li:text-slate-400
            prose-strong:text-white prose-strong:font-bold">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}