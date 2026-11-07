'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Check, Moon, Sun, Calendar, Sparkles, Loader2, Zap } from 'lucide-react';

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
      alert('Please sign in to upgrade your account.');
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    if (!user.isEmailVerified) {
      alert('Please confirm your email address before making a purchase.');
      router.push('/dashboard');
      return;
    }

    if (typeof (window as any).Razorpay === 'undefined') {
      alert('Payment engine is initializing. Please try again in 3 seconds.');
      return;
    }

    setPurchasingPlanId(planId);

    try {
      const orderRes = await api.post('/payments/create-order', { planId });
      const order = orderRes.data;

      const razorpayKey = 
        order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_Tx9wyVWXnb89gO';

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Suroor AI',
        description: `Upgrade to ${order.planName || 'Premium Pass'}`,
        order_id: order.orderId || order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            if (verifyRes.data.success) {
              alert('Payment Successful! Your pass and sparks are now active.');
              if (fetchUser) await fetchUser(); 
              router.push('/dashboard');
            }
          } catch {
            alert('Payment verification failed. If your account was debited, please contact support@suroor.cc.');
          } finally {
            setPurchasingPlanId(null);
          }
        },
        modal: {
          confirm_close: true,
          ondismiss: function () {
            setPurchasingPlanId(null);
          },
        },
        prefill: {
          name: user.username,
          email: user.email,
        },
        theme: { color: '#7be4d5' },
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
      <div className="bg-[#030708] min-h-screen text-white flex flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="animate-spin text-[#7be4d5]" />
        <p className="text-xs uppercase tracking-widest font-semibold text-slate-400">Loading Pricing & Passes...</p>
      </div>
    );
  }

  const hasActivePass = Boolean(user?.passExpiry && new Date(user.passExpiry) > new Date());

  return (
    <div className="flex min-h-screen bg-[#030708] text-white">
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        strategy="lazyOnload" 
      />

      <Sidebar />
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto pb-24">
        <header className="mb-12 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3 text-white">
            Unlimited Hinglish Roleplay
          </h1>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
            Upgrade your conversation depth. Passes provide unlimited messaging, long-term memory recall, and priority generation via UPI or Cards.
          </p>
        </header>

        {/* TIME PASSES */}
        {timePasses.length > 0 && (
          <section className="mb-16 max-w-5xl mx-auto">
            <div className="flex items-center gap-2.5 mb-6">
              <Sparkles className="text-[#7be4d5]" size={20} />
              <h2 className="text-lg font-bold uppercase tracking-wider text-white">Time Passes (Unlimited Chatting)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {timePasses.map((pass) => (
                <PlanCard 
                  key={pass.id} 
                  plan={pass} 
                  onBuy={() => handlePurchase(pass.id)}
                  disabled={hasActivePass || purchasingPlanId === pass.id}
                  isPurchasing={purchasingPlanId === pass.id}
                  icon={pass.name.toLowerCase().includes('night') ? <Moon size={20} /> : pass.name.toLowerCase().includes('daily') ? <Sun size={20} /> : <Calendar size={20} />}
                />
              ))}
            </div>
          </section>
        )}

        {/* SPARK RECHARGES */}
        {walletPacks.length > 0 && (
          <section className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2.5 mb-6">
              <Zap className="text-amber-400" size={20} />
              <h2 className="text-lg font-bold uppercase tracking-wider text-white">Spark Recharges (One-Time Boosts)</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {walletPacks.map((pack) => (
                <div 
                  key={pack.id} 
                  className="bg-[#0a1013] border border-white/[0.06] p-6 rounded-3xl hover:border-[#7be4d5]/30 transition-all flex flex-col items-center text-center group shadow-xl"
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{pack.name}</p>
                  <p className="text-2xl font-black text-white mb-3">₹{pack.price}</p>
                  <div className="space-y-1 mb-6 flex-1 text-xs">
                    <p className="text-slate-300 font-medium">{pack.totalMessages || 0} Messages</p>
                    <p className="text-amber-400 font-semibold">{pack.enhancedMessages || 0} Priority Bursts</p>
                  </div>
                  <button 
                    type="button"
                    disabled={purchasingPlanId === pack.id}
                    onClick={() => handlePurchase(pack.id)}
                    className="w-full py-2.5 bg-white/5 group-hover:bg-[#7be4d5] group-hover:text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {purchasingPlanId === pack.id ? 'Connecting...' : 'Get Sparks'}
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

function PlanCard({ plan, onBuy, icon, disabled, isPurchasing }: any) {
  return (
    <div className={`bg-[#0a1013] border border-white/[0.08] p-8 rounded-3xl relative flex flex-col h-full shadow-xl transition-all ${
      disabled ? 'opacity-70' : 'hover:border-[#7be4d5]/40 hover:-translate-y-1'
    }`}>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-[#7be4d5]/10 rounded-2xl text-[#7be4d5]">{icon}</div>
        <div className="text-right">
          <p className="text-2xl font-black text-white">₹{plan.price}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">{plan.durationHours} Hours Validity</p>
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
      
      <ul className="space-y-2.5 mb-8 flex-1 text-xs text-slate-300">
        <li className="flex items-center gap-2">
          <Check size={14} className="text-[#7be4d5]" /> Unlimited Roleplay Messages
        </li>
        <li className="flex items-center gap-2">
          <Check size={14} className="text-[#7be4d5]" /> {plan.enhancedMessages} High-Fidelity Generations
        </li>
        <li className="flex items-center gap-2">
          <Check size={14} className="text-[#7be4d5]" /> Priority Model Latency
        </li>
      </ul>

      <button 
        type="button"
        onClick={onBuy}
        disabled={disabled}
        className={`w-full py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all cursor-pointer ${
          disabled 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
            : 'bg-[#7be4d5] hover:bg-[#6bd6c7] text-black shadow-md shadow-[#7be4d5]/10 active:scale-95'
        }`}
      >
        {isPurchasing ? 'Opening Gateway...' : disabled ? 'Pass Currently Active' : 'Activate Pass'}
      </button>
    </div>
  );
}