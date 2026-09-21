import axios from 'axios';

// Normalize base URL to prevent double slashes
const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
const baseURL = rawBase.replace(/\/$/, '');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token if running on client
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response Interceptor: Handle 401 Unauthorized cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const pathname = window.location.pathname;

      // Do NOT redirect if the user is already on auth pages or public pages
      const isAuthPage = pathname.startsWith('/auth/');
      const isPublicRoute = 
        pathname === '/' || 
        pathname === '/dashboard' || 
        pathname === '/pricing' ||
        pathname === '/contact' ||
        pathname === '/terms' ||
        pathname === '/privacy' ||
        pathname.startsWith('/character/') ||
        pathname.startsWith('/creator/') ||
        isAuthPage;

      if (!isPublicRoute) {
        localStorage.removeItem('token');
        window.location.href = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
      }
    }

    return Promise.reject(error);
  },
);

export default api;