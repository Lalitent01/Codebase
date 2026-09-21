'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Footer() {
  const pathname = usePathname();

  // Hide footer in full-screen chat sessions or admin dashboard
  if (pathname.startsWith('/chat/') || pathname.startsWith('/admin')) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#050505] border-t border-white/5 py-10 mt-auto">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
          © {currentYear} AI.CHAT (SUROOR). All rights reserved.
        </p>
        
        <div className="flex flex-wrap justify-center gap-6 text-[10px] text-slate-400 font-black uppercase tracking-widest">
          <Link href="/contact" className="hover:text-blue-500 transition-colors">Contact</Link>
          <Link href="/terms" className="hover:text-blue-500 transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-blue-500 transition-colors">Privacy</Link>
          <Link href="/refund-policy" className="hover:text-blue-500 transition-colors text-blue-500/80">Refunds</Link>
        </div>
      </div>
    </footer>
  );
}