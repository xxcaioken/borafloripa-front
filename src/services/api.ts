import axios, { AxiosInstance } from 'axios';

// ---------------------------------------------------------------------------
// Shared types (espelham os schemas Pydantic do backend)
// ---------------------------------------------------------------------------

export interface TagOut {
  id: number;
  name: string;
}

export interface VenueOut {
  id: number;
  owner_id: number | null;
  name: string;
  city: string;
  lat: number;
  lng: number;
  address: string | null;
  instagram: string | null;
  whatsapp: string | null;
  hours: string | null;          // JSON serializado: {"Seg":"18:00–02:00", ...}
  category: string | null;
  is_new: boolean;
  logo_url: string | null;
  wheelchair: boolean;
  hearing_loop: boolean;
  visual_aid: boolean;
  adapted_wc: boolean;
  parking: boolean;
  checkin_count: number;
}

export interface EventOut {
  id: number;
  title: string;
  description: string | null;
  date: string;                  // ISO 8601 string vindo da API
  vibe_status: string;
  is_featured: boolean;
  category: string;
  is_temporary: boolean;
  organizers: string | null;
  cover_url: string | null;
  price_info: string | null;
  view_count: number;
  venue: VenueOut;
  tags: TagOut[];
}

export interface UserOut {
  id: number;
  name: string;
  email: string;
  role: string;
  pref_music: string | null;   // JSON serializado: '["funk","mpb"]'
  pref_vibes: string | null;   // JSON serializado: '["rooftop"]'
}

// ---------------------------------------------------------------------------
// Endpoints que recebem o param city= (injetado automaticamente)
// ---------------------------------------------------------------------------

export const CITY_ENDPOINTS = [
  '/events/feed',
  '/events/venues',
  '/events/map',
  '/events/new-venues',
] as const;

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

export const DEFAULT_CITY = 'Florianópolis';

export const api: AxiosInstance = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('bf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Auto-inject city param (skip se já presente)
  const hasCity = config.params?.city || config.url?.includes('city=');
  if (
    config.method === 'get' &&
    !hasCity &&
    CITY_ENDPOINTS.some(e => config.url?.startsWith(e))
  ) {
    config.params = { city: DEFAULT_CITY, ...config.params };
  }

  return config;
});

// 401: limpa token expirado
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      if (localStorage.getItem('bf_token')) {
        localStorage.removeItem('bf_token');
      }
    }
    return Promise.reject(err);
  }
);
