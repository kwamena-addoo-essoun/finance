import { create } from 'zustand';

const getStored = () => {
  try {
    return localStorage.getItem('finsight-theme') === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('finsight-theme', theme); } catch {}
};

// Apply immediately when this module is first imported (before any render)
applyTheme(getStored());

export const useThemeStore = create((set) => ({
  isDark: getStored() === 'dark',
  toggle: () =>
    set((s) => {
      const next = s.isDark ? 'light' : 'dark';
      applyTheme(next);
      return { isDark: !s.isDark };
    }),
}));
