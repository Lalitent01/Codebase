'use client';

import LegalLayout from '@/components/LegalLayout';
import { Shield, Lock, Database, EyeOff, UserX, RefreshCcw, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="July 2, 2026">
      <div className="space-y-10 pb-20">
        
        {/* INTRODUCTION */}
        <section className="bg-[#7be4d5]/5 border border-[#7be4d5]/15 p-6 rounded-3xl">
          <p className="text-slate-300 leading-relaxed text-sm md:text-base">
            At <strong className="text-white">Suroor AI</strong>, your privacy and conversational discretion are our core commitments. This Privacy Policy details our data collection, encryption, and operational practices for users across India and globally.
          </p>
        </section>

        {/* 1. INFORMATION WE COLLECT */}
        <Section num="01" title="Information We Collect" icon={<Database size={20} />}>
          <p>We collect only the minimum information necessary to maintain your account and roleplay continuity:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-4">
            {[
              "Account credentials (username, email address)",
              "User personas and roleplay profiles you create",
              "Direct roleplay conversations with AI characters",
              "Long-term companion memories and summaries",
              "Transaction metadata (processed via Razorpay)",
              "Technical usage data (browser type, session duration)"
            ].map(item => (
              <li key={item} className="flex items-center gap-2 text-xs bg-black/40 p-3 rounded-xl border border-white/5 text-slate-300">
                <div className="w-1.5 h-1.5 bg-[#7be4d5] rounded-full shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* 2. HOW WE USE YOUR INFORMATION */}
        <Section num="02" title="How We Use Your Information" icon={<Shield size={20} />}>
          <p>We process your information strictly for the following operational functions:</p>
          <ul className="list-disc pl-6 mt-3 space-y-1.5 text-xs text-slate-300 leading-relaxed">
            <li>Generate real-time AI responses and maintain narrative memory</li>
            <li>Maintain user authentication, streak balances, and virtual sparks</li>
            <li>Process upgrades securely via compliant payment aggregators</li>
            <li>Enforce safety guidelines prohibiting minors, non-consensual content, and abuse</li>
            <li>Comply with applicable Indian statutory requirements</li>
          </ul>
        </Section>

        {/* 3. CONVERSATIONAL CONFIDENTIALITY */}
        <Section num="03" title="Conversational Confidentiality" icon={<Lock size={20} />}>
          <p>Your interactions with AI characters are private to your account.</p>
          <div className="mt-4 p-4 bg-[#7be4d5]/10 border border-[#7be4d5]/20 rounded-2xl">
            <p className="text-[#7be4d5] font-bold text-center text-xs md:text-sm">
              &ldquo;We never sell your conversation data or chat history to third-party advertising brokers.&rdquo;
            </p>
          </div>
        </Section>

        {/* 4. DATA SHARING & SERVICE PROVIDERS */}
        <Section num="04" title="Third-Party Processors" icon={<EyeOff size={20} />}>
          <p>
            We partner with trusted service providers to run Suroor, including cloud infrastructure, authorized payment gateways (Razorpay), and AI compute engines. All third-party providers are subject to strict data handling and confidentiality agreements.
          </p>
        </Section>

        {/* 5. ACCOUNT & DATA DELETION */}
        <Section num="05" title="Account & Data Erasure" icon={<UserX size={20} />}>
          <p>
            You retain the right to delete your individual chat histories, custom personas, or entire user account at any time. Account deletion permanently purges your message history and character interactions from active databases.
          </p>
        </Section>

        {/* 6. AGE REQUIREMENT (18+) */}
        <Section num="06" title="Age Restriction (18+)" icon={<Shield size={20} />} color="text-rose-400" border="border-rose-500/20" bg="bg-rose-500/5">
          <p className="text-white font-bold text-sm">
            Suroor is strictly restricted to individuals who are at least 18 years of age.
          </p>
          <p className="mt-2 text-xs text-rose-200/70">
            We operate zero tolerance for accounts depicting minors or child exploitation. Suspected accounts are immediately terminated.
          </p>
        </Section>

        {/* 7. POLICY UPDATES */}
        <Section num="07" title="Modifications" icon={<RefreshCcw size={20} />}>
          <p>
            We may revise this policy periodically. Continued use of Suroor after updates take effect represents your acknowledgment of the updated terms.
          </p>
        </Section>

        {/* 8. CONTACT */}
        <Section num="08" title="Contact Us" icon={<Mail size={20} />}>
          <p>
            For privacy inquiries or data requests, please write to us at <a href="mailto:support@suroor.cc" className="text-[#7be4d5] underline">support@suroor.cc</a>.
          </p>
        </Section>

        <footer className="pt-8 border-t border-white/[0.08] text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Suroor AI Privacy Framework Verified</p>
        </footer>
      </div>
    </LegalLayout>
  );
}

function Section({ num, title, icon, children, color = "text-[#7be4d5]", bg = "bg-[#0a1013]", border = "border-white/[0.06]" }: any) {
  return (
    <section className={`p-6 md:p-8 rounded-3xl border ${border} ${bg} transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3.5">
          <span className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center font-bold text-xs ${color}`}>{num}</span>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">{title}</h2>
        </div>
        <div className="text-slate-400">{icon}</div>
      </div>
      <div className="text-slate-300 text-xs md:text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}