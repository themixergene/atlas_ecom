import { defineStore } from 'pinia';
import { api } from '../api/client';
import type { User } from '../types';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
    isAdmin: (state) => state.user?.role === 'ADMIN',
  },
  actions: {
    async login(email: string, password: string) {
      const { data } = await api.post<{ user: User; token: string }>('/auth/login', { email, password });
      this.setSession(data.user, data.token);
    },
    async register(name: string, email: string, password: string) {
      const { data } = await api.post<{ user: User; token: string }>('/auth/register', { name, email, password });
      this.setSession(data.user, data.token);
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    setSession(user: User, token: string) {
      this.user = user;
      this.token = token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
  },
});
