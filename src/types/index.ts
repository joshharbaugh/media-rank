import { Timestamp } from 'firebase/firestore';

export type MediaType = 'movie' | 'tv' | 'book' | 'game' | 'music';

export interface Media {
  id: string;
  type: MediaType;
  title: string;
  releaseDate?: string;
  poster?: string;
  overview?: string;
  rating?: number;
}

export interface VolumeInfo {
  title: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  industryIdentifiers?: { type: string; identifier: string }[];
  readingModes?: { text: boolean; image: boolean };
  pageCount?: number;
  printType?: string;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  maturityRating?: string;
  allowAnonLogging?: boolean;
  contentVersion?: string;
  panelizationSummary?: { containsEpubBubbles: boolean; containsImageBubbles: boolean };
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  language?: string;
  previewLink?: string;
  infoLink?: string;
  canonicalVolumeLink?: string;
}

export interface Book extends Media {
  kind?: string;
  etag?: string;
  selfLink?: string;
  volumeInfo: VolumeInfo;
  saleInfo?: {
    country?: string;
    saleability?: string;
    isEbook?: boolean;
  };
  accessInfo?: {
    country?: string;
    viewability?: string;
    embeddable?: boolean;
    publicDomain?: boolean;
    textToSpeechPermission?: string;
    epub?: { isAvailable: boolean; acsTokenLink?: string };
    pdf?: { isAvailable: boolean; acsTokenLink?: string };
    webReaderLink?: string;
    accessViewStatus?: string;
    quoteSharingAllowed?: boolean;
  };
  searchInfo?: {
    textSnippet?: string;
  };
}

export interface Movie extends Media {
  adult?: boolean;
  backdrop_path?: string;
  genre_ids?: number[];
  original_language?: string;
  original_title?: string;
  popularity?: number;
  poster_path: string;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
}

export interface Show extends Media {
  adult?: boolean;
  backdrop_path?: string;
  genre_ids?: number[];
  name: string;
  origin_country?: string[];
  original_language?: string;
  original_name?: string;
  popularity?: number;
  poster_path: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
}

export interface Game extends Media {
  game_title: string;
  release_date?: string;
  platform?: number;
  region_id?: number;
  country_id?: number;
  developers?: number[];
}

export interface GameBoxart {
  base_url?: {
    original?: string;
    small?: string;
    thumb?: string;
    cropped_center_thumb?: string;
    medium?: string;
    large?: string;
  };
  data?: {
    [key: string]: {
      id: number;
      type: string;
      side: string;
      filename: string;
      resolution: string;
    }[];
  };
}

export interface SearchResultsBooks {
  kind: string;
  items: Book[];
  totalItems: number;
}

export interface SearchResultsMovies {
  page: number;
  results: Movie[];
  total_results: number;
  total_pages: number;
}

export interface SearchResultsShows {
  page: number;
  results: Show[];
  total_results: number;
  total_pages: number;
}

export interface SearchResultsGames {
  code: number;
  status: string;
  data: {
    count: number;
    games: Game[];
  };
  include?: {
    boxart?: GameBoxart;
  };
  pages?: {
    current?: string;
    next?: string;
    previous?: string;
  };
  remaining_monthly_allowance?: number;
  extra_allowance?: number;
  allowance_refresh_timer?: number;
}

export interface Ranking {
  id: string;
  mediaId: string;
  media?: Media;
  rank: number;
  notes?: string;
  userId?: string;
  createdAt?: Timestamp; // Firestore Timestamp
  updatedAt?: Timestamp; // Firestore Timestamp
}

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
