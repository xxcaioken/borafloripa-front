import axios from 'axios';

// Em dev: Vite proxia /api → localhost:8000/api (via vite.config.js)
// Em prod: VITE_API_BASE_URL aponta para o Azure App Service
const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

export const DEFAULT_CITY = 'Florianópolis';

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('bf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Auto-inject city param for endpoints that accept it (skip if already present)
  const cityEndpoints = ['/events/feed', '/events/venues', '/events/map', '/events/new-venues'];
  const hasCity = config.params?.city || config.url?.includes('city=');
  if (config.method === 'get' && !hasCity && cityEndpoints.some(e => config.url?.startsWith(e))) {
    config.params = { city: DEFAULT_CITY, ...config.params };
  }

  return config;
});

// 401 response: clear stale token
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const token = localStorage.getItem('bf_token');
      if (token) localStorage.removeItem('bf_token');
    }
    return Promise.reject(err);
  }
);
