import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  isAuthenticated: false,
  token: null,
  user: null,

  setAuth: (isAuthenticated, token, user = null) =>
    set({ isAuthenticated, token, user }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ isAuthenticated: false, token: null, user: null });
  },
}));
