import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserProfile } from '@/types';

interface UserStore {
  user: User | null;
  profile: UserProfile | null;
  setUser: (user: User | null) => void;
  setProfile: (user: UserProfile | null) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile: UserProfile | null) => set({ profile }),
  updateProfile: (updates) => set((state) => ({
    profile: state.profile ? { ...state.profile, ...updates } : null
  })),
  logout: () => set({ user: null, profile: null }),
}));
