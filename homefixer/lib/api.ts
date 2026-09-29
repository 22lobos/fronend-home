import axios from 'axios';
import { TOKEN_KEY, clearSession } from './session';

// ============================================================
// CLIENTE AXIOS CON INTERCEPTORES
// ============================================================

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de solicitud — añade el token JWT si existe
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta — maneja 401 (no autorizado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        clearSession();
        const esTecnico = window.location.pathname.startsWith('/tecnico');
        window.location.href = esTecnico ? '/login-tecnico' : '/login-cliente';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

/** true mientras se usan los datos de lib/mock-data.ts (NEXT_PUBLIC_USE_MOCKS=false para usar el backend) */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';
