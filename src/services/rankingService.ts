import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ranking, UserStats } from '@/types';
import { roundToDecimal } from '@/utils/helpers';
import { v4 as uuidv4 } from 'uuid';

export interface RankingDocument extends Omit<Ranking, 'id'> {
  userId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export class RankingService {
  private static getUserRankingsRef(userId: string) {
    return collection(db, 'rankings', userId, 'userRankings');
  }

  // Create or update a ranking
  static async saveRanking(
    userId: string,
    ranking: Ranking
  ): Promise<void> {
    try {
      const rankingsRef = this.getUserRankingsRef(userId);
      const rankingDoc: RankingDocument = {
        ...ranking,
        userId
      };

      // Update the updatedAt field if the ranking already exists
      if (ranking.createdAt) {
        rankingDoc.updatedAt = serverTimestamp() as Timestamp;
      } else {
        // Set the createdAt field if the ranking is new
        rankingDoc.createdAt = serverTimestamp() as Timestamp;
      }

      await setDoc(doc(rankingsRef, ranking.id), rankingDoc);
    } catch (error) {
      console.error('Error saving ranking:', error);
      throw new Error('Failed to save ranking');
    }
  }

  // Get all rankings for a user
  static async getUserRankings(userId: string): Promise<Ranking[]> {
    try {
      const rankingsRef = this.getUserRankingsRef(userId);
      const q = query(rankingsRef, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Ranking));
    } catch (error) {
      console.error('Error fetching rankings:', error);
      throw new Error('Failed to fetch rankings');
    }
  }

  // Get rankings by media type
  static async getRankingsByType(
    userId: string,
    mediaType: 'movie' | 'tv' | 'book' | 'game'
  ): Promise<Ranking[]> {
    try {
      const rankingsRef = this.getUserRankingsRef(userId);
      const q = query(
        rankingsRef,
        where('media.type', '==', mediaType),
        orderBy('rank', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Ranking));
    } catch (error) {
      console.error('Error fetching rankings by type:', error);
      throw new Error('Failed to fetch rankings');
    }
  }

  // Delete a ranking
  static async deleteRanking(userId: string, rankingId: string): Promise<void> {
    try {
      const rankingRef = doc(this.getUserRankingsRef(userId), rankingId);
      await deleteDoc(rankingRef);
    } catch (error) {
      console.error('Error deleting ranking:', error);
      throw new Error('Failed to delete ranking');
    }
  }

  // Check if media is already ranked
  static async isMediaRanked(
    userId: string,
    mediaId: string
  ): Promise<{ exists: boolean; ranking?: Ranking }> {
    try {
      const rankingsRef = this.getUserRankingsRef(userId);
      const q = query(rankingsRef, where('mediaId', '==', mediaId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { exists: false };
      }

      const doc = snapshot.docs[0];
      return {
        exists: true,
        ranking: {
          id: doc.id,
          ...doc.data()
        } as Ranking
      };
    } catch (error) {
      console.error('Error checking if media is ranked:', error);
      return { exists: false };
    }
  }

  // Get user statistics
  static async getUserStats(userId: string) {
    try {
      const rankings = await this.getUserRankings(userId);

      const stats: UserStats = {
        total: rankings.length,
        totalRatings: rankings.reduce((sum, r) => sum + r.rank, 0),
        movieCount: rankings.filter(r => r.media?.type === 'movie').length,
        tvCount: rankings.filter(r => r.media?.type === 'tv').length,
        bookCount: rankings.filter(r => r.media?.type === 'book').length,
        gameCount: rankings.filter(r => r.media?.type === 'game').length,
        avgRating: rankings.length > 0
          ? roundToDecimal(rankings.reduce((sum, r) => sum + r.rank, 0) / rankings.length, 1)
          : 0,
        highestRated: rankings.sort((a, b) => b.rank - a.rank)[0],
        lowestRated: rankings.sort((a, b) => a.rank - b.rank)[0],
        recentRankings: rankings.sort((a, b) => (b.updatedAt?.toDate().getTime() || 0) - (a.updatedAt?.toDate().getTime() || 0)).slice(0, 7),
        ratingDistribution: [],
        mostCommonRating: 0
      };

      // Calculate rating distribution
      const ratingDistribution = [0, 0, 0, 0, 0];
      rankings.forEach(r => {
        ratingDistribution[r.rank - 1]++;
      });
      stats['ratingDistribution'] = ratingDistribution;

      // Most common rating
      const mostCommonRatingIndex = ratingDistribution.indexOf(Math.max(...ratingDistribution));
      const mostCommonRating = mostCommonRatingIndex + 1;
      stats['mostCommonRating'] = mostCommonRating;

      // Recent activity (last 7 rankings)
      // const recentRankings = [...rankings].slice(-7).reverse();
      // stats['recentRankings'] = recentRankings;

      return stats;
    } catch (error) {
      console.error('Error calculating user stats:', error);
      throw new Error('Failed to calculate statistics');
    }
  }

  // Batch import rankings (for migration)
  static async batchImportRankings(
    userId: string,
    rankings: Ranking[]
  ): Promise<void> {
    try {
      const batch = rankings.map(ranking =>
        this.saveRanking(userId, {
          ...ranking,
          id: ranking.id || uuidv4()
        })
      );

      await Promise.all(batch);
    } catch (error) {
      console.error('Error batch importing rankings:', error);
      throw new Error('Failed to import rankings');
    }
  }
}
