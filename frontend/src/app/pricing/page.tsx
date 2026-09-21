'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Script from 'next/script'; // FIX: Required to load Razorpay SDK
import { Check, Moon, Sun, Calendar, Wallet, Sparkles, Loader2 } from 'lucide-react';

export default function PricingPage() {
  const { user, fetchUser } = useAuthStore();
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);

  useEffect(() => {
    api.post('/analytics/track', { eventType: 'PRICING_PAGE_VIEW' }).catch(() => {});

    api.get('/analytics/public/plans')
      .then((res) => setPlans(res.data || []))
      .catch((err) => {
        console.error('Error fetching plans:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePurchase = async (planId: string) => {
    if (!user) {
      alert('Please log in to proceed with your purchase.');
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    if (!user.isEmailVerified) {
      alert('Please verify your email before making purchases.');
      router.push('/dashboard');
      return;
    }

    if (typeof (window as any).Razorpay === 'undefined') {
      alert('Payment engine is still initializing. Please try again in a few seconds.');
      return;
    }

    setPurchasingPlanId(planId);

    try {
      const orderRes = await api.post('/payments/create-order', { planId });
      const order = orderRes.data;

      // Ensure key is read properly (checks both NEXT_PUBLIC_ and fallback)
      const razorpayKey = 
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_T8cXYYnPuRbX8t';

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Suroor AI',
        description: 'Neural Energy Recharge',
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // Secure verification: planId is not trusted on client, verified via orderId
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            if (verifyRes.data.success) {
              alert('Payment Successful! Energy credits activated.');
              if (fetchUser) await fetchUser(); 
              router.push('/dashboard');
            }
          } catch {
            alert('Payment verification failed. If your account was debited, please contact support.');
          } finally {
            setPurchasingPlanId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setPurchasingPlanId(null);
          },
        },
        prefill: {
          name: user.username,
          email: user.email,
        },
        theme: { color: '#2563eb' }, 
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        alert(`Payment Failed: ${resp.error?.description || 'Transaction declined'}`);
        setPurchasingPlanId(null);
      });
      rzp.open();

    } catch (err: any) {
      console.error('Payment Error:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Could not initiate payment.');
      setPurchasingPlanId(null);
    }
  };

  const walletPacks = plans.filter((p) => p.type === 'WALLET_PACK').sort((a, b) => a.price - b.price);
  const timePasses = plans.filter((p) => p.type === 'TIME_PASS').sort((a, b) => a.price - b.price);

  if (loading) {
    return (
      <div className="bg-black min-h-screen text-white flex flex-col items-center justify-center font-mono gap-3 uppercase tracking-[0.2em]">
        <Loader2 size={36} className="animate-spin text-blue-500" />
        <p className="animate-pulse text-xs">Syncing_Economy_Grid...</p>
      </div>
    );
  }

  const hasActivePass = Boolean(user?.passExpiry && new Date(user.passExpiry) > new Date());

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      {/* Load Razorpay Checkout Script */}
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        strategy="lazyOnload" 
      />

      <Sidebar />
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto pb-20">
        <header className="mb-12 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-4 text-blue-500">
            Neural Marketplace
          </h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest leading-relaxed">
            Choose your connection tier. Passes provide unlimited messaging with enhanced bursts.
          </p>
        </header>

        {/* TIME PASSES */}
        {timePasses.length > 0 && (
          <section className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="text-blue-500" size={24} />
              <h2 className="text-xl font-black italic uppercase tracking-tight">Time Passes (Unlimited)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {timePasses.map((pass) => (
                <PlanCard 
                  key={pass.id} 
                  plan={pass} 
                  onBuy={() => handlePurchase(pass.id)}
                  disabled={hasActivePass || purchasingPlanId === pass.id}
                  isPurchasing={purchasingPlanId === pass.id}
                  icon={pass.name.toLowerCase().includes('night') ? <Moon /> : pass.name.toLowerCase().includes('daily') ? <Sun /> : <Calendar />}
                  color="border-blue-500/30"
                />
              ))}
            </div>
          </section>
        )}

        {/* WALLET PACKS */}
        {walletPacks.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Wallet className="text-yellow-500" size={24} />
              <h2 className="text-xl font-black italic uppercase tracking-tight">Energy Vaults (One-Time)</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {walletPacks.map((pack) => (
                <div 
                  key={pack.id} 
                  className="bg-[#111318] border border-white/5 p-6 rounded-3xl hover:border-yellow-500/30 transition-all flex flex-col items-center text-center group shadow-xl"
                >
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{pack.name}</p>
                  <p className="text-2xl font-black text-white mb-4">₹{pack.price}</p>
                  <div className="space-y-1 mb-6 flex-1">
                    <p className="text-xs font-bold text-slate-300">{pack.totalMessages || 0} Messages</p>
                    <p className="text-[10px] text-yellow-500 font-black uppercase">{pack.enhancedMessages || 0} Enhanced</p>
                  </div>
                  <button 
                    type="button"
                    disabled={purchasingPlanId === pack.id}
                    onClick={() => handlePurchase(pack.id)}
                    className="w-full py-2.5 bg-white/5 group-hover:bg-yellow-600 group-hover:text-black rounded-xl text-[10px] font-black uppercase transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {purchasingPlanId === pack.id ? 'Connecting...' : 'Deploy Energy'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function PlanCard({ plan, onBuy, icon, color, disabled, isPurchasing }: any) {
  return (
    <div className={`bg-[#111318] border-2 ${color} p-8 rounded-[2.5rem] relative flex flex-col h-full shadow-2xl transition-all ${
      disabled ? 'opacity-80' : 'hover:scale-[1.02]'
    }`}>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500">{icon}</div>
        <div className="text-right">
          <p className="text-2xl font-black">₹{plan.price}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase">{plan.durationHours} Hours</p>
        </div>
      </div>
      
      <h3 className="text-xl font-black uppercase italic mb-2 tracking-tighter">{plan.name}</h3>
      
      <ul className="space-y-3 mb-8 flex-1">
        <li className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Check size={14} className="text-blue-500" /> Unlimited Messages
        </li>
        <li className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Check size={14} className="text-blue-500" /> {plan.enhancedMessages} Smart Quota
        </li>
        <li className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Check size={14} className="text-blue-500" /> Priority Model Routing
        </li>
      </ul>

      <button 
        type="button"
        onClick={onBuy}
        disabled={disabled}
        className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
          disabled 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-95 cursor-pointer'
        }`}
      >
        {isPurchasing ? 'Initializing Gateway...' : disabled ? 'PASS ACTIVE' : 'Activate Pass'}
      </button>
    </div>
  );
}