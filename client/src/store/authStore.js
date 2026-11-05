import { create } from 'zustand';
import { api } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  organization: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: true,

  setUser: (user, token, organization) => {
    if (token) localStorage.setItem('token', token);
    set({
      user,
      organization: organization || get().organization,
      token: token || get().token,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      organization: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, organization: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      set({
        user: res.data.data.user,
        organization: res.data.data.organization,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, organization: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
