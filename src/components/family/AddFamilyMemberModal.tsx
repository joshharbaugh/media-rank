import React, { useEffect, useState } from 'react';
import { X, Users, Save, Loader2 } from 'lucide-react';
import { useFamilyStore } from '@/store/familyStore';
import { useUserStore } from '@/store/userStore';
import { FamilyRole } from '@/types/family';

interface AddFamilyMemberModalProps {
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddFamilyMemberModal: React.FC<AddFamilyMemberModalProps> = ({
  currentUserId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { addFamilyMember, clearError, currentFamily, loading, error } = useFamilyStore();
  const { users, loading: usersLoading, error: usersError, fetchUsersByName } = useUserStore();
  const [userId, setUserId] = useState('');
  const [role] = useState<FamilyRole>('other');
  const [search, setSearch] = useState('');
  console.log('AddFamilyMemberModal', currentUserId);

  // Search for users
  useEffect(() => {
    if (search) {
      // Debounce fetchUsersByName
      const handler = setTimeout(() => {
        fetchUsersByName(search);
      }, 400);
      return () => clearTimeout(handler);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentFamily?.id) {
      return;
    }

    try {
      await addFamilyMember(currentFamily.id, userId, role as FamilyRole);
      handleClose();
      onSuccess?.();
    } catch {
      // Error is handled by the store
    }
  };

  const handleClose = () => {
    clearError();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Add Family Member
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search for users */}
        <div className="p-6 space-y-4">
          <input
            type="text"
            placeholder="Search for users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
          />

          {/* Error and loading */}
          {usersError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{usersError}</p>
            </div>
          )}
          {usersLoading && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-sm text-orange-600 dark:text-orange-400">Searching for users...</p>
            </div>
          )}

          {/* Users */}
          {users && !usersLoading && !usersError && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {users.map((user) => (
                <div key={user.uid} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors" onClick={() => setUserId(user.uid)}>
                  <div className="flex items-center gap-2">
                    {user.photoURL && <img src={user.photoURL} alt="User" className="w-6 h-6 rounded-full" />}
                    <span className="text-sm text-gray-700 dark:text-gray-300">{user.displayName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* <div>
            <label htmlFor="family-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              id="family-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter family name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              required
            />
          </div> */}

          {/* <div>
            <label htmlFor="family-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="family-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your family..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 resize-none"
            />
          </div> */}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !userId.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Add Family Member
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
