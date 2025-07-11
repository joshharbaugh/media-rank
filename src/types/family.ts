import { Timestamp } from "firebase/firestore";

export type FamilyRole = 'parent' | 'guardian' | 'child' | 'grandmother' | 'grandfather' | 'aunt' | 'uncle' | 'cousin' | 'sibling' | 'other';

export interface FamilyMemberRole {
  userId: string;
  familyId: string;
  role: FamilyRole;
  joinedAt: Timestamp;
  isActive: boolean;
}

export interface FamilyMember {
  userId: string;
  role: FamilyRole;
  displayName: string;
  photoURL?: string | null;
  joinedAt?: Timestamp;
  isActive: boolean;
}

export interface Family {
  id: string;
  name: string;
  description?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy: string; // userId of the family creator
  memberIds: string[]; // Array of userIds instead of FamilyMember objects
  settings: {
    allowChildRankings: boolean;
    requireParentApproval: boolean;
    privacyLevel: 'private' | 'family-only' | 'public';
  };
}
