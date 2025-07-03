import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

export const ThemeToggle = (): React.ReactNode => {
  const { theme, toggleTheme } = useThemeStore();

  function handleToggleTheme() {
    toggleTheme();
  }

  return (
    <button
      onClick={handleToggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};
