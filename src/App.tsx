import React, { useEffect, useState } from 'react';
import { useFeedStore } from './store/useFeedStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useFavoritesStore } from './store/useFavoritesStore';
import { TopNav } from './components/TopNav';
import { FeedCarousel } from './components/FeedCarousel';
import { ActionBar } from './components/ActionBar';
import { InfoBar } from './components/InfoBar';
import { TagDrawer } from './components/TagDrawer';
import { SettingsModal } from './components/SettingsModal';
import { Toast } from './components/Toast';

export function App() {
  const { items, currentIndex, loadInitialFeed, isDualPane, setSearchTags } = useFeedStore();
  const { initSettings } = useSettingsStore();
  const { initFavorites } = useFavoritesStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTagDrawerOpen, setIsTagDrawerOpen] = useState(false);

  useEffect(() => {
    // Initial server hydration - runs once on mount
    initSettings();
    initFavorites();
    loadInitialFeed();
  }, []);

  const currentItem = items[currentIndex] || null;

  return (
    <div className="relative w-screen h-screen bg-[#101828] text-white overflow-hidden flex flex-col">
      {/* Top Navigation Bar */}
      <TopNav onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Content Area: Single Pane or Dual Pane */}
      <main className="relative flex-1 w-full h-full overflow-hidden flex">
        {/* Primary Feed Pane */}
        <div className="relative flex-1 h-full w-full overflow-hidden">
          <FeedCarousel
            isModalOpen={isSettingsOpen || isTagDrawerOpen}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* Overlays on top of active post */}
          {currentItem && (
            <>
              <InfoBar
                item={currentItem}
                onTagClick={tag => {
                  setIsTagDrawerOpen(true);
                }}
              />
              <ActionBar
                item={currentItem}
                onOpenTagDrawer={() => setIsTagDrawerOpen(true)}
              />
            </>
          )}
        </div>

        {/* Secondary Split Pane (Dual Feed) if active */}
        {isDualPane && (
          <div className="hidden md:flex relative flex-1 h-full w-full border-l border-white/10 overflow-hidden">
            <FeedCarousel
              isModalOpen={isSettingsOpen || isTagDrawerOpen}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Tag Inspector & Instant Blacklist Drawer */}
      <TagDrawer
        item={currentItem}
        isOpen={isTagDrawerOpen}
        onClose={() => setIsTagDrawerOpen(false)}
      />

      {/* Settings & Blacklist Manager Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Global Undo Toast Notification Container */}
      <Toast />
    </div>
  );
}

export default App;
