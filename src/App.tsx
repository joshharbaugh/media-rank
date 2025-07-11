import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { SearchView } from '@/views/Search';
import { RankingsView } from '@/views/Rankings';
import { ProfileView } from '@/views/Profile';
import { FamilyView } from '@/views/Family';
import { AddRankingModal } from '@/components/AddRankingModal';
import { LoginPage } from '@/components/auth/LoginPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import { Media, Ranking } from '@/types';
import { useThemeStore } from '@/store/themeStore';
import { AuthProvider } from '@/contexts/Auth';
import { useRankings } from '@/hooks/useRankings';

function AppContent() {
  const { theme } = useThemeStore();
  const { rankings, addRanking, deleteRanking } = useRankings();
  const location = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [existingRanking, setExistingRanking] = useState<Ranking | null>(null);

  // Apply theme class to root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle navigation to profile from external events
  useEffect(() => {
    const handleNavigateToProfile = () => {
      window.location.href = '/profile';
    };

    window.addEventListener('navigate-to-profile', handleNavigateToProfile);
    return () => {
      window.removeEventListener('navigate-to-profile', handleNavigateToProfile);
    };
  }, []);

  const handleAddToRankings = (media: Media) => {
    setSelectedMedia(media);
    setShowAddModal(true);
  };

  const handleSaveRanking = (ranking: Ranking) => {
    addRanking(ranking.rank, ranking.notes, ranking.media);
    setShowAddModal(false);
    setSelectedMedia(null);
    setExistingRanking(null);
  };

  const handleRemoveRanking = (id: string) => {
    deleteRanking(id);
  };

  const handleEditRanking = (ranking: Ranking) => {
    setExistingRanking(ranking);
    setShowAddModal(true);
  };

  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/search' || path === '/') return 'search';
    if (path === '/rankings') return 'rankings';
    if (path === '/family') return 'family';
    if (path === '/profile') return 'profile';
    return 'search';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <Header />
      <Navigation activeTab={getActiveTab()} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<SearchView onAddToRankings={handleAddToRankings} />} />
          <Route path="/search" element={<SearchView onAddToRankings={handleAddToRankings} />} />
          <Route
            path="/rankings"
            element={
              <RankingsView
                rankings={rankings}
                onRemoveRanking={handleRemoveRanking}
                onEditRanking={handleEditRanking}
              />
            }
          />
          <Route
            path="/profile"
            element={<ProfileView rankings={rankings} />}
          />
          <Route
            path="/family"
            element={<FamilyView />}
          />
        </Routes>
      </main>

      {showAddModal && (selectedMedia || existingRanking) && (
        <AddRankingModal
          media={selectedMedia || existingRanking?.media}
          onSave={handleSaveRanking}
          onClose={() => {
            setShowAddModal(false);
            setSelectedMedia(null);
            setExistingRanking(null);
          }}
          existingRanking={existingRanking || undefined}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
