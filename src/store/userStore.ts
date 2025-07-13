import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserProfile } from '@/types/user';
import { UserService } from '@/services/userService';

interface UserStore {
  user: User | null;
  userProfile: UserProfile | null;
  users: UserProfile[] | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchUser: (userId: string) => Promise<void>;
  fetchUsersByName: (name: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setUserProfile: (userProfile: UserProfile | null) => void;
  updateUserProfile: (userProfile: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  userProfile: null,
  users: null,
  loading: false,
  error: null,

  fetchUser: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const userProfile = await UserService.getUserProfile(userId);
      set({ userProfile, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchUsersByName: async (name: string) => {
    set({ loading: true, error: null });
    try {
      const users = await UserService.getUsersByName(name);
      set({ users, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      set({ error: errorMessage, loading: false });
    }
  },

  setUser: (user) => set({ user }),

  setUserProfile: (userProfile: UserProfile | null) => set({ userProfile }),

  updateUserProfile: (updates) => set((state) => ({
    userProfile: state.userProfile ? { ...state.userProfile, ...updates } : null
  })),

  logout: () => set({ user: null, userProfile: null }),
}));
