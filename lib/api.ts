import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { ensureFreshToken } from '@/lib/keycloakAuth';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://backend.oxocareers.com/api/v1'
    : 'http://localhost:5000/api/v1');

// No default Content-Type here - axios already sets 'application/json' on its
// own for plain object payloads (see transformRequest in axios' defaults).
// Forcing it as a default instead breaks every FormData/file upload in the
// app: axios treats a FormData body as JSON whenever the effective
// Content-Type is 'application/json', silently serializing it (and losing
// the file) instead of sending real multipart/form-data - the browser needs
// to set that header itself, with the correct multipart boundary.
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Attach a fresh access token to every request, refreshing if it's expiring.
// keycloak-js owns the token lifecycle; we just ask it for a valid one.
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const token = await ensureFreshToken(30);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Keep the store mirror in sync after a refresh.
      useAuthStore.getState().syncFromKeycloak();
    }
  }
  return config;
});

// On 401, redirect the user back through Keycloak's login flow.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const { logout } = useAuthStore.getState();
      // logout() redirects to Keycloak's end-session endpoint and never resolves.
      await logout();
    }
    return Promise.reject(error);
  },
);

export default api;
