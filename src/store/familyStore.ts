import { create } from 'zustand';
import { Family, FamilyMember, FamilyMemberRole, FamilyRole } from '@/types/family';
import { FamilyService } from '@/services/familyService';
import { useUserStore } from '@/store/userStore';

interface FamilyStore {
  families: Family[];
  currentFamily: Family | null;
  familyMemberRoles: FamilyMemberRole[];
  familyMembers: FamilyMember[];
  loading: boolean;
  error: string | null;

  // Actions
  createFamily: (name: string, description?: string) => Promise<void>;
  fetchUserFamilies: (userId: string) => Promise<void>;
  setCurrentFamily: (family: Family | null) => void;
  addFamilyMember: (familyId: string, userId: string, role: FamilyRole) => Promise<void>;
  removeFamilyMember: (familyId: string, userId: string) => Promise<void>;
  updateMemberRole: (familyId: string, userId: string, newRole: FamilyRole) => Promise<void>;
  fetchFamilyMemberRoles: (familyId: string) => Promise<void>;
  fetchFamilyMembersWithDetails: (familyId: string) => Promise<void>;
  updateFamilySettings: (familyId: string, settings: Partial<Family['settings']>) => Promise<void>;
  updateFamily: (familyId: string, updates: Partial<Pick<Family, 'name' | 'description'>>) => Promise<void>;
  deleteFamily: (familyId: string, userId: string) => Promise<void>;
  clearError: () => void;
}

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  families: [],
  currentFamily: null,
  familyMemberRoles: [],
  familyMembers: [],
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
      console.log('[FamilyStore] fetchUserFamilies', families);
      set({ families, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch families';
      set({ error: errorMessage, loading: false });
    }
  },

  setCurrentFamily: (family: Family | null) => {
    set({ currentFamily: family });
  },

  addFamilyMember: async (familyId: string, userId: string, role: FamilyRole) => {
    set({ loading: true, error: null });
    try {
      await FamilyService.addFamilyMember(familyId, userId, role);

      // Update local state
      set(state => ({
        families: state.families.map(family => {
          if (family.id === familyId) {
            return {
              ...family,
              memberIds: [...family.memberIds, userId]
            };
          }
          return family;
        }),
        currentFamily: state.currentFamily?.id === familyId
          ? { ...state.currentFamily, memberIds: [...state.currentFamily.memberIds, userId] }
          : state.currentFamily,
        loading: false
      }));

      // Refresh family member roles
      await get().fetchFamilyMemberRoles(familyId);
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
              memberIds: family.memberIds.filter(id => id !== userId)
            };
          }
          return family;
        }),
        currentFamily: state.currentFamily?.id === familyId
          ? { ...state.currentFamily, memberIds: state.currentFamily.memberIds.filter(id => id !== userId) }
          : state.currentFamily,
        familyMemberRoles: state.familyMemberRoles.filter(role => !(role.familyId === familyId && role.userId === userId)),
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove family member';
      set({ error: errorMessage, loading: false });
    }
  },

  updateMemberRole: async (familyId: string, userId: string, newRole: FamilyRole) => {
    set({ loading: true, error: null });
    try {
      await FamilyService.updateMemberRole(familyId, userId, newRole);

      // Update local state
      set(state => ({
        familyMemberRoles: state.familyMemberRoles.map(role => {
          if (role.familyId === familyId && role.userId === userId) {
            return { ...role, role: newRole };
          }
          return role;
        }),
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update member role';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchFamilyMemberRoles: async (familyId: string) => {
    try {
      const memberRoles = await FamilyService.getFamilyMemberRoles(familyId);
      set({ familyMemberRoles: memberRoles });
    } catch (error) {
      console.error('Error fetching family member roles:', error);
    }
  },

  fetchFamilyMembersWithDetails: async (familyId: string) => {
    try {
      const members = await FamilyService.getFamilyMembersWithDetails(familyId);
      set({ familyMembers: members as unknown as FamilyMember[] });
    } catch (error) {
      console.error('Error fetching family members with details:', error);
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
        familyMemberRoles: state.familyMemberRoles.filter(role => role.familyId !== familyId),
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
