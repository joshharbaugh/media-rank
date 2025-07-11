import React, { useEffect, useState } from 'react';
import { Users, Settings, Plus, User } from 'lucide-react';
import { Family, FamilyMember, FamilyRole } from '@/types/family';
import { useFamilyStore } from '@/store/familyStore';
import { UpdateFamilyModal } from '@/components/family/UpdateFamilyModal';
import { AddFamilyMemberModal } from '@/components/family/AddFamilyMemberModal';

interface FamilyOverviewProps {
  family: Family;
  currentUserId: string;
}

const getRoleIcon = (role: FamilyRole) => {
  switch (role) {
    case 'parent':
    case 'guardian':
      return '👨‍👩‍👧‍👦';
    case 'child':
      return '👶';
    case 'grandmother':
    case 'grandfather':
      return '👴👵';
    case 'aunt':
    case 'uncle':
      return '👨‍👩‍👧‍👦';
    case 'cousin':
      return '👥';
    case 'sibling':
      return '👫';
    default:
      return '👤';
  }
};

const getRoleLabel = (role: FamilyRole) => {
  switch (role) {
    case 'parent':
      return 'Parent';
    case 'guardian':
      return 'Guardian';
    case 'child':
      return 'Child';
    case 'grandmother':
      return 'Grandmother';
    case 'grandfather':
      return 'Grandfather';
    case 'aunt':
      return 'Aunt';
    case 'uncle':
      return 'Uncle';
    case 'cousin':
      return 'Cousin';
    case 'sibling':
      return 'Sibling';
    default:
      return 'Other';
  }
};

export const FamilyOverview: React.FC<FamilyOverviewProps> = ({ family, currentUserId }) => {

  const { familyMembers, fetchFamilyMembersWithDetails } = useFamilyStore();
  const [showUpdateFamilyModal, setShowUpdateFamilyModal] = useState(false);
  const [showAddFamilyMemberModal, setShowAddFamilyMemberModal] = useState(false);

  const isCreator = family.createdBy === currentUserId;
  const isParent = familyMembers.some(member => member.userId === currentUserId && member.role === 'parent');

  useEffect(() => {
    if (family.id) fetchFamilyMembersWithDetails(family.id);
  }, [family.id, fetchFamilyMembersWithDetails]);

  return (
    <div className="space-y-6">
      {/* Update Family Modal */}
      <UpdateFamilyModal
        currentUserId={currentUserId}
        isOpen={showUpdateFamilyModal}
        onClose={() => setShowUpdateFamilyModal(false)}
        onDelete={() => setShowUpdateFamilyModal(false)}
        onSuccess={() => setShowUpdateFamilyModal(false)}
      />

      {/* Add Family Member Modal */}
      <AddFamilyMemberModal
        currentUserId={currentUserId}
        isOpen={showAddFamilyMemberModal}
        onClose={() => setShowAddFamilyMemberModal(false)}
        onSuccess={() => setShowAddFamilyMemberModal(false)}
      />

      {/* Family Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              {family.name}
            </h2>
            {family.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {family.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{family.memberIds.length} members</span>
              <span>•</span>
              <span>Created {family.createdAt?.toDate?.() ? family.createdAt.toDate().toLocaleDateString() : 'Recently'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(isCreator || isParent) && (
              <button
                onClick={() => setShowUpdateFamilyModal(true)}
                title="Update Family"
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setShowAddFamilyMemberModal(true)}
              title="Add Family Member"
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Family Members */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Family Members
        </h3>

        <div className="grid gap-4">
          {familyMembers.map((member: FamilyMember) => (
            <div
              key={member.userId}
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                member.userId === currentUserId
                  ? 'border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {member.photoURL ? (
                  <img
                    src={member.photoURL}
                    alt={member.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
              </div>

              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {member.displayName}
                  </h4>
                  {member.userId === currentUserId && (
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                  {member.userId === family.createdBy && (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">
                      Creator
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl">{getRoleIcon(member.role)}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {getRoleLabel(member.role)}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="flex-shrink-0">
                <div className={`w-3 h-3 rounded-full ${
                  member.isActive
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Family Settings Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Family Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              family.settings.allowChildRankings ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Child rankings {family.settings.allowChildRankings ? 'enabled' : 'disabled'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              family.settings.requireParentApproval ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Parent approval {family.settings.requireParentApproval ? 'required' : 'not required'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {family.settings.privacyLevel} privacy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
