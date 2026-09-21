'use client';
import LegalLayout from '@/components/LegalLayout';
import { Shield, Lock, Database, EyeOff, UserX, RefreshCcw, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="July 2, 2026">
      <div className="space-y-10 pb-20">
        
        {/* INTRODUCTION */}
        <section className="bg-blue-600/5 border border-blue-600/10 p-6 rounded-3xl">
          <p className="text-slate-300 leading-relaxed">
            At **Suroor**, we respect your privacy and are committed to protecting your information. This policy outlines our data handling protocols to ensure a secure and private neural experience.
          </p>
        </section>

        {/* 1. INFORMATION WE COLLECT */}
        <Section num="01" title="Information We Collect" icon={<Database size={20} />}>
          <p>We may collect the following data to maintain your neural link:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
            {[
              "Account information (username, email)",
              "Profile information you choose to provide",
              "AI conversations and chat history",
              "AI memory and conversation summaries",
              "Character and creator content",
              "Purchase and wallet history",
              "Device, browser, and usage information",
              "Cookies and analytics data"
            ].map(item => (
              <li key={item} className="flex items-center gap-2 text-xs bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* 2. HOW WE USE YOUR INFORMATION */}
        <Section num="02" title="How We Use Your Information" icon={<Shield size={20} />}>
          <p>We use your information for these specific operational purposes:</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>Provide and improve the Service</li>
            <li>Generate AI responses</li>
            <li>Maintain conversation history and AI memory</li>
            <li>Process purchases and virtual credits</li>
            <li>Detect abuse and fraud</li>
            <li>Ensure platform safety</li>
            <li>Respond to support requests</li>
            <li>Comply with legal obligations</li>
          </ul>
        </Section>

        {/* 3. AI CONVERSATIONS */}
        <Section num="03" title="AI Conversations" icon={<Lock size={20} />}>
          <p>Your conversations may be processed by trusted AI service providers to generate responses.</p>
          <div className="mt-4 p-4 bg-blue-600/10 border border-blue-600/20 rounded-2xl">
            <p className="text-blue-400 font-bold italic text-center">
              "We do not sell your conversations to advertisers."
            </p>
          </div>
        </Section>

        {/* 4. INFORMATION SHARING */}
        <Section num="04" title="Information Sharing" icon={<EyeOff size={20} />}>
          <p>We may share information with trusted service providers, including AI infrastructure, cloud hosting, payment processors, analytics providers, and when required by law.</p>
          <p className="mt-4 font-black uppercase text-white tracking-widest text-center py-2 border-y border-white/5">
            We do NOT sell your personal information.
          </p>
        </Section>

        {/* 5. DATA SECURITY */}
        <Section num="05" title="Data Security" icon={<Lock size={20} />}>
          <p>We use reasonable security measures to protect your information. However, no online service can guarantee 100% complete security in a digital environment.</p>
        </Section>

        {/* 6. ACCOUNT DELETION */}
        <Section num="06" title="Account Deletion" icon={<UserX size={20} />}>
          <p>You may request deletion of your account at any time through your Profile Settings. Some information may be retained where required by law or for strictly regulated fraud prevention purposes.</p>
        </Section>

        {/* 7. AGE REQUIREMENT */}
        <Section num="07" title="Age Requirement" icon={<Shield size={20} />} color="text-red-500" border="border-red-500/20" bg="bg-red-500/5">
          <p className="text-white font-bold">
            Suroor is intended for users 18 years of age or older. 
          </p>
          <p className="mt-2 text-red-200/60">
            We do not knowingly collect data from individuals under this age limit.
          </p>
        </Section>

        {/* 8. CHANGES */}
        <Section num="08" title="Changes" icon={<RefreshCcw size={20} />}>
          <p>We may update this Privacy Policy from time to time. Continued use of the Service after changes become effective constitutes acceptance of the updated policy.</p>
        </Section>

        {/* 9. CONTACT */}
        <Section num="09" title="Contact" icon={<Mail size={20} />}>
          <p>If you have any questions about this Privacy Policy, please contact us through the support details available on the Suroor website.</p>
        </Section>

        <footer className="pt-10 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">Privacy Protocol Complete</p>
        </footer>
      </div>
    </LegalLayout>
  );
}

// Helper Component for consistent section styling
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