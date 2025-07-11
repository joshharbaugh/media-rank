import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserProfile } from '@/types/user';
import { UserService } from '@/services/userService';

interface UserStore {
  user: User | null;
  profile: UserProfile | null;
  users: User[] | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchUser: (userId: string) => Promise<void>;
  fetchUsersByName: (name: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  profile: null,
  users: null,
  loading: false,
  error: null,

  fetchUser: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const user = await UserService.getUser(userId);
      set({ user, loading: false });
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

  setProfile: (profile: UserProfile | null) => set({ profile }),

  updateProfile: (updates) => set((state) => ({
    profile: state.profile ? { ...state.profile, ...updates } : null
  })),

  logout: () => set({ user: null, profile: null }),
}));
