'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, token, user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // 1. Initial Token & Profile Sync
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      fetchUser();
    }
  }, [fetchUser]);

  // 2. Economy Heartbeat (Daily resets & streaks)
  useEffect(() => {
    if (isMounted && token && user) {
      api.post('/analytics/heartbeat').catch(() => {});
    }
  }, [isMounted, token, user, pathname]);
  
  // 3. Route Protection
  useEffect(() => {
    if (!isMounted) return;

    // Hard redirect only for strictly authenticated areas
    const privateRoutes = ['/chat/', '/profile', '/admin', '/chats'];
    const isPrivateRoute = privateRoutes.some((path) => pathname.startsWith(path));

    const hasStoredToken = typeof window !== 'undefined' && !!localStorage.getItem('token');

    // If attempting to access private route without token, redirect to login
    if (isPrivateRoute && !token && !hasStoredToken) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isMounted, pathname, token, router]);

  if (!isMounted) return null;

  return <>{children}</>;
}