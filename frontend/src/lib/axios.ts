import axios from 'axios';

// Normalize base URL checking both standard environment variable keys
const rawBase = 
  process.env.NEXT_PUBLIC_API_URL || 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  'http://localhost:3001/api';

const baseURL = rawBase.replace(/\/$/, '');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT bearer token if running in browser
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response Interceptor: Handle 401 Unauthorized without crashing public views
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const pathname = window.location.pathname;

      // Do NOT redirect if the user is already on public or auth routes
      const isAuthPage = pathname.startsWith('/auth/');
      const isPublicRoute = 
        pathname === '/' || 
        pathname === '/dashboard' || 
        pathname === '/pricing' ||
        pathname === '/contact' ||
        pathname === '/terms' ||
        pathname === '/privacy' ||
        pathname === '/refund-policy' ||
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