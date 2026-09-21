'use client';

import LegalLayout from '@/components/LegalLayout';

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="July 2, 2026">
      <div className="space-y-10 pb-20">
        
        {/* INTRODUCTION */}
        <section className="bg-blue-600/5 border border-blue-600/10 p-6 rounded-3xl">
          <p className="text-slate-300 leading-relaxed">
            Welcome to <strong className="text-white font-bold">Suroor</strong> (&ldquo;Suroor&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Suroor website, applications, AI characters, creator tools, and related services.
          </p>
          <p className="mt-4 text-slate-300">
            By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree, you must not use the Service.
          </p>
        </section>

        {/* 1. ELIGIBILITY */}
        <Section num="01" title="Eligibility">
          <p>You must be at least <strong className="text-white font-bold">18 years old</strong> to create an account or use the Service.</p>
          <p className="mt-2">By using Suroor, you represent and warrant that:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>You are at least 18 years of age.</li>
            <li>You have the legal capacity to enter into this agreement.</li>
            <li>All information you provide is accurate and current.</li>
          </ul>
          <p className="mt-2">We reserve the right to suspend or permanently terminate accounts that violate this requirement.</p>
        </Section>

        {/* 2. YOUR ACCOUNT */}
        <Section num="02" title="Your Account">
          <p>You are responsible for maintaining the security of your account and password.</p>
          <p className="mt-2">You agree to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Keep your login credentials confidential.</li>
            <li>Notify us immediately of any unauthorized access.</li>
            <li>Be responsible for all activities conducted through your account.</li>
          </ul>
        </Section>

        {/* 3. AI DISCLAIMER */}
        <Section num="03" title="AI Disclaimer">
          <p>Suroor uses artificial intelligence to generate responses. You acknowledge that:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-amber-200/70">
            <li>AI responses are generated automatically and may produce fictional information.</li>
            <li>AI conversations do not represent real human opinions or advice.</li>
            <li>AI should never be relied upon for medical, legal, financial, or emergency advice.</li>
          </ul>
        </Section>

        {/* 4. VIRTUAL CREDITS AND PURCHASES */}
        <Section num="04" title="Virtual Credits and Purchases">
          <p>Suroor offers virtual credits and Time Passes for accessing premium features.</p>
          <p className="mt-2 font-bold text-white">These virtual items:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Have no real-world monetary value.</li>
            <li>Are non-transferable between accounts.</li>
            <li>Cannot be exchanged for cash.</li>
          </ul>
        </Section>

        {/* 5. PROHIBITED CONTENT */}
        <Section num="05" title="Prohibited Content" color="text-red-500" bg="bg-red-500/5" border="border-red-500/20">
          <p>You may not create, upload, or request content involving:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 list-disc pl-6 mt-2 text-red-200/70 text-xs uppercase font-bold tracking-tight">
            <li>Sexual content involving minors</li>
            <li>Child exploitation or abuse</li>
            <li>Non-consensual sexual activity</li>
            <li>Terrorism or violent extremism</li>
            <li>Instructions for self-harm or violence</li>
            <li>Copyright infringement or fraud</li>
          </ul>
          <p className="mt-4 text-white font-bold">Violations will result in immediate permanent suspension.</p>
        </Section>

        {/* 6. GOVERNING LAW */}
        <Section num="06" title="Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of <strong className="text-white font-bold">India</strong>, without regard to conflict of law principles.
          </p>
        </Section>

        <footer className="pt-10 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">End of Protocol</p>
        </footer>
      </div>
    </LegalLayout>
  );
}

function Section({ num, title, children, color = "text-blue-500", bg = "bg-[#0a0a0c]", border = "border-white/5" }: any) {
  return (
    <section className={`p-8 rounded-[2rem] border ${border} ${bg} transition-all hover:border-white/10`}>
      <div className="flex items-center gap-4 mb-6">
        <span className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-sm ${color}`}>{num}</span>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">{title}</h2>
      </div>
      <div className="text-slate-400 text-sm leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}