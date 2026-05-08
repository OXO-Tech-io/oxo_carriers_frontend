import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://backend.oxocareers.com/api'
    : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach a fresh access token to every request, refreshing if it's expiring.
api.interceptors.request.use(async config => {
  if (typeof window !== 'undefined') {
    const token = await useAuthStore.getState().refresh();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// On 401, clear the session and redirect to /login.
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      await useAuthStore.getState().logout();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
