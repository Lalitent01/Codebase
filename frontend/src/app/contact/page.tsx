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
    <LegalLayout title="Contact & Grievance Redressal" lastUpdated="July 2, 2026">
      <div className="space-y-10 pb-20">
        
        {/* INTRODUCTION */}
        <section className="bg-[#7be4d5]/5 border border-[#7be4d5]/15 p-6 rounded-3xl">
          <p className="text-slate-300 leading-relaxed text-center text-sm md:text-base">
            We are committed to user trust, safety, and rapid resolution of questions. If you have inquiries, need payment assistance, or wish to submit feedback regarding your <strong className="text-white font-bold">Suroor AI</strong> experience, please use the channels below.
          </p>
        </section>

        {/* 01. CUSTOMER SUPPORT */}
        <Section num="01" title="Customer Support" icon={<LifeBuoy size={20} />} color="text-[#7be4d5]">
          <p className="mb-4">
            For general questions, billing inquiries (Razorpay/UPI issues), account verification, or platform assistance:
          </p>
          <a 
            href="mailto:support@suroor.cc" 
            className="group flex items-center justify-between bg-black/40 border border-white/10 p-4 rounded-2xl hover:border-[#7be4d5]/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <Mail className="text-[#7be4d5]" size={18} />
              <span className="text-white font-semibold tracking-tight text-sm">support@suroor.cc</span>
            </div>
            <Send size={15} className="text-slate-400 group-hover:text-[#7be4d5] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>
          <p className="mt-4 text-xs text-slate-400">
            Our support desk responds to all inquiries within 24 to 48 business hours.
          </p>
        </Section>

        {/* 02. GRIEVANCE OFFICER & STATUTORY REDRESSAL (IT Rules 2021 / Razorpay Compliance) */}
        <Section num="02" title="Grievance Officer" icon={<Gavel size={20} />} color="text-amber-400">
          <p className="mb-5">
            In accordance with the <strong>Information Technology Act, 2000</strong> and the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, the contact details of the designated Grievance Officer are set forth below:
          </p>
          
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Grievance Officer Name</p>
              <p className="text-white font-bold text-sm">Lokesh Deshpande</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Grievance Email Address</p>
              <a href="mailto:grievance@suroor.cc" className="text-[#7be4d5] hover:underline font-bold text-sm">
                grievance@suroor.cc
              </a>
            </div>
          </div>
          
          <div className="mt-6 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
            <Scale size={20} className="shrink-0 text-amber-400/80 mt-0.5" />
            <p>
              We acknowledge consumer complaints within 24 hours of receipt and endeavor to investigate and resolve issues within 15 calendar days from the date of filing.
            </p>
          </div>
        </Section>

        {/* 03. REGISTERED / OPERATIONAL OFFICE */}
        <Section num="03" title="Registered & Operational Office" icon={<MapPin size={20} />} color="text-indigo-400">
          <p className="mb-4">For formal legal notices, physical correspondence, and compliance verification:</p>
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
            <p className="text-white font-bold mb-1.5 text-sm">Suroor AI Operations</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Operational Jurisdiction: India<br />
              Region: Maharashtra, India<br />
              Postal Index Code (PIN): 422009
            </p>
          </div>
        </Section>

        {/* 04. CONTENT REPORTING & TRUST & SAFETY */}
        <Section num="04" title="Report Prohibited Content" icon={<Flag size={20} />} color="text-rose-400" bg="bg-rose-500/5" border="border-rose-500/20">
          <p className="mb-4">
            We enforce strict compliance policies regarding non-consensual violence, minors (CSAM), self-harm, and illegal acts. If you encounter any user-generated character or scenario that violates our guidelines:
          </p>
          
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "Character or Creator Name / Link",
              "Specific Description of the Violation",
              "Relevant Screenshots or Context",
              "Your Contact Email for Resolution Follow-up"
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs bg-black/40 p-3 rounded-xl border border-white/5 text-slate-300">
                <MessageSquareWarning size={14} className="text-rose-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-slate-400">
            Send reports directly to <a href="mailto:support@suroor.cc" className="text-white font-semibold underline">support@suroor.cc</a> or use the in-app character report button.
          </p>
        </Section>

        {/* 05. BUSINESS INQUIRIES */}
        <Section num="05" title="Business & Partnerships" icon={<Briefcase size={20} />} color="text-emerald-400">
          <p className="mb-4">For enterprise licensing, media inquiries, or technical collaborations:</p>
          <a 
            href="mailto:founder@suroor.cc" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-xs uppercase tracking-wider hover:bg-emerald-500/20 transition-all"
          >
            <Mail size={14} />
            founder@suroor.cc
          </a>
        </Section>

        <footer className="pt-8 border-t border-white/[0.08] text-center">
          <p className="text-slate-400 text-xs italic mb-1.5">&ldquo;Thank you for helping us maintain a safe, private, and creative community.&rdquo;</p>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Official Suroor Support Desk</p>
        </footer>
      </div>
    </LegalLayout>
  );
}

function Section({ num, title, icon, children, color = "text-[#7be4d5]", bg = "bg-[#0a1013]", border = "border-white/[0.06]" }: any) {
  return (
    <section className={`p-6 md:p-8 rounded-3xl border ${border} ${bg} transition-all`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3.5">
          <span className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center font-bold text-xs ${color}`}>{num}</span>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        </div>
        <div className="text-slate-400">{icon}</div>
      </div>
      <div className="text-slate-300 text-xs md:text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}