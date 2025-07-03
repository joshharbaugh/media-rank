import React, { useState, useEffect, useRef } from 'react';
import { X, Star, Calendar, MessageSquare, Save, Sparkles } from 'lucide-react';
import { Media, Ranking } from '../types';
import { getMediaIcon } from '../utils/helpers';

interface AddRankingModalProps {
  media: Media;
  onSave: (ranking: Ranking) => void;
  onClose: () => void;
  existingRanking?: Ranking;
}

const ratingDescriptions = [
  { rating: 1, text: "Not for me", emoji: "😞" },
  { rating: 2, text: "It was okay", emoji: "😐" },
  { rating: 3, text: "Pretty good", emoji: "🙂" },
  { rating: 4, text: "Really enjoyed it", emoji: "😊" },
  { rating: 5, text: "Absolutely loved it!", emoji: "🤩" }
];

const quickNotes = [
  "Great story",
  "Amazing visuals",
  "Compelling characters",
  "Slow pacing",
  "Highly recommend",
  "Not what I expected",
  "Instant classic",
  "Worth the hype"
];

export const AddRankingModal = ({ 
  media, 
  onSave, 
  onClose,
  existingRanking 
}: AddRankingModalProps): React.ReactElement => {
  const [rankValue, setRankValue] = useState(existingRanking?.rank || 3);
  const [notes, setNotes] = useState(existingRanking?.notes || '');
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const Icon = getMediaIcon(media.type);
  const currentRating = hoveredStar || rankValue;
  const ratingInfo = ratingDescriptions.find(r => r.rating === currentRating);

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

  const handleSave = () => {
    const newRanking: Ranking = {
      id: existingRanking?.id || Date.now().toString(),
      mediaId: media.id,
      media: media,
      rank: rankValue,
      notes: notes.trim()
    };
    
    // Animate out before saving
    setIsAnimating(false);
    setTimeout(() => {
      onSave(newRanking);
    }, 200);
  };

  const handleQuickNote = (note: string) => {
    setNotes(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}. ${note}` : note;
    });
    notesRef.current?.focus();
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
              {existingRanking ? 'Edit Ranking' : 'Add to Rankings'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Media Info */}
          <div className="flex items-center gap-4">
            <img
              src={media.poster}
              alt={media.title}
              className="w-16 h-24 object-cover rounded shadow-sm"
            />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                {media.title}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <Icon className="w-4 h-4" />
                <span>{media.releaseDate}</span>
                {media.rating && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{media.rating}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rating Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Your Rating
            </label>
            
            {/* Star Rating */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRankValue(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(null)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= currentRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Rating Description */}
            {ratingInfo && (
              <div className="text-center animate-fade-in">
                <span className="text-2xl mr-2">{ratingInfo.emoji}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {ratingInfo.text}
                </span>
              </div>
            )}
          </div>
          
          {/* Notes Section */}
          <div>
            <label 
              htmlFor="notes" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Notes <span className="text-gray-500">(optional)</span>
            </label>
            
            {/* Quick Notes */}
            <div className="flex flex-wrap gap-2 mb-3">
              {quickNotes.map((note) => (
                <button
                  key={note}
                  onClick={() => handleQuickNote(note)}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                >
                  {note}
                </button>
              ))}
            </div>
            
            <textarea
              ref={notesRef}
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none transition-all"
              rows={3}
              placeholder="What did you think? Add your thoughts..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {notes.length}/500
            </p>
          </div>
          
          {/* Date Added */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>
              {existingRanking ? 'Updated' : 'Added'} on {new Date().toLocaleDateString()}
            </span>
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
            <Save className="w-4 h-4" />
            {existingRanking ? 'Update' : 'Add'} Ranking
          </button>
        </div>
      </div>
    </div>
  );
};