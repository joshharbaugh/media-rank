import { create } from 'zustand';
import { User, UserProfile } from '@/types';

interface UserStore {
  user: User | null;
  profile: UserProfile | null;
  setUser: (user: User) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  updateProfile: (updates) => set((state) => ({
    profile: state.profile ? { ...state.profile, ...updates } : null
  })),
  logout: () => set({ user: null, profile: null }),
}));