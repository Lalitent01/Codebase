'use client';

import LegalLayout from '@/components/LegalLayout';
import { 
  Zap, 
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
    <LegalLayout title="Payments & Cancellation Policy" lastUpdated="July 2, 2026">
      <div className="space-y-10 pb-20">
        
        {/* INTRODUCTION */}
        <section className="bg-[#7be4d5]/5 border border-[#7be4d5]/15 p-6 rounded-3xl">
          <p className="text-slate-300 leading-relaxed text-sm md:text-base">
            This policy outlines billing terms, cancellation rights, and refund procedures for digital passes and credits purchased on <strong className="text-white">Suroor AI</strong>.
          </p>
        </section>

        {/* 01. VIRTUAL CREDITS & SPARKS */}
        <Section num="01" title="Virtual Sparks & Credits" icon={<Zap size={20} />}>
          <p>
            Suroor offers virtual energy (&ldquo;Sparks&rdquo;) for accessing high-fidelity AI interactions. Virtual items:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4 text-xs">
            {[
              "Carry no real-world monetary value",
              "Are non-transferable between accounts",
              "Cannot be redeemed for cash or currency"
            ].map(item => (
              <li key={item} className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/5 text-slate-300">
                <div className="w-1.5 h-1.5 bg-[#7be4d5] rounded-full shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* 02. TIME PASSES */}
        <Section num="02" title="Time Passes" icon={<Clock size={20} />}>
          <p className="text-xs md:text-sm leading-relaxed">
            Time Passes provide unlimited messaging privileges for the specified duration (e.g. 24 Hours, Weekly). Validity begins immediately upon confirmed payment and terminates automatically when the hours expire.
          </p>
        </Section>

        {/* 03. PAYMENT GATEWAYS */}
        <Section num="03" title="Payment Processing" icon={<CreditCard size={20} />}>
          <p className="text-xs md:text-sm leading-relaxed">
            Transactions are processed through verified payment aggregators (including Razorpay) supporting UPI (GPay, PhonePe, Paytm), Netbanking, and Debit/Credit Cards. We do not store full card credentials on our servers.
          </p>
        </Section>

        {/* 04. REFUNDS & CANCELLATION */}
        <Section num="04" title="Refunds & Exceptions" icon={<RotateCcw size={20} />} color="text-amber-400" border="border-amber-500/20" bg="bg-amber-500/5">
          <p className="font-semibold text-white mb-3 text-xs md:text-sm">
            Due to the instantaneous digital fulfillment of virtual credits and passes, purchases are generally final and non-refundable once unlocked.
          </p>
          <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2.5 text-xs text-slate-300">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Exceptions honored by support:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Receipt size={14} className="mt-0.5 text-amber-400 shrink-0" />
                <span>Duplicate billing caused by network interruptions during payment authorization.</span>
              </li>
              <li className="flex items-start gap-2">
                <Receipt size={14} className="mt-0.5 text-amber-400 shrink-0" />
                <span>Verified technical failure where digital assets were not credited to the account.</span>
              </li>
            </ul>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            To submit a claim, email your order ID and payment receipt to <a href="mailto:support@suroor.cc" className="text-[#7be4d5] underline">support@suroor.cc</a> within 7 days of the charge.
          </p>
        </Section>

        {/* 05. DISPUTES & CHARGEBACKS */}
        <Section num="05" title="Fraud Prevention" icon={<AlertTriangle size={20} />} color="text-rose-400">
          <p className="text-xs md:text-sm leading-relaxed">
            We reserve the right to revoke virtual balances or suspend accounts associated with fraudulent activity, unauthorized credit card usage, or malicious chargebacks.
          </p>
        </Section>

        {/* 06. CONTACT */}
        <Section num="06" title="Support" icon={<Mail size={20} />}>
          <p className="text-xs md:text-sm">
            For billing discrepancies or payment inquiries, contact our billing desk at <a href="mailto:support@suroor.cc" className="text-[#7be4d5] underline">support@suroor.cc</a>.
          </p>
        </Section>

        <footer className="pt-8 border-t border-white/[0.08] text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Suroor Financial Compliance Standards</p>
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