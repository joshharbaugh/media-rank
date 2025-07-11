import { create } from 'zustand';
import { Family, FamilyMember, FamilyRole } from '@/types';
import { FamilyService } from '@/services/familyService';
import { Timestamp } from 'firebase/firestore';
import { useUserStore } from '@/store/userStore';

interface FamilyStore {
  families: Family[];
  currentFamily: Family | null;
  loading: boolean;
  error: string | null;

  // Actions
  createFamily: (name: string, description?: string) => Promise<void>;
  fetchUserFamilies: (userId: string) => Promise<void>;
  setCurrentFamily: (family: Family | null) => void;
  addFamilyMember: (familyId: string, userId: string, role: FamilyRole, displayName: string, photoURL?: string) => Promise<void>;
  removeFamilyMember: (familyId: string, userId: string) => Promise<void>;
  updateFamilySettings: (familyId: string, settings: Partial<Family['settings']>) => Promise<void>;
  updateFamily: (familyId: string, updates: Partial<Pick<Family, 'name' | 'description'>>) => Promise<void>;
  deleteFamily: (familyId: string, userId: string) => Promise<void>;
  clearError: () => void;
}

export const useFamilyStore = create<FamilyStore>((set) => ({
  families: [],
  currentFamily: null,
  loading: false,
  error: null,

  createFamily: async (name: string, description?: string) => {
    set({ loading: true, error: null });
    try {
      // Get current user from userStore
      const userStore = useUserStore.getState();
      const userId = userStore.user?.uid;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const family = await FamilyService.createFamily(userId, name, description);

      set(state => ({
        families: [family, ...state.families],
        currentFamily: family,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create family';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchUserFamilies: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const families = await FamilyService.getUserFamilies(userId);
      set({ families, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch families';
      set({ error: errorMessage, loading: false });
    }
  },

  setCurrentFamily: (family: Family | null) => {
    set({ currentFamily: family });
  },

  addFamilyMember: async (familyId: string, userId: string, role: FamilyRole, displayName: string, photoURL?: string) => {
    set({ loading: true, error: null });
    try {
      await FamilyService.addFamilyMember(familyId, userId, role, displayName, photoURL);

      // Update local state
      set(state => ({
        families: state.families.map(family => {
          if (family.id === familyId) {
                         const newMember: FamilyMember = {
               userId,
               role,
               displayName,
               photoURL,
               joinedAt: new Date() as unknown as Timestamp, // TODO: Fix timestamp type
               isActive: true
             };
            return {
              ...family,
              members: [...family.members, newMember]
            };
          }
          return family;
        }),
        currentFamily: state.currentFamily?.id === familyId
                     ? { ...state.currentFamily, members: [...state.currentFamily.members, {
               userId,
               role,
               displayName,
               photoURL,
               joinedAt: new Date() as unknown as Timestamp,
               isActive: true
             }]}
          : state.currentFamily,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add family member';
      set({ error: errorMessage, loading: false });
    }
  },

  removeFamilyMember: async (familyId: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      await FamilyService.removeFamilyMember(familyId, userId);

      // Update local state
      set(state => ({
        families: state.families.map(family => {
          if (family.id === familyId) {
            return {
              ...family,
              members: family.members.filter(m => m.userId !== userId)
            };
          }
          return family;
        }),
        currentFamily: state.currentFamily?.id === familyId
          ? { ...state.currentFamily, members: state.currentFamily.members.filter(m => m.userId !== userId) }
          : state.currentFamily,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove family member';
      set({ error: errorMessage, loading: false });
    }
  },

  updateFamilySettings: async (familyId: string, settings: Partial<Family['settings']>) => {
    set({ loading: true, error: null });
    try {
      await FamilyService.updateFamilySettings(familyId, settings);

      // Update local state
      set(state => ({
        families: state.families.map(family => {
          if (family.id === familyId) {
            return {
              ...family,
              settings: { ...family.settings, ...settings }
            };
          }
          return family;
        }),
        currentFamily: state.currentFamily?.id === familyId
          ? { ...state.currentFamily, settings: { ...state.currentFamily.settings, ...settings } }
          : state.currentFamily,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update family settings';
      set({ error: errorMessage, loading: false });
    }
  },

  updateFamily: async (familyId: string, updates: Partial<Pick<Family, 'name' | 'description'>>) => {
    set({ loading: true, error: null });
    try {
      await FamilyService.updateFamily(familyId, updates);

      // Update local state
      set(state => ({
        families: state.families.map(family => {
          if (family.id === familyId) {
            return { ...family, ...updates };
          }
          return family;
        }),
        currentFamily: state.currentFamily?.id === familyId
          ? { ...state.currentFamily, ...updates }
          : state.currentFamily,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update family';
      set({ error: errorMessage, loading: false });
    }
  },

  deleteFamily: async (familyId: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      await FamilyService.deleteFamily(familyId, userId);

      // Update local state
      set(state => ({
        families: state.families.filter(family => family.id !== familyId),
        currentFamily: state.currentFamily?.id === familyId ? null : state.currentFamily,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete family';
      set({ error: errorMessage, loading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
