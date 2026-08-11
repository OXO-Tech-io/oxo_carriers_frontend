import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { ensureFreshToken } from '@/lib/keycloakAuth';

import { API_BASE_URL } from '@/lib/apiConfig';

const API_URL = API_BASE_URL;

/**
 * Re-exported for the handful of callers that cannot go through axios at all -
 * notably the attendance end-session beacon, which fires from
 * `navigator.sendBeacon` on unload and so builds its own URL.
 */
export { API_BASE_URL };

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
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
