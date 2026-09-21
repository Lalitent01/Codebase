'use client';
import LegalLayout from '@/components/LegalLayout';
import { 
  Coins, 
  Clock, 
  CreditCard, 
  RotateCcw, 
  AlertTriangle, 
  RefreshCcw, 
  Mail,
  Receipt
} from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Payments & Refunds" lastUpdated="July 2, 2026">
      <div className="space-y-10 pb-20">
        
        {/* INTRODUCTION */}
        <section className="bg-emerald-600/5 border border-emerald-600/10 p-6 rounded-3xl">
          <p className="text-slate-300 leading-relaxed">
            This Payments & Refunds Policy explains how purchases made on **Suroor** are handled. We aim to provide transparency regarding our digital goods and premium access tiers.
          </p>
        </section>

        {/* 01. VIRTUAL CREDITS */}
        <Section num="01" title="Virtual Credits" icon={<Coins size={20} />}>
          <p>Suroor offers virtual credits that can be used to access premium features within the Service. Please note that Virtual Credits:</p>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
            {[
              "Have no cash value",
              "Non-transferable between users",
              "Cannot be exchanged for money"
            ].map(item => (
              <li key={item} className="flex items-center gap-2 text-xs bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* 02. TIME PASSES */}
        <Section num="02" title="Time Passes" icon={<Clock size={20} />}>
          <p>Time Passes provide temporary access to eligible premium features for the duration specified at the time of purchase.</p>
          <p className="mt-3 bg-white/5 p-4 rounded-2xl italic border-l-2 border-emerald-500">
            Time Passes expire automatically at the end of their validity period and cannot be extended unless otherwise stated during the checkout process.
          </p>
        </Section>

        {/* 03. PAYMENTS */}
        <Section num="03" title="Payments" icon={<CreditCard size={20} />}>
          <p>All purchases are processed through secure third-party payment providers to ensure your financial data remains encrypted and safe.</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>Prices may change at any time without prior notice.</li>
            <li>Any applicable taxes will be shown during checkout where required by law.</li>
            <li>We do not store your full credit card details on our local servers.</li>
          </ul>
        </Section>

        {/* 04. REFUNDS */}
        <Section num="04" title="Refunds" icon={<RotateCcw size={20} />} color="text-amber-500" border="border-amber-500/20" bg="bg-amber-500/5">
          <p className="font-bold text-white mb-4">
            As virtual credits and Time Passes are digital products delivered immediately, all purchases are generally final and non-refundable.
          </p>
          <div className="mt-4 p-4 border-y border-white/5 space-y-4">
            <p className="text-xs uppercase tracking-widest text-slate-500">Exceptions may apply if:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Receipt size={14} className="mt-1 text-amber-500" />
                <span>You were charged multiple times for the same purchase.</span>
              </li>
              <li className="flex items-start gap-2">
                <Receipt size={14} className="mt-1 text-amber-500" />
                <span>A technical issue prevented delivery of your purchase.</span>
              </li>
              <li className="flex items-start gap-2">
                <Receipt size={14} className="mt-1 text-amber-500" />
                <span>A refund is required under applicable local law.</span>
              </li>
            </ul>
          </div>
          <p className="mt-4 text-xs text-slate-500 italic text-center">
            Refund requests are reviewed on a case-by-case basis.
          </p>
        </Section>

        {/* 05. FRAUD & ABUSE */}
        <Section num="05" title="Fraud & Abuse" icon={<AlertTriangle size={20} />} color="text-red-500">
          <p>We reserve the right to take action to protect the platform. This includes suspending accounts, cancelling purchases, or revoking virtual items obtained through:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
            {["Payment disputes", "Chargebacks", "Unauthorized activity", "Fraudulent identity"].map(item => (
              <li key={item} className="text-xs bg-red-500/5 p-2 rounded-lg border border-red-500/10 text-red-200/60">
                • {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* 06. CHANGES */}
        <Section num="06" title="Changes" icon={<RefreshCcw size={20} />}>
          <p>We may update this Payments & Refunds Policy from time to time. Continued use of the Service after changes become effective constitutes acceptance of the updated policy.</p>
        </Section>

        {/* 07. CONTACT */}
        <Section num="07" title="Contact" icon={<Mail size={20} />}>
          <p>For payment-related questions, transaction discrepancies, or refund requests, please contact us through the support details available on the Suroor dashboard or help center.</p>
        </Section>

        <footer className="pt-10 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">Financial Protocol Verified</p>
        </footer>
      </div>
    </LegalLayout>
  );
}

// Helper Component (Same as Privacy Page for consistency)
function Section({ num, title, icon, children, color = "text-emerald-500", bg = "bg-[#0a0a0c]", border = "border-white/5" }: any) {
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