import { create } from 'zustand';
import api from '@/lib/axios';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  walletDaily?: number;
  walletBonus?: number;
  walletEnhanced?: number;
  walletPaid?: number;
  credits?: number;
  passExpiry?: string | null;
  passEnhancedLimit?: number;
  currentStreak?: number;
  bio?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isInitialized: boolean;
  setAuth: (user: UserProfile, token: string) => void;
  decreaseCredits: () => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isInitialized: typeof window !== 'undefined' ? !localStorage.getItem('token') : false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    set({ user, token, isInitialized: true });
  },

  // Optimistically deducts 1 spark from the appropriate wallet bucket
  decreaseCredits: () =>
    set((state) => {
      if (!state.user) return { user: null };

      let daily = state.user.walletDaily || 0;
      let bonus = state.user.walletBonus || 0;
      let enhanced = state.user.walletEnhanced || 0;

      if (daily > 0) {
        daily = Math.max(0, daily - 1);
      } else if (bonus > 0) {
        bonus = Math.max(0, bonus - 1);
      } else if (enhanced > 0) {
        enhanced = Math.max(0, enhanced - 1);
      }

      const totalCredits = daily + bonus + enhanced;

      return {
        user: {
          ...state.user,
          walletDaily: daily,
          walletBonus: bonus,
          walletEnhanced: enhanced,
          credits: totalCredits,
        },
      };
    }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({ user: null, token: null, isInitialized: true });
  },

  fetchUser: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token) {
      set({ isInitialized: true, user: null, token: null });
      return;
    }

    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, token, isInitialized: true });
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      set({ user: null, token: null, isInitialized: true });
    }
  },
}));

// Auto-initialize immediately on browser load
if (typeof window !== 'undefined') {
  if (localStorage.getItem('token')) {
    useAuthStore.getState().fetchUser();
  } else {
    useAuthStore.setState({ isInitialized: true });
  }
}