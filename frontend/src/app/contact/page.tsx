'use client';

import LegalLayout from '@/components/LegalLayout';
import { 
  LifeBuoy, 
  Gavel, 
  Flag, 
  Briefcase, 
  Mail, 
  Send,
  Scale,
  MessageSquareWarning,
  MapPin
} from 'lucide-react';

export default function ContactGrievancePage() {
  return (
    <LegalLayout title="Contact & Grievance" lastUpdated="July 2, 2026">
      <div className="space-y-10 pb-20">
        
        {/* INTRODUCTION */}
        <section className="bg-indigo-600/5 border border-indigo-600/10 p-6 rounded-3xl">
          <p className="text-slate-300 leading-relaxed text-center">
            We&apos;re here to help. If you have questions, feedback, or need assistance with your <strong className="text-white font-bold">Suroor</strong> account, please contact us using the specialized channels below.
          </p>
        </section>

        {/* 01. CUSTOMER SUPPORT */}
        <Section num="01" title="Customer Support" icon={<LifeBuoy size={20} />} color="text-indigo-400">
          <p className="mb-4">For general inquiries, technical issues, payment questions, or account assistance:</p>
          <a 
            href="mailto:support@suroor.cc" 
            className="group flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-indigo-500/10 transition-all"
          >
            <div className="flex items-center gap-3">
              <Mail className="text-indigo-400" size={18} />
              <span className="text-white font-bold tracking-tight">support@suroor.cc</span>
            </div>
            <Send size={16} className="text-slate-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>
          <p className="mt-4 text-xs text-slate-500 italic">
            Our support team aims to respond within 24–48 business hours.
          </p>
        </Section>

        {/* 02. GRIEVANCE OFFICER & LEGAL (Required for IT Rules / Razorpay) */}
        <Section num="02" title="Grievance Officer" icon={<Gavel size={20} />} color="text-amber-400">
          <p className="mb-6">
            In accordance with the Information Technology Act, 2000 and rules made thereunder, the name and contact details of the Grievance Officer are provided below:
          </p>
          
          <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Officer Name</p>
              {/* Replace with your name or designated support lead */}
              <p className="text-white font-bold">Lokesh Deshpande</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Official Grievance Email</p>
              <a href="mailto:grievance@suroor.cc" className="text-amber-400 hover:underline font-bold">
                grievance@suroor.cc
              </a>
            </div>
          </div>
          
          <div className="mt-6 flex items-start gap-3 text-xs text-slate-500 leading-tight">
            <Scale size={24} className="shrink-0 opacity-50" />
            <p>
              We will acknowledge complaints within 24 to 36 hours and endeavor to resolve them within 15 days from the date of receipt, in accordance with applicable laws.
            </p>
          </div>
        </Section>

        {/* 03. REGISTERED OFFICE / OPERATIONAL ADDRESS (Crucial for Razorpay Approval) */}
        <Section num="03" title="Operational Office" icon={<MapPin size={20} />} color="text-blue-400">
          <p className="mb-4">For formal correspondence and legal notices:</p>
          <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-6">
            <p className="text-white font-bold mb-1">Suroor AI Operations</p>
            {/* Provide your registered city, state, and country (e.g. New Delhi, India) */}
            <p className="text-sm text-slate-400 leading-relaxed">
              Operational Jurisdiction: India<br />
              Contact Address: Maharashtra, India<br />
              Postal Index Code: 422009
            </p>
          </div>
        </Section>

        {/* 04. REPORT CONTENT */}
        <Section num="04" title="Report Content" icon={<Flag size={20} />} color="text-red-500" bg="bg-red-500/5" border="border-red-500/20">
          <p className="mb-4">If you believe any AI character or content violates our Terms of Service or applicable law, please provide the following details:</p>
          
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "Your name and contact information",
              "A clear description of the issue",
              "The relevant character or content link",
              "Any supporting screenshots or data"
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs bg-white/5 p-3 rounded-xl border border-white/5">
                <MessageSquareWarning size={14} className="text-red-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-xs text-slate-400">
            Submit reports via the <span className="text-white font-bold">Support Email</span> or through the in-app reporting tools.
          </p>
        </Section>

        {/* 05. BUSINESS INQUIRIES */}
        <Section num="05" title="Business Inquiries" icon={<Briefcase size={20} />} color="text-emerald-400">
          <p className="mb-4">For enterprise licensing, partnerships, media requests, or custom model integrations:</p>
          <a 
            href="mailto:founder@suroor.cc" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all"
          >
            <Mail size={16} />
            founder@suroor.cc
          </a>
        </Section>

        <footer className="pt-10 border-t border-white/5 text-center">
          <p className="text-slate-400 text-sm mb-2 italic">&ldquo;Thank you for helping us keep Suroor safe, respectful, and enjoyable for everyone.&rdquo;</p>
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">Support Channel Synchronized</p>
        </footer>
      </div>
    </LegalLayout>
  );
}

function Section({ num, title, icon, children, color = "text-blue-500", bg = "bg-[#0a0a0c]", border = "border-white/5" }: any) {
  return (
    <section className={`p-8 rounded-[2rem] border ${border} ${bg} transition-all hover:border-white/10`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-sm ${color}`}>{num}</span>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">{title}</h2>
        </div>
        <div className="text-slate-700">{icon}</div>
      </div>
      <div className="text-slate-400 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}