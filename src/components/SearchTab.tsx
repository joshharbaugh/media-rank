import React, { useState } from 'react';
import { Search, Film, Tv, Book, Loader2, Gamepad2 } from 'lucide-react';
import { Media, MediaType } from '@/types';
import { MediaCard } from '@/components/MediaCard';
import { useSearch } from '@/hooks/useSearch';

interface SearchTabProps {
  onAddToRankings: (media: Media) => void;
}

export const SearchTab = ({ onAddToRankings }: SearchTabProps): React.ReactElement => {
  const { searchMedia, searchResults, setSearchResults, isLoading, setIsLoading } = useSearch();
  const [mediaType, setMediaType] = useState<MediaType>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    searchMedia(mediaType, searchQuery);
  };

  const handleMediaTypeChange = (type: MediaType) => {
    setMediaType(type);
    setSearchResults([]);
    setHasSearched(false);
  };

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'movie': return <Film className="w-4 h-4" />;
      case 'tv': return <Tv className="w-4 h-4" />;
      case 'book': return <Book className="w-4 h-4" />;
      case 'game': return <Gamepad2 className="w-4 h-4" />;
    }
  };

  const getPlaceholder = () => {
    switch (mediaType) {
      case 'movie': return 'Search for movies...';
      case 'tv': return 'Search for TV shows...';
      case 'book': return 'Search for books...';
      case 'game': return 'Search for games...';
    }
  };

  return (
    <div className="space-y-6">
      {/* Media Type Selector */}
      <div className="flex gap-2 justify-center">
        {(['movie', 'tv', 'book', 'game'] as const).map((type) => (
          <button
            key={type}
            onClick={() => handleMediaTypeChange(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              mediaType === type
                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {getMediaIcon(type)}
            <span className="hidden md:block capitalize">
              {type === 'tv' ? 'TV' : `${type}s`}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getPlaceholder()}
            className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {/* Results Section */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : hasSearched && searchResults.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No results found
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            Try searching for something else or browse our suggestions below
          </p>
        </div>
      ) : searchResults.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {hasSearched ? 'Search Results' : 'Suggestions'}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
            </span>
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
            {searchResults.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                onAddToRankings={onAddToRankings}
              />
            ))}
          </div>
        </>
      ) : !hasSearched ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 dark:bg-indigo-900/20 rounded-full mb-4">
            {getMediaIcon(mediaType)}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Discover {mediaType === 'tv' ? 'TV Shows' : `${mediaType}s`}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Search for your favorite {mediaType === 'tv' ? 'TV shows' : `${mediaType}s`} and add them to your personal rankings
          </p>
        </div>
      ) : null}
    </div>
  );
};
