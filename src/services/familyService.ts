import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Family, FamilyMemberRole, FamilyRole } from '@/types/family';
import { UserProfile } from '@/types/user';
import { v4 as uuidv4 } from 'uuid';

export class FamilyService {
  private static getFamiliesRef() {
    return collection(db, 'families');
  }

  private static getFamilyRef(familyId: string) {
    return doc(db, 'families', familyId);
  }

  private static getFamilyMemberRolesRef() {
    return collection(db, 'familyMemberRoles');
  }

  private static getFamilyMemberRoleRef(familyId: string, userId: string) {
    return doc(db, 'familyMemberRoles', `${familyId}_${userId}`);
  }

  // Create a new family
  static async createFamily(
    creatorId: string,
    name: string,
    description?: string
  ): Promise<Family> {
    try {
      const familyId = uuidv4();
      const batch = writeBatch(db);

      // Create the family document
      const family: Family = {
        id: familyId,
        name,
        description,
        createdAt: serverTimestamp() as Timestamp,
        createdBy: creatorId,
        memberIds: [creatorId], // Start with just the creator
        settings: {
          allowChildRankings: true,
          requireParentApproval: false,
          privacyLevel: 'private'
        }
      };

      batch.set(this.getFamilyRef(familyId), family);

      // Create the creator's member role
      const creatorRole: FamilyMemberRole = {
        userId: creatorId,
        familyId,
        role: 'parent',
        joinedAt: serverTimestamp() as Timestamp,
        isActive: true
      };

      batch.set(this.getFamilyMemberRoleRef(familyId, creatorId), creatorRole);

      await batch.commit();
      return family;
    } catch (error) {
      console.error('Error creating family:', error);
      throw new Error('Failed to create family');
    }
  }

  // Get family by ID
  static async getFamily(familyId: string): Promise<Family | null> {
    try {
      const familyDoc = await getDoc(this.getFamilyRef(familyId));

      if (!familyDoc.exists()) {
        return null;
      }

      return {
        id: familyDoc.id,
        ...familyDoc.data()
      } as Family;
    } catch (error) {
      console.error('Error fetching family:', error);
      throw new Error('Failed to fetch family');
    }
  }

  // Get families for a user
  static async getUserFamilies(userId: string): Promise<Family[]> {
    try {
      const familiesRef = this.getFamiliesRef();
      const q = query(
        familiesRef,
        where('memberIds', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Family));
    } catch (error) {
      console.error('Error fetching user families:', error);
      throw new Error('Failed to fetch user families');
    }
  }

