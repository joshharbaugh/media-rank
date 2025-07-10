import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { SearchTab } from '@/components/SearchTab';
import { RankingsTab } from '@/components/RankingsTab';
import { ProfileTab } from '@/components/ProfileTab';
import { AddRankingModal } from '@/components/AddRankingModal';
import { LoginPage } from '@/components/auth/LoginPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import { Media, Ranking } from '@/types';
import { useThemeStore } from '@/store/themeStore';
import { AuthProvider } from '@/contexts/Auth';
import { useRankings } from '@/hooks/useRankings';

type TabType = 'search' | 'rankings' | 'profile';

function AppContent() {
  const { theme } = useThemeStore();
  const { rankings, addRanking, deleteRanking } = useRankings();
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  // Apply theme class to root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  window.addEventListener('navigate-to-profile', () => {
    setActiveTab('profile');
  });

  const handleAddToRankings = (media: Media) => {
    setSelectedMedia(media);
    setShowAddModal(true);
  };

  const handleSaveRanking = (ranking: Ranking) => {
    addRanking(ranking.media, ranking.rank, ranking.notes);
    setShowAddModal(false);
    setSelectedMedia(null);
  };

  const handleRemoveRanking = (id: string) => {
    deleteRanking(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <Header />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'search' && (
          <SearchTab onAddToRankings={handleAddToRankings} />
        )}

        {activeTab === 'rankings' && (
          <RankingsTab
            rankings={rankings}
            onRemoveRanking={handleRemoveRanking}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab rankings={rankings} />
        )}
      </main>

      {showAddModal && selectedMedia && (
        <AddRankingModal
          media={selectedMedia}
          onSave={handleSaveRanking}
          onClose={() => {
            setShowAddModal(false);
            setSelectedMedia(null);
          }}
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
            path="/"
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
