import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/Auth';
import { RankingService } from '@/services/rankingService';
import { Ranking, Media, UserStats } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';

interface UseRankingsReturn {
  rankings: Ranking[];
  loading: boolean;
  error: string | null;
  addRanking: (rank: number, notes?: string, media?: Media) => Promise<void>;
  updateRanking: (ranking: Ranking) => Promise<void>;
  deleteRanking: (rankingId: string) => Promise<void>;
  checkIfRanked: (mediaId: string) => Promise<{ exists: boolean; ranking?: Ranking }>;
  getUserStats: () => Promise<UserStats | null>;
  refreshRankings: () => Promise<void>;
}

export const useRankings = (): UseRankingsReturn => {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch rankings from Firestore
  const fetchRankings = useCallback(async () => {
    if (!user) {
      setRankings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userRankings = await RankingService.getUserRankings(user.uid);
      setRankings(userRankings);
    } catch (err) {
      console.error('Error fetching rankings:', err);
      setError('Failed to load rankings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  // Add a new ranking
  const addRanking = useCallback(async (
    rank: number,
    notes?: string,
    media?: Media
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Check if already ranked
      const { exists, ranking: existingRanking } = await RankingService.isMediaRanked(
        user.uid,
        media?.id || ''
      );

      if (exists && existingRanking) {
        // Update existing ranking
        const updatedRanking: Ranking = {
          ...existingRanking,
          rank,
          notes: notes || existingRanking.notes,
          updatedAt: Timestamp.fromDate(new Date())
        };
        await RankingService.saveRanking(user.uid, updatedRanking);

        // Update local state
        setRankings(prev =>
          prev.map(r => r.id === updatedRanking.id ? updatedRanking : r)
        );
      } else {
        // Create new ranking
        const newRanking: Ranking = {
          id: uuidv4(),
          mediaId: media?.id || '',
          media,
          rank,
          notes: notes || '',
          createdAt: Timestamp.fromDate(new Date()),
        };

        await RankingService.saveRanking(user.uid, newRanking);

        // Update local state
        setRankings(prev => [newRanking, ...prev]);
      }
    } catch (err) {
      console.error('Error adding ranking:', err);
      throw new Error('Failed to add ranking');
    }
  }, [user]);

  // Update an existing ranking
  const updateRanking = useCallback(async (ranking: Ranking) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await RankingService.saveRanking(user.uid, ranking);

      // Update local state
      setRankings(prev =>
        prev.map(r => r.id === ranking.id ? ranking : r)
      );
    } catch (err) {
      console.error('Error updating ranking:', err);
      throw new Error('Failed to update ranking');
    }
  }, [user]);

  // Delete a ranking
  const deleteRanking = useCallback(async (rankingId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await RankingService.deleteRanking(user.uid, rankingId);

      // Update local state
      setRankings(prev => prev.filter(r => r.id !== rankingId));
    } catch (err) {
      console.error('Error deleting ranking:', err);
      throw new Error('Failed to delete ranking');
    }
  }, [user]);

  // Check if a media item is already ranked
  const checkIfRanked = useCallback(async (mediaId: string) => {
    if (!user) return { exists: false };

    try {
      return await RankingService.isMediaRanked(user.uid, mediaId);
    } catch (err) {
      console.error('Error checking ranking:', err);
      return { exists: false };
    }
  }, [user]);

  // Get user statistics
  const getUserStats = useCallback(async () => {
    if (!user) return null;
    return await RankingService.getUserStats(user.uid);
  }, [user]);

  // Refresh rankings from Firestore
  const refreshRankings = useCallback(async () => {
    await fetchRankings();
  }, [fetchRankings]);

  return {
    rankings,
    loading,
    error,
    addRanking,
    updateRanking,
    deleteRanking,
    checkIfRanked,
    getUserStats,
    refreshRankings
  };
};
