import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Family, FamilyMember, FamilyRole } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export class FamilyService {
  private static getFamiliesRef() {
    return collection(db, 'families');
  }

  private static getFamilyRef(familyId: string) {
    return doc(db, 'families', familyId);
  }

  // Create a new family
  static async createFamily(
    creatorId: string,
    name: string,
    description?: string
  ): Promise<Family> {
    try {
      const familyId = uuidv4();
      const family: Family = {
        id: familyId,
        name,
        description,
        createdAt: serverTimestamp() as Timestamp,
        createdBy: creatorId,
        members: [{
          userId: creatorId,
          role: 'parent',
          displayName: 'Creator', // Will be updated with actual user data
          joinedAt: serverTimestamp() as Timestamp,
          isActive: true
        }],
        settings: {
          allowChildRankings: true,
          requireParentApproval: false,
          privacyLevel: 'private'
        }
      };

      await setDoc(this.getFamilyRef(familyId), family);
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
        where('members', 'array-contains', { userId }),
        orderBy('updatedAt', 'desc')
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
    role: FamilyRole,
    displayName: string,
    photoURL?: string
  ): Promise<void> {
    try {
      const familyRef = this.getFamilyRef(familyId);
      const familyDoc = await getDoc(familyRef);

      if (!familyDoc.exists()) {
        throw new Error('Family not found');
      }

      const family = familyDoc.data() as Family;
      const newMember: FamilyMember = {
        userId,
        role,
        displayName,
        photoURL,
        joinedAt: serverTimestamp() as Timestamp,
        isActive: true
      };

      // Check if user is already a member
      const existingMemberIndex = family.members.findIndex(m => m.userId === userId);

      if (existingMemberIndex >= 0) {
        // Update existing member
        family.members[existingMemberIndex] = newMember;
      } else {
        // Add new member
        family.members.push(newMember);
      }

      await updateDoc(familyRef, {
        members: family.members,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding family member:', error);
      throw new Error('Failed to add family member');
    }
  }

  // Remove member from family
  static async removeFamilyMember(familyId: string, userId: string): Promise<void> {
    try {
      const familyRef = this.getFamilyRef(familyId);
      const familyDoc = await getDoc(familyRef);

      if (!familyDoc.exists()) {
        throw new Error('Family not found');
      }

      const family = familyDoc.data() as Family;
      const updatedMembers = family.members.filter(m => m.userId !== userId);

      await updateDoc(familyRef, {
        members: updatedMembers,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing family member:', error);
      throw new Error('Failed to remove family member');
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
      const familyRef = this.getFamilyRef(familyId);
      const familyDoc = await getDoc(familyRef);

      if (!familyDoc.exists()) {
        throw new Error('Family not found');
      }

      const family = familyDoc.data() as Family;

      if (family.createdBy !== userId) {
        throw new Error('Only the family creator can delete the family');
      }

      await deleteDoc(familyRef);
    } catch (error) {
      console.error('Error deleting family:', error);
      throw new Error('Failed to delete family');
    }
  }

  // Get family members with user details
  static async getFamilyMembersWithDetails(familyId: string): Promise<FamilyMember[]> {
    try {
      const family = await this.getFamily(familyId);

      if (!family) {
        throw new Error('Family not found');
      }

      // In a real app, you might want to fetch additional user details
      // from the users collection for each member
      return family.members;
    } catch (error) {
      console.error('Error fetching family members:', error);
      throw new Error('Failed to fetch family members');
    }
  }

  // Check if user is member of family
  static async isUserFamilyMember(familyId: string, userId: string): Promise<boolean> {
    try {
      const family = await this.getFamily(familyId);

      if (!family) {
        return false;
      }

      return family.members.some(member => member.userId === userId);
    } catch (error) {
      console.error('Error checking family membership:', error);
      return false;
    }
  }

  // Get user's role in family
  static async getUserFamilyRole(familyId: string, userId: string): Promise<FamilyRole | null> {
    try {
      const family = await this.getFamily(familyId);

      if (!family) {
        return null;
      }

      const member = family.members.find(m => m.userId === userId);
      return member?.role || null;
    } catch (error) {
      console.error('Error getting user family role:', error);
      return null;
    }
  }
}
