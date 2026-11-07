'use client';

import LegalLayout from '@/components/LegalLayout';

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="July 2, 2026">
      <div className="space-y-10 pb-20">
        
        {/* INTRODUCTION */}
        <section className="bg-[#7be4d5]/5 border border-[#7be4d5]/15 p-6 rounded-3xl">
          <p className="text-slate-300 leading-relaxed text-sm md:text-base">
            Welcome to <strong className="text-white">Suroor AI</strong> (&ldquo;Suroor&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;). These Terms of Service govern your use of the Suroor platform, AI character creation features, roleplay experiences, and digital purchases.
          </p>
          <p className="mt-3 text-slate-400 text-xs md:text-sm">
            By creating an account or accessing the service, you agree to comply with these terms.
          </p>
        </section>

        {/* 1. ELIGIBILITY (18+) */}
        <Section num="01" title="Age Eligibility (Strict 18+)">
          <p>You must be at least <strong className="text-white">18 years of age</strong> to register or converse on Suroor.</p>
          <p className="mt-2">By using the platform, you represent and warrant that:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-xs text-slate-300">
            <li>You are at least 18 years old.</li>
            <li>You possess full legal capacity to enter into this binding agreement.</li>
            <li>Your account registration details are accurate.</li>
          </ul>
        </Section>

        {/* 2. USER CONDUCT & PROHIBITED CONTENT */}
        <Section num="02" title="Prohibited Content" color="text-rose-400" bg="bg-rose-500/5" border="border-rose-500/20">
          <p className="text-xs md:text-sm text-slate-300 mb-3">
            Suroor allows mature and uncensored fictional roleplay. However, the following content categories are strictly illegal and forbidden across all modes:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-rose-200/80 font-medium">
            <li className="bg-black/40 p-2.5 rounded-xl border border-white/5">• Any depiction of minors or child sexual abuse (CSAM)</li>
            <li className="bg-black/40 p-2.5 rounded-xl border border-white/5">• Non-consensual sexual violence or assault</li>
            <li className="bg-black/40 p-2.5 rounded-xl border border-white/5">• Real-world suicide or self-harm encouragement</li>
            <li className="bg-black/40 p-2.5 rounded-xl border border-white/5">• Terrorist acts or violent extremist manifestos</li>
          </ul>
          <p className="mt-4 text-xs font-bold text-white">
            Violations will trigger immediate permanent account suspension and statutory reporting where required.
          </p>
        </Section>

        {/* 3. AI FICTIONAL DISCLAIMER */}
        <Section num="03" title="AI Fiction & Nature of Output">
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            All character personalities, dialogue, and narrative events generated on Suroor are creative fiction produced by artificial intelligence. They do not reflect real human individuals or real-world events. AI outputs must never be relied upon for medical, legal, psychological, or financial counsel.
          </p>
        </Section>

        {/* 4. USER-GENERATED CHARACTERS */}
        <Section num="04" title="Creator Content & Intellectual Property">
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            You retain ownership of the original prompts, descriptions, and personas you write. By making a character public on Suroor, you grant us a non-exclusive license to host, display, and run AI inferences based on that persona.
          </p>
        </Section>

        {/* 5. GOVERNING LAW & JURISDICTION */}
        <Section num="05" title="Governing Law">
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            These Terms are governed by the laws of <strong className="text-white">India</strong>. Any legal dispute or claim arising from your use of Suroor shall be subject to the exclusive jurisdiction of the competent courts in India.
          </p>
        </Section>

        <footer className="pt-8 border-t border-white/[0.08] text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Suroor Terms of Service Enforced</p>
        </footer>
      </div>
    </LegalLayout>
  );
}

function Section({ num, title, children, color = "text-[#7be4d5]", bg = "bg-[#0a1013]", border = "border-white/[0.06]" }: any) {
  return (
    <section className={`p-6 md:p-8 rounded-3xl border ${border} ${bg} transition-all`}>
      <div className="flex items-center gap-3.5 mb-4">
        <span className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center font-bold text-xs ${color}`}>{num}</span>
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">{title}</h2>
      </div>
      <div className="text-slate-300 text-xs md:text-sm leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}