import { useState } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export const useRazorpay = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const initiatePayment = async ({
    planId,
    token,
    onSuccess,
    onCancel,
  }: {
    planId: string;
    token: string;
    onSuccess?: () => void;
    onCancel?: () => void;
  }) => {
    setLoading(true);
    setError(null);

    const isLoaded = await loadScript();
    if (!isLoaded) {
      setLoading(false);
      setError('Failed to load Razorpay payment gateway. Please check your connection.');
      return;
    }

    try {
      const rawApi = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
      const backendUrl = rawApi.replace(/\/$/, '');

      // 1. Create order on the backend
      const orderRes = await fetch(`${backendUrl}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || 'Could not initiate purchase');
      }

      // 2. Razorpay Standard Checkout options with full native payment methods (UPI apps, QR, Cards, Netbanking)
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Suroor AI',
        description: `Upgrade to ${orderData.planName || 'VIP Pass'}`,
        order_id: orderData.orderId || orderData.id,
        prefill: {
          name: orderData.username || '',
          email: orderData.userEmail || '',
        },
        // Native methods: enables UPI intent for mobile apps (GPay, PhonePe, Paytm), QR on desktop, Cards, and Netbanking
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        theme: {
          color: '#7be4d5', // Suroor mint-teal theme
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setLoading(false);
            if (onCancel) onCancel();
          },
        },
        handler: async (response: PaymentSuccessResponse) => {
          try {
            // 3. Send signature verification to backend
            const verifyRes = await fetch(`${backendUrl}/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.message || 'Payment signature verification failed');
            }

            setLoading(false);
            if (onSuccess) onSuccess();
          } catch (err: any) {
            setLoading(false);
            setError(err.message || 'Payment verification failed');
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', (response: any) => {
        setLoading(false);
        const desc = response.error?.description || response.error?.reason || 'Payment failed or declined.';
        setError(desc);
      });

      razorpayInstance.open();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to initiate payment');
    }
  };

  return { initiatePayment, loading, error };
};