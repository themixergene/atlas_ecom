import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(response?.message)) return response.message[0] ?? 'La validation a échoué.';
    return response?.message ?? (error.message === 'Network Error' ? 'Erreur réseau. Vérifiez la connexion au serveur.' : error.message);
  }
  return 'Une erreur est survenue. Veuillez réessayer.';
}
