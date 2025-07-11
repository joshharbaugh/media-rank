import { X, Save, Moon, Sun } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '@/store/themeStore';

interface UserSettingsModalProps {
  onSave: () => void;
  onClose: () => void;
}

export const UserSettingsModal = ({
  onSave,
  onClose,
}: UserSettingsModalProps): React.ReactElement => {
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { theme } = useThemeStore();

  useEffect(() => {
    // Focus trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    // Animate in
    setIsAnimating(true);
  }, []);

  // TODO: Implement save functionality
  const handleSave = () => {
    // Animate out before saving
    setIsAnimating(false);
    setTimeout(() => {
      onSave();
    }, 200);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 transition-opacity duration-200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full transform transition-all duration-200 ${
          isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Update Settings
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            {/* TODO: Add settings here */}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Update
          </button>
        </div>
      </div>
    </div>
  )
}
