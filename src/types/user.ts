import { Timestamp } from "firebase/firestore";
import { FamilyRole } from "./family";
import { Ranking } from "./index";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  bio: string;
  photoURL: string | null;
  favoriteGenres: string[];
  createdAt: Timestamp; // Firestore Timestamp
  updatedAt: Timestamp; // Firestore Timestamp
  settings: {
    theme: 'light' | 'dark';
  };
  family?: {
    familyId: string;
    role: FamilyRole;
    joinedAt?: Timestamp;
  };
}

export interface UserStats {
  total: number;
  totalRatings: number;
  movieCount: number;
  tvCount: number;
  bookCount: number;
  gameCount: number;
  avgRating: number;
  highestRated: Ranking;
  lowestRated: Ranking;
  recentRankings: Ranking[];
  ratingDistribution: number[];
  mostCommonRating: number;
}
