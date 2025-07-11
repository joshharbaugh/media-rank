import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ThemeStore {
  theme: 'light' | 'dark';
  isLoading: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  syncThemeWithFirebase: (userId: string) => Promise<void>;
  updateFirebaseTheme: (userId: string, theme: 'light' | 'dark') => Promise<void>;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light', // Default theme is light
      isLoading: false,

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
      },

      setTheme: (theme) => set({ theme }),

      syncThemeWithFirebase: async (userId: string) => {
        if (!userId) return;

        set({ isLoading: true });
        try {
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            const firebaseTheme = userData.settings?.theme;

            if (firebaseTheme && (firebaseTheme === 'light' || firebaseTheme === 'dark')) {
              set({ theme: firebaseTheme });
            }
          }
        } catch (error) {
          console.error('Error syncing theme with Firebase:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      updateFirebaseTheme: async (userId: string, theme: 'light' | 'dark') => {
        if (!userId) return;

        try {
          const userRef = doc(db, 'users', userId);
          await setDoc(userRef, {
            settings: {
              theme
            },
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.error('Error updating Firebase theme:', error);
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
