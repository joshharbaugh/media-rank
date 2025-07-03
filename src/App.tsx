import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { SearchTab } from '@/components/SearchTab';
import { RankingsTab } from '@/components/RankingsTab';
import { ProfileTab } from '@/components/ProfileTab';
import { AddRankingModal } from '@/components/AddRankingModal';
import { Media, Ranking } from '@/types';
import { useThemeStore } from '@/store/themeStore';

type TabType = 'search' | 'rankings' | 'profile';

function App() {
  const { theme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [rankings, setRankings] = useState<Ranking[]>([]);
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

  const handleAddToRankings = (media: Media) => {
    setSelectedMedia(media);
    setShowAddModal(true);
  };

  const handleSaveRanking = (ranking: Ranking) => {
    setRankings([...rankings, ranking]);
    setShowAddModal(false);
    setSelectedMedia(null);
  };

  const handleRemoveRanking = (id: string) => {
    setRankings(rankings.filter(r => r.id !== id));
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

export default App;