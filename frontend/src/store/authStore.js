import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  isAuthenticated: false,
  user: null,
  isVerified: false,
  isAdmin: false,

  // Call after a successful /login or session restore via /users/me
  setAuth: (isAuthenticated, user = null, isVerified = false, isAdmin = false) => {
    set({ isAuthenticated, user, isVerified, isAdmin });
  },

  setVerified: (isVerified) => set({ isVerified }),

  // Clears local state — caller must also call authAPI.logout() to clear httpOnly cookies
  logout: () => {
    set({ isAuthenticated: false, user: null, isVerified: false, isAdmin: false });
  },
}));
