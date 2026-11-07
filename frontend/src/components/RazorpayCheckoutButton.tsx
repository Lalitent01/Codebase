'use client';

import React from 'react';
import { useRazorpay } from '../hooks/useRazorpay';
import { Loader2, Zap } from 'lucide-react';

interface Props {
  planId: string;
  planName: string;
  price: number;
  token: string;
  onSuccess?: () => void;
}

export const RazorpayCheckoutButton: React.FC<Props> = ({
  planId,
  planName,
  price,
  token,
  onSuccess,
}) => {
  const { initiatePayment, loading, error } = useRazorpay();

  const handleCheckout = () => {
    initiatePayment({
      planId,
      token,
      onSuccess: () => {
        alert(`Payment successful! Your upgrade to ${planName} is now active.`);
        if (onSuccess) onSuccess();
      },
      onCancel: () => {
        console.log('Payment modal dismissed by user');
      },
    });
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="w-full px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#7be4d5] hover:bg-[#6bd6c7] disabled:opacity-50 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#7be4d5]/10"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin text-black" size={16} /> Opening Gateway...
          </>
        ) : (
          <>
            <Zap size={14} className="fill-current" /> Upgrade for ₹{price} (UPI / Cards)
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-rose-400 text-center font-medium">{error}</p>
      )}
    </div>
  );
};