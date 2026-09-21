import { create } from 'zustand';
import api from '@/lib/axios';

interface AuthState {
  user: any | null;
  token: string | null;
  isInitialized: boolean;
  setAuth: (user: any, token: string) => void;
  decreaseCredits: () => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isInitialized: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    // Set isInitialized: true so pages immediately render after login
    set({ user, token, isInitialized: true });
  },

  decreaseCredits: () =>
    set((state) => ({
      user: state.user
        ? { ...state.user, credits: Math.max(0, (state.user.credits || 0) - 1) }
        : null,
    })),

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

// Initialize client session if token exists in storage
if (typeof window !== 'undefined' && localStorage.getItem('token')) {
  useAuthStore.getState().fetchUser();
} else if (typeof window !== 'undefined') {
  // Mark initialized if no token exists so guest views render immediately
  useAuthStore.setState({ isInitialized: true });
}