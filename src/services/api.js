import axios from 'axios';

// Em dev: Vite proxia /api → localhost:8000/api (via vite.config.js)
// Em prod: VITE_API_BASE_URL aponta para o Azure App Service
const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('bf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