  // Add member to family
  static async addFamilyMember(
    familyId: string,
    userId: string,
    role: FamilyRole
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      const familyRef = this.getFamilyRef(familyId);
      const familyDoc = await getDoc(familyRef);

      if (!familyDoc.exists()) {
        throw new Error('Family not found');
      }

      const family = familyDoc.data() as Family;

      // Check if user is already a member
      if (family.memberIds.includes(userId)) {
        throw new Error('User is already a member of this family');
      }

      // Add user to family's memberIds array
      const updatedMemberIds = [...family.memberIds, userId];
      batch.update(familyRef, {
        memberIds: updatedMemberIds,
        updatedAt: serverTimestamp() as Timestamp
      });

      // Create member role document
      const memberRole: FamilyMemberRole = {
        userId,
        familyId,
        role,
        joinedAt: serverTimestamp() as Timestamp,
        isActive: true
      };

      batch.set(this.getFamilyMemberRoleRef(familyId, userId), memberRole);

      await batch.commit();
    } catch (error) {
      console.error('Error adding family member:', error);
      throw new Error('Failed to add family member');
    }
  }

  // Remove member from family
  static async removeFamilyMember(familyId: string, userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const familyRef = this.getFamilyRef(familyId);
      const familyDoc = await getDoc(familyRef);

      if (!familyDoc.exists()) {
        throw new Error('Family not found');
      }

      const family = familyDoc.data() as Family;

      // Remove user from family's memberIds array
      const updatedMemberIds = family.memberIds.filter(id => id !== userId);
      batch.update(familyRef, {
        memberIds: updatedMemberIds,
        updatedAt: serverTimestamp()
      });

      // Delete member role document
      batch.delete(this.getFamilyMemberRoleRef(familyId, userId));

      await batch.commit();
    } catch (error) {
      console.error('Error removing family member:', error);
      throw new Error('Failed to remove family member');
    }
  }

  // Update member role
  static async updateMemberRole(
    familyId: string,
    userId: string,
    newRole: FamilyRole
  ): Promise<void> {
    try {
      const memberRoleRef = this.getFamilyMemberRoleRef(familyId, userId);
      const memberRoleDoc = await getDoc(memberRoleRef);

      if (!memberRoleDoc.exists()) {
        throw new Error('Member role not found');
      }

      await updateDoc(memberRoleRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      throw new Error('Failed to update member role');
    }
  }

  // Update family settings
  static async updateFamilySettings(
    familyId: string,
    settings: Partial<Family['settings']>
  ): Promise<void> {
    try {
      const familyRef = this.getFamilyRef(familyId);

      await updateDoc(familyRef, {
        settings: settings,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating family settings:', error);
      throw new Error('Failed to update family settings');
    }
  }

  // Update family information
  static async updateFamily(
    familyId: string,
    updates: Partial<Pick<Family, 'name' | 'description'>>
  ): Promise<void> {
    try {
      const familyRef = this.getFamilyRef(familyId);

      await updateDoc(familyRef, {
        ...updates,
        updatedAt: serverTimestamp() as Timestamp
      });
    } catch (error) {
      console.error('Error updating family:', error);
      throw new Error('Failed to update family');
    }
  }

  // Delete family (only by creator)
  static async deleteFamily(familyId: string, userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const familyRef = this.getFamilyRef(familyId);
      const familyDoc = await getDoc(familyRef);

      if (!familyDoc.exists()) {
        throw new Error('Family not found');
      }

      const family = familyDoc.data() as Family;

      if (family.createdBy !== userId) {
        throw new Error('Only the family creator can delete the family');
      }

      // Delete all member role documents
      const memberRolesRef = this.getFamilyMemberRolesRef();
      const memberRolesQuery = query(memberRolesRef, where('familyId', '==', familyId));
      const memberRolesSnapshot = await getDocs(memberRolesQuery);

      memberRolesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete the family document
      batch.delete(familyRef);

      await batch.commit();
    } catch (error) {
      console.error('Error deleting family:', error);
      throw new Error('Failed to delete family');
    }
  }

  // Get family member roles
  static async getFamilyMemberRoles(familyId: string): Promise<FamilyMemberRole[]> {
    try {
      const memberRolesRef = this.getFamilyMemberRolesRef();
      const q = query(
        memberRolesRef,
        where('familyId', '==', familyId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as FamilyMemberRole));
    } catch (error) {
      console.error('Error fetching family member roles:', error);
      throw new Error('Failed to fetch family member roles');
    }
  }

  // Get family members with user details
  static async getFamilyMembersWithDetails(familyId: string): Promise<(FamilyMemberRole & { userProfile?: UserProfile })[]> {
    try {
      const memberRoles = await this.getFamilyMemberRoles(familyId);

      // Eventually, we would fetch user profiles for each member
      // For now, we'll return just the member roles
      return memberRoles;
    } catch (error) {
      console.error('Error fetching family members with details:', error);
      throw new Error('Failed to fetch family members with details');
    }
  }

  // Check if user is member of family
  static async isUserFamilyMember(familyId: string, userId: string): Promise<boolean> {
    try {
      const family = await this.getFamily(familyId);

      if (!family) {
        return false;
      }

      return family.memberIds.includes(userId);
    } catch (error) {
      console.error('Error checking family membership:', error);
      return false;
    }
  }

  // Get user's role in family
  static async getUserFamilyRole(familyId: string, userId: string): Promise<FamilyRole | null> {
    try {
      const memberRoleRef = this.getFamilyMemberRoleRef(familyId, userId);
      const memberRoleDoc = await getDoc(memberRoleRef);

      if (!memberRoleDoc.exists()) {
        return null;
      }

      const memberRole = memberRoleDoc.data() as FamilyMemberRole;
      return memberRole.role;
    } catch (error) {
      console.error('Error getting user family role:', error);
      return null;
    }
  }

  // Get all families where user has a specific role
  static async getUserFamiliesByRole(userId: string, role: FamilyRole): Promise<Family[]> {
    try {
      const memberRolesRef = this.getFamilyMemberRolesRef();
      const q = query(
        memberRolesRef,
        where('userId', '==', userId),
        where('role', '==', role),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const familyIds = snapshot.docs.map(doc => doc.data().familyId);

      if (familyIds.length === 0) {
        return [];
      }

      // Fetch the actual family documents
      const families: Family[] = [];
      for (const familyId of familyIds) {
        const family = await this.getFamily(familyId);
        if (family) {
          families.push(family);
        }
      }

      return families;
    } catch (error) {
      console.error('Error fetching user families by role:', error);
      throw new Error('Failed to fetch user families by role');
    }
  }
}
