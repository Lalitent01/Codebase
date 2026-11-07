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
    <footer className="bg-[#030708] border-t border-white/[0.08] py-12 mt-auto text-white">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* SEO LINK DIRECTORY MATRIX */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-white/[0.06] text-xs">
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px] text-[#7be4d5]">
              Indian AI Languages
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/?language=HINGLISH" className="hover:text-white transition">Hinglish AI Chat</Link></li>
              <li><Link href="/?language=HINDI" className="hover:text-white transition">Hindi AI Chat (हिंदी)</Link></li>
              <li><Link href="/?language=ENGLISH" className="hover:text-white transition">English AI Chat</Link></li>
              <li><Link href="/?tags=tamil" className="hover:text-white transition">Tamil AI Characters</Link></li>
              <li><Link href="/?tags=telugu" className="hover:text-white transition">Telugu AI Companions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px] text-[#7be4d5]">
              Popular Roleplays
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/?tags=romance" className="hover:text-white transition">Desi AI Girlfriend</Link></li>
              <li><Link href="/?tags=boyfriend" className="hover:text-white transition">Indian AI Boyfriend</Link></li>
              <li><Link href="/?tags=college" className="hover:text-white transition">College & Roommate Chat</Link></li>
              <li><Link href="/?tags=comfort" className="hover:text-white transition">Late Night Heart-to-Heart</Link></li>
              <li><Link href="/?tags=drama" className="hover:text-white transition">Desi Bollywood Drama</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px] text-[#7be4d5]">
              Platform Features
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/pricing" className="hover:text-white transition">VIP Passes & Sparks</Link></li>
              <li><Link href="/personas" className="hover:text-white transition">Custom User Personas</Link></li>
              <li><Link href="/character/create" className="hover:text-white transition">Character Studio</Link></li>
              <li><Link href="/chats" className="hover:text-white transition">Chat History</Link></li>
              <li><Link href="/profile" className="hover:text-white transition">Creator Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px] text-[#7be4d5]">
              Trust & Legal (India)
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/contact" className="hover:text-white transition">Contact & Grievance</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white transition">Payments & Refunds</Link></li>
              <li className="text-[11px] text-slate-500 pt-1">Payments powered by Razorpay (UPI & Cards)</li>
            </ul>
          </div>
        </div>

        {/* BOTTOM BRAND ROW */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {currentYear} Suroor AI. All rights reserved. Made for Indian creators and storytellers.</p>
          <div className="flex gap-4 text-[11px] font-semibold text-slate-400">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 100% Encrypted & Private
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}