import { useState, useEffect, useCallback } from 'react';
import { UserService } from '@/services/userService';
import { UserProfile } from '@/types/user';

interface UseUserSearchOptions {
  debounceMs?: number;
  minSearchLength?: number;
  maxResults?: number;
}

interface SearchResult extends UserProfile {
  _score?: number;
  relevance?: 'exact' | 'prefix' | 'fuzzy' | 'partial';
}

interface UseUserSearchReturn {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  search: (query: string) => void;
  clearResults: () => void;
  suggestions: string[];
}

export function useUserSearch(options: UseUserSearchOptions = {}): UseUserSearchReturn {
  const {
    debounceMs = 300,
    minSearchLength = 2,
    maxResults = 10
  } = options;

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const clearResults = useCallback(() => {
    setResults([]);
    setSuggestions([]);
    setError(null);
  }, []);

  const search = useCallback(async (query: string) => {
    setLoading(true);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Clear results if query is empty
    if (!query || query.trim().length === 0) {
      clearResults();
      return;
    }

    // Set up debounced search
    const timeout = setTimeout(async () => {
      // Check minimum length
      if (query.trim().length < minSearchLength) {
        setError(`Search query must be at least ${minSearchLength} characters`);
        return;
      }

      setError(null);

      try {
        try {
          // Hydrate the search index
          await UserService.updateAllUsersForSearch();
        } catch (error) {
          console.error('Error hydrating search index:', error);
        }

        console.log('User Search', query);

        const searchTerm = query.trim();

        // Get search results
        const searchResults = await UserService.getUsersByName(searchTerm, maxResults);

        // Get suggestions for autocomplete
        const searchSuggestions = await UserService.suggestUsers(searchTerm, 5);

        // Process and score results
        const processedResults: SearchResult[] = searchResults.map(user => {
          const displayNameLower = user.displayName.toLowerCase();
          const searchTermLower = searchTerm.toLowerCase();

          let relevance: SearchResult['relevance'] = 'partial';
          let score = 0;

          // Determine relevance and score
          if (displayNameLower === searchTermLower) {
            relevance = 'exact';
            score = 100;
          } else if (displayNameLower.startsWith(searchTermLower)) {
            relevance = 'prefix';
            score = 80;
          } else if (displayNameLower.includes(searchTermLower)) {
            relevance = 'partial';
            score = 60;
          } else {
            // Fuzzy match (handled by Elasticsearch)
            relevance = 'fuzzy';
            score = 40;
          }

          // Boost score if user has a profile picture
          if (user.photoURL) {
            score += 5;
          }

          // Boost score if user has a bio
          if (user.bio) {
            score += 3;
          }

          return {
            ...user,
            _score: score,
            relevance
          };
        });

        // Sort by score (highest first)
        processedResults.sort((a, b) => (b._score || 0) - (a._score || 0));

        setResults(processedResults);
        setSuggestions(searchSuggestions);
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'Failed to search users');
        setResults([]);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    setSearchTimeout(timeout);
  }, [debounceMs, minSearchLength, maxResults, searchTimeout, clearResults]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
    suggestions
  };
}
