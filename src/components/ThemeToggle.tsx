import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { useUserStore } from '@/store/userStore';

export const ThemeToggle = (): React.ReactNode => {
  const { theme, toggleTheme, updateFirebaseTheme } = useThemeStore();
  const { user } = useUserStore();

  // Update both local state and Firebase
  function handleToggleTheme() {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    toggleTheme();

    // Update Firebase if user is authenticated
    if (user?.uid) {
      updateFirebaseTheme(user.uid, newTheme);
    }
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
