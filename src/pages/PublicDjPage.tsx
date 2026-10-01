import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  normalizeLibrarySettings,
  normalizeTrackDisplayPrefs,
  TrackRequest,
} from '../types';
import { Header } from '../components/Header';
import { StartScreen } from '../components/StartScreen';
import { SearchBarAndFilters } from '../components/SearchBarAndFilters';
import { TrackList } from '../components/TrackList';
import { RequestTab, type RequestSortBy } from '../components/RequestTab';
import { RequestModal } from '../components/RequestModal';
import { ImportModal } from '../components/ImportModal';
import { SettingsModal } from '../components/SettingsModal';
import { AccountModal } from '../components/AccountModal';
import { ShareModal } from '../components/ShareModal';
import { DJDashboard } from '../components/DJDashboard';
import { PlaylistFilterModal } from '../components/PlaylistFilterModal';
import { Disc3 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n/LanguageContext';
import { useDjPageNavigation } from '../hooks/useDjPageNavigation';
import { useLibraryLoader } from '../hooks/useLibraryLoader';
import { useCatalogSearch } from '../hooks/useCatalogSearch';
import { useRequestsState } from '../hooks/useRequestsState';
import { useLibraryMutations } from '../hooks/useLibraryMutations';
import { useTabPanelMotion } from '../hooks/useTabPanelMotion';
import { cn } from '@/lib/utils';

interface PublicDjPageProps {
  /** When true, treat as owner dashboard embed (auth session) */
  ownerMode?: boolean;
}

export default function PublicDjPage({ ownerMode = false }: PublicDjPageProps) {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const { user, profile, refreshProfile } = useAuth();
  const { t, setLocale } = useI18n();
  const slug = ownerMode ? profile?.slug : routeSlug;
  const isOwner = ownerMode;

  const { viewMode, setViewMode, activeTab, setActiveTab } = useDjPageNavigation(ownerMode);
  const { displayTab: displayView, panelClassName: viewPanelClassName } = useTabPanelMotion(viewMode);
  const { displayTab, panelClassName } = useTabPanelMotion(activeTab);
  const [requests, setRequests] = useState<TrackRequest[]>([]);

  const {
    currentLibrary,
    setCurrentLibrary,
    loading,
    requestsReady,
    notFound,
    selectedPlaylistIds,
    setSelectedPlaylistIds,
    isPlaylistFilterOpen,
    setIsPlaylistFilterOpen,
  } = useLibraryLoader({
    ownerMode,
    slug,
    user,
    profile,
    setViewMode,
    setLocale,
    setRequests,
  });

  const visibleFields = useMemo(() => {
    const prefs = normalizeTrackDisplayPrefs(currentLibrary?.trackDisplayPrefs);
    return prefs[isOwner ? 'dj' : 'viewers'];
  }, [currentLibrary?.trackDisplayPrefs, isOwner]);

  const librarySettings = useMemo(
    () => normalizeLibrarySettings(currentLibrary?.librarySettings),
    [currentLibrary?.librarySettings]
  );

  const {
    matchedByRequestId,
    matchingReady,
    handleSubmitRequest,
    handleUpdateStatus,
    handleDeleteRequest,
    handleClearToDownloadRequests,
    handleClearVerzoekjes,
  } = useRequestsState({ currentLibrary, isOwner, requests, setRequests });

  const {
    filters,
    setFilters,
    catalogTracks,
    catalogTotal,
    catalogLoading,
    catalogListKey,
    activeSelectedPlaylistIds,
    loadMoreTracks,
  } = useCatalogSearch({
    currentLibrary,
    selectedPlaylistIds,
    ownerMode,
    viewMode,
  });

  const {
    handleSavePlaylistFilter,
    handleSaveTrackDisplayPrefs,
    handleSaveRequestSortBy,
    handleUpdateLibraryDetails,
    handleUploadSuccess,
  } = useLibraryMutations({
    currentLibrary,
    setCurrentLibrary,
    setSelectedPlaylistIds,
    setRequests,
    setActiveTab,
    isOwner,
    user,
    profile,
    slug,
    refreshProfile,
    t,
  });

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [prefilledRequest, setPrefilledRequest] = useState({ artist: '', title: '' });
  const [requestSortBy, setRequestSortBy] = useState<RequestSortBy>('order');

  // DJ sort preference lives in library_settings (synced across devices via DB + realtime).
  useEffect(() => {
    if (!ownerMode) return;
    setRequestSortBy(librarySettings.requestSortBy);
  }, [ownerMode, librarySettings.requestSortBy]);

  const handleRequestSortByChange = (sortBy: RequestSortBy) => {
    setRequestSortBy(sortBy);
    if (ownerMode) void handleSaveRequestSortBy(sortBy);
  };

  const handleOpenRequestPrefilled = (artist = '', title = '') => {
    setPrefilledRequest({ artist, title: title || filters.searchQuery });
    setIsRequestOpen(true);
  };

  useEffect(() => {
    if (activeTab === 'dj' && !librarySettings.enableDownloadRequests) {
      setActiveTab('tracks');
    }
  }, [activeTab, librarySettings.enableDownloadRequests, setActiveTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center py-20 text-center space-y-3 motion-fade-in-place">
        <Disc3 className="w-12 h-12 text-primary animate-spin mx-auto" />
        <p className="text-xs font-semibold text-muted-foreground">{t('public.loadingLibrary')}</p>
      </div>
    );
  }

  if (notFound || !currentLibrary) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center space-y-3">
        <h1 className="text-xl font-bold">
          {ownerMode ? t('public.profileNotFound') : t('public.djNotFound')}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          {ownerMode ? t('public.profileMissingHelp') : t('public.pageMissing')}
        </p>
      </div>
    );
  }

  const playlistTotal = currentLibrary.playlists?.length || 0;
  const playlistSelected = activeSelectedPlaylistIds.length;
  const playlistFiltered = playlistTotal > 0 && playlistSelected !== playlistTotal;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground pb-16 motion-panel-enter">
      <div key={displayView} className={cn(viewPanelClassName)}>
        {displayView === 'start' ? (
          <StartScreen
            library={currentLibrary}
            onGoToLibrary={() => {
              setViewMode('library');
              setActiveTab('tracks');
            }}
          />
        ) : (
          <>
            <Header
              currentLibrary={currentLibrary}
              onOpenImport={() => setIsImportOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenAccount={() => setIsAccountOpen(true)}
              onOpenShare={() => setIsShareOpen(true)}
              onGoToStartScreen={() => setViewMode('start')}
              isOwner={isOwner}
              showDjTab={librarySettings.enableDownloadRequests}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
              <div key={displayTab} className={cn(panelClassName)}>
                {displayTab === 'tracks' && (
                  <div className="space-y-4">
                    <div className="sticky top-[118px] z-20 bg-background/95 backdrop-blur-md py-3 border-b border-border/60 shadow-lg -mx-4 px-4 sm:mx-0 sm:px-0">
                      <SearchBarAndFilters
                        searchQuery={filters.searchQuery}
                        onSearchChange={(searchQuery) =>
                          setFilters((prev) => ({ ...prev, searchQuery }))
                        }
                        actionButton={
                          isOwner
                            ? {
                                label: t('public.filterPlaylistsBtn'),
                                onClick: () => setIsPlaylistFilterOpen(true),
                                active: playlistFiltered,
                                title: playlistFiltered
                                  ? t('public.playlistsSelected', {
                                      selected: playlistSelected,
                                      total: playlistTotal,
                                    })
                                  : t('public.allPlaylistsVisible'),
                              }
                            : undefined
                        }
                      />
                    </div>

                    <TrackList
                      tracks={catalogTracks}
                      totalCount={catalogTotal}
                      listKey={catalogListKey}
                      loading={catalogLoading && catalogTracks.length === 0}
                      loadingMore={catalogLoading && catalogTracks.length > 0}
                      onLoadMore={() => void loadMoreTracks()}
                      searchQuery={filters.searchQuery}
                      requests={requests}
                      isOwner={isOwner}
                      allowDownloadRequests={librarySettings.enableDownloadRequests}
                      visibleFields={visibleFields}
                      requestButtonStyle={librarySettings.requestButtonStyle}
                      onRequestModalOpen={() => handleOpenRequestPrefilled()}
                      onRequestSimilar={(track) =>
                        handleSubmitRequest(track.name, track.artist, 'playable', track)
                      }
                    />
                  </div>
                )}

                {displayTab === 'requests' && (
                  <RequestTab
                    requests={requests}
                    matchedByRequestId={matchedByRequestId}
                    matchingReady={matchingReady}
                    loading={!requestsReady}
                    onOpenRequestModal={() => handleOpenRequestPrefilled()}
                    isOwner={isOwner}
                    visibleFields={visibleFields}
                    showPlayedDeclined={librarySettings.showPlayedDeclinedToGuests}
                    showDjTips={librarySettings.showDjTips}
                    onUpdateStatus={handleUpdateStatus}
                    onDeleteRequest={handleDeleteRequest}
                    onClearVerzoekjes={handleClearVerzoekjes}
                    sortBy={requestSortBy}
                    onSortByChange={handleRequestSortByChange}
                  />
                )}

                {displayTab === 'dj' && isOwner && librarySettings.enableDownloadRequests && (
                  <DJDashboard
                    requests={requests}
                    onDeleteRequest={handleDeleteRequest}
                    onClearToDownloadRequests={handleClearToDownloadRequests}
                    showDjTips={librarySettings.showDjTips}
                  />
                )}
              </div>
            </main>
          </>
        )}
      </div>

      <RequestModal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        onSubmit={(title, artist) => handleSubmitRequest(title, artist, 'wishlist')}
        prefilledArtist={prefilledRequest.artist}
        prefilledTitle={prefilledRequest.title}
      />

      {isOwner && (
        <>
          <ImportModal
            isOpen={isImportOpen}
            onClose={() => setIsImportOpen(false)}
            currentLibrary={currentLibrary}
            onUploadSuccess={handleUploadSuccess}
            allowUpload={Boolean(user && currentLibrary.ownerId === user.id)}
            showDjTips={librarySettings.showDjTips}
          />
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            trackDisplayPrefs={currentLibrary.trackDisplayPrefs}
            librarySettings={currentLibrary.librarySettings}
            onSavePrefs={handleSaveTrackDisplayPrefs}
            allowEdit={Boolean(user && currentLibrary.ownerId === user.id)}
          />
          <AccountModal
            isOpen={isAccountOpen}
            onClose={() => setIsAccountOpen(false)}
            currentLibrary={currentLibrary}
            onUpdateDetails={handleUpdateLibraryDetails}
            allowProfileEdit={Boolean(user && currentLibrary.ownerId === user.id)}
            showDjTips={librarySettings.showDjTips}
          />
        </>
      )}

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        library={currentLibrary}
        showDjTips={librarySettings.showDjTips}
        isOwner={isOwner}
      />

      {isOwner && (
        <PlaylistFilterModal
          isOpen={isPlaylistFilterOpen}
          onClose={() => setIsPlaylistFilterOpen(false)}
          playlists={currentLibrary.playlists || []}
          playlistTree={currentLibrary.playlistTree}
          selectedPlaylistIds={activeSelectedPlaylistIds}
          onSaveFilter={handleSavePlaylistFilter}
          showDjTips={librarySettings.showDjTips}
        />
      )}
    </div>
  );
}
