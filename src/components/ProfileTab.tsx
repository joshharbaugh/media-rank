import React, { useMemo, useState } from 'react';
import {
  Camera, Edit3, Trophy, Star, TrendingUp,
  Film, Tv, Book, BarChart3, PieChart, Calendar,
  Award, Sparkles, Gamepad2
} from 'lucide-react';
import { Ranking } from '@/types';
import { getInitials, getMediaIcon } from '@/utils/helpers';
import { useUserStore } from '@/store/userStore';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface ProfileTabProps {
  rankings: Ranking[];
}

// interface GenreStats {
//   [key: string]: number;
// }

export const ProfileTab = ({ rankings }: ProfileTabProps): React.ReactElement => {
  const userProfile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState(userProfile?.bio);

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const movieCount = rankings.filter(r => r.media.type === 'movie').length;
    const tvCount = rankings.filter(r => r.media.type === 'tv').length;
    const bookCount = rankings.filter(r => r.media.type === 'book').length;
    const gameCount = rankings.filter(r => r.media.type === 'game').length;

    const totalRatings = rankings.reduce((sum, r) => sum + r.rank, 0);
    const avgRating = rankings.length > 0 ? (totalRatings / rankings.length).toFixed(2) : '0.00';

    // Find highest and lowest rated
    const sortedByRating = [...rankings].sort((a, b) => b.rank - a.rank);
    const highestRated = sortedByRating[0];
    const lowestRated = sortedByRating[sortedByRating.length - 1];

    // Calculate rating distribution
    const ratingDistribution = [0, 0, 0, 0, 0];
    rankings.forEach(r => {
      ratingDistribution[r.rank - 1]++;
    });

    // Most common rating
    const mostCommonRatingIndex = ratingDistribution.indexOf(Math.max(...ratingDistribution));
    const mostCommonRating = mostCommonRatingIndex + 1;

    // Recent activity (last 7 rankings)
    const recentRankings = [...rankings].slice(-7).reverse();

    return {
      total: rankings.length,
      movieCount,
      tvCount,
      bookCount,
      gameCount,
      avgRating,
      highestRated,
      lowestRated,
      ratingDistribution,
      mostCommonRating,
      recentRankings,
      totalRatings
    };
  }, [rankings]);

  const handleSaveBio = async () => {
    if (!userProfile) return;
    const userRef = doc(db, 'users', userProfile?.uid);

    await setDoc(userRef, {
      bio: tempBio,
      updatedAt: serverTimestamp()
    }, { merge: true });
    updateProfile({ ...userProfile, bio: tempBio });

    setIsEditingBio(false);
  };

  const handleCancelBio = () => {
    setTempBio(userProfile?.bio);
    setIsEditingBio(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {getInitials(userProfile?.displayName || userProfile?.email || null)}
            </div>
            <button className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{userProfile?.displayName}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-3">{userProfile?.email}</p>

            {/* Bio Section */}
            <div className="relative">
              {isEditingBio ? (
                <div className="space-y-2">
                  <textarea
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    maxLength={200}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveBio}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelBio}
                      className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group">
                  <p className="text-gray-600 dark:text-gray-400 pr-8">
                    {userProfile?.bio}
                  </p>
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex sm:flex-col gap-4 sm:gap-2 text-center">
            <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.total}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Rankings</p>
            </div>
            <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.avgRating}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Avg Rating</p>
            </div>
          </div>
        </div>

        {/* Favorite Genres */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Favorite Genres
          </h3>
          <div className="flex flex-wrap gap-2">
            {userProfile?.favoriteGenres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Media Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Media Breakdown
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Film className="w-4 h-4 text-blue-500" />
                Movies
              </span>
              <span className="font-semibold">{stats.movieCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Tv className="w-4 h-4 text-green-500" />
                TV Shows
              </span>
              <span className="font-semibold">{stats.tvCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Book className="w-4 h-4 text-purple-500" />
                Books
              </span>
              <span className="font-semibold">{stats.bookCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Gamepad2 className="w-4 h-4 text-yellow-500" />
                Games
              </span>
              <span className="font-semibold">{stats.gameCount}</span>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Rating Distribution
          </h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <div className="flex items-center gap-1 w-20">
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-400 h-full transition-all duration-500"
                    style={{
                      width: `${stats.total > 0 ? (stats.ratingDistribution[rating - 1] / stats.total) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                  {stats.ratingDistribution[rating - 1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Achievements
          </h3>
          <div className="space-y-2">
            {stats.total >= 10 && (
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>Ranked 10+ items</span>
              </div>
            )}
            {stats.total >= 25 && (
              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-indigo-500" />
                <span>Super Ranker (25+)</span>
              </div>
            )}
            {stats.movieCount >= 5 && (
              <div className="flex items-center gap-2 text-sm">
                <Film className="w-4 h-4 text-blue-500" />
                <span>Movie Buff</span>
              </div>
            )}
            {Number(stats.avgRating) >= 4 && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>Positive Reviewer</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top & Bottom Rated */}
      {stats.highestRated && stats.lowestRated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Highest Rated */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-600" />
              Highest Rated
            </h3>
            <div className="flex items-center gap-3">
              <img
                src={stats.highestRated.media.poster}
                alt={stats.highestRated.media.title}
                className="w-16 h-24 object-cover rounded shadow"
              />
              <div>
                <h4 className="font-medium">{stats.highestRated.media.title}</h4>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < stats.highestRated.rank
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-300 text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Lowest Rated */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-600 rotate-180" />
              Room for Improvement
            </h3>
            <div className="flex items-center gap-3">
              <img
                src={stats.lowestRated.media.poster}
                alt={stats.lowestRated.media.title}
                className="w-16 h-24 object-cover rounded shadow"
              />
              <div>
                <h4 className="font-medium">{stats.lowestRated.media.title}</h4>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < stats.lowestRated.rank
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-300 text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats.recentRankings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {stats.recentRankings.map((ranking) => {
              const Icon = getMediaIcon(ranking.media.type);
              return (
                <div key={ranking.id} className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                  <img
                    src={ranking.media.poster}
                    alt={ranking.media.title}
                    className="w-12 h-18 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm flex items-center gap-2">
                      {ranking.media.title}
                      <Icon className="w-3 h-3 text-gray-400" />
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < ranking.rank
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-300 text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
