import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  isAuthenticated: false,
  user: null,
  isVerified: false,
  isAdmin: false,
  aiDataConsent: false,

  // Call after a successful /login or session restore via /users/me
  setAuth: (isAuthenticated, user = null, isVerified = false, isAdmin = false, aiDataConsent = false) => {
    set({ isAuthenticated, user, isVerified, isAdmin, aiDataConsent });
  },

  setVerified: (isVerified) => set({ isVerified }),

  setAiDataConsent: (aiDataConsent) => set({ aiDataConsent }),

  // Clears local state — caller must also call authAPI.logout() to clear httpOnly cookies
  logout: () => {
    set({ isAuthenticated: false, user: null, isVerified: false, isAdmin: false, aiDataConsent: false });
  },
}));
