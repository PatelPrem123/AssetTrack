import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  darkMode: localStorage.getItem('assettrack_theme') === 'dark',
  toggleTheme: () =>
    set((state) => {
      const nextMode = !state.darkMode;
      localStorage.setItem('assettrack_theme', nextMode ? 'dark' : 'light');
      if (nextMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { darkMode: nextMode };
    }),
  initTheme: () => {
    const isDark = localStorage.getItem('assettrack_theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ darkMode: isDark });
  },
}));
