import React, { useState, useEffect } from 'react';
import { Users, Plus, Loader2 } from 'lucide-react';
import { useFamilyStore } from '@/store/familyStore';
import { useUserStore } from '@/store/userStore';
import { FamilyOverview } from '@/components/family/FamilyOverview';
import { CreateFamilyModal } from '@/components/family/CreateFamilyModal';

export const FamilyView: React.FC = () => {
  const { families, currentFamily, loading, error, fetchUserFamilies, setCurrentFamily } = useFamilyStore();
  const { user } = useUserStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchUserFamilies(user.uid);
    }
  }, [user?.uid, fetchUserFamilies]);

  const handleCreateSuccess = () => {
    // The store will automatically update with the new family
    setShowCreateModal(false);
  };

  if (loading && families.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (families.length === 0) {
    return (
      <div className="space-y-6">
        {/* Empty State */}
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            No families yet!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Create a family to start sharing rankings and experiences with your loved ones.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Family
          </button>
        </div>

        {/* Create Family Modal */}
        <CreateFamilyModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Family
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your family profiles and settings
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Family
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Family Selection */}
      {families.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Select Family
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {families.map((family) => (
              <button
                key={family.id}
                onClick={() => setCurrentFamily(family)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  currentFamily?.id === family.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {family.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {family.members.length} members
                </p>
                {family.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                    {family.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Family Overview */}
      {currentFamily && user && (
        <FamilyOverview
          family={currentFamily}
          currentUserId={user.uid}
        />
      )}

      {/* Create Family Modal */}
      <CreateFamilyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};
