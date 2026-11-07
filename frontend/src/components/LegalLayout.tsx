'use client';

import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-[#030708] text-white">
      <Sidebar />
      <main className="flex-1 p-6 md:p-12 lg:p-20 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group text-sm font-medium"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          
          <header className="mb-10 pb-6 border-b border-white/[0.08]">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">{title}</h1>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Last Updated: {lastUpdated}</p>
          </header>

          <div className="prose prose-invert max-w-none text-slate-300">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}