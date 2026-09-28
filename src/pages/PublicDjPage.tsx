import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  DEFAULT_TRACK_DISPLAY_PREFS,
  normalizeLibrarySettings,
  TrackRequest,
} from '../types';
import { Header } from '../components/Header';
import { StartScreen } from '../components/StartScreen';
import { SearchBarAndFilters } from '../components/SearchBarAndFilters';
import { TrackList } from '../components/TrackList';
import { RequestTab } from '../components/RequestTab';
import { RequestModal } from '../components/RequestModal';
import { ImportModal } from '../components/ImportModal';
import { SettingsModal } from '../components/SettingsModal';
import { AccountModal } from '../components/AccountModal';
import { ShareModal } from '../components/ShareModal';
import { DJDashboard } from '../components/DJDashboard';
import { PlaylistFilterModal } from '../components/PlaylistFilterModal';
import { Disc3, ListFilter } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n/LanguageContext';
import { useDjPageNavigation } from '../hooks/useDjPageNavigation';
import { useLibraryLoader } from '../hooks/useLibraryLoader';
import { useCatalogSearch } from '../hooks/useCatalogSearch';
import { useRequestsState } from '../hooks/useRequestsState';
import { useLibraryMutations } from '../hooks/useLibraryMutations';

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
  const [requests, setRequests] = useState<TrackRequest[]>([]);

  const {
    currentLibrary,
    setCurrentLibrary,
    loading,
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

  const {
    matchedByRequestId,
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

  const handleOpenRequestPrefilled = (artist = '', title = '') => {
    setPrefilledRequest({ artist, title: title || filters.searchQuery });
    setIsRequestOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center py-20 text-center space-y-3">
        <Disc3 className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
        <p className="text-xs font-semibold text-zinc-400">{t('public.loadingLibrary')}</p>
      </div>
    );
  }

  if (notFound || !currentLibrary) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <h1 className="text-xl font-bold">
          {ownerMode ? t('public.profileNotFound') : t('public.djNotFound')}
        </h1>
        <p className="text-sm text-zinc-400 max-w-md">
          {ownerMode ? t('public.profileMissingHelp') : t('public.pageMissing')}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 pb-16">
      {viewMode === 'start' ? (
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
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
            {activeTab === 'tracks' && (
              <div className="space-y-4">
                {isOwner && (
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-md flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <ListFilter className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-zinc-100">{t('public.filterPlaylists')}</h2>
                          {currentLibrary.playlists?.length > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {t('playlist.activeCount', {
                                selected: activeSelectedPlaylistIds.length,
                                total: currentLibrary.playlists.length,
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400">
                          {activeSelectedPlaylistIds.length === (currentLibrary.playlists?.length || 0)
                            ? t('public.allPlaylistsVisible')
                            : t('public.playlistsSelected', {
                                selected: activeSelectedPlaylistIds.length,
                                total: currentLibrary.playlists?.length || 0,
                              })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPlaylistFilterOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 font-bold text-xs shadow-md flex items-center gap-2"
                    >
                      <ListFilter className="w-4 h-4" />
                      <span>{t('public.filterPlaylistsBtn')}</span>
                    </button>
                  </div>
                )}

                <div className="sticky top-[118px] z-20 bg-zinc-950/95 backdrop-blur-md py-3 border-b border-zinc-800/60 shadow-lg -mx-4 px-4 sm:mx-0 sm:px-0">
                  <SearchBarAndFilters
                    filters={filters}
                    onFilterChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
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
                  allowDownloadRequests={normalizeLibrarySettings(currentLibrary.librarySettings).enableDownloadRequests}
                  visibleFields={
                    (currentLibrary.trackDisplayPrefs ?? DEFAULT_TRACK_DISPLAY_PREFS)[
                      isOwner ? 'dj' : 'viewers'
                    ]
                  }
                  onRequestModalOpen={() => handleOpenRequestPrefilled()}
                  onRequestSimilar={(artist, title) => handleSubmitRequest(title, artist)}
                />
              </div>
            )}

            {activeTab === 'requests' && (
              <RequestTab
                requests={requests}
                matchedByRequestId={matchedByRequestId}
                onOpenRequestModal={() => handleOpenRequestPrefilled()}
                isOwner={isOwner}
                visibleFields={
                  (currentLibrary.trackDisplayPrefs ?? DEFAULT_TRACK_DISPLAY_PREFS)[
                    isOwner ? 'dj' : 'viewers'
                  ]
                }
                hidePlayedDeclined={
                  normalizeLibrarySettings(currentLibrary.librarySettings).hidePlayedDeclinedFromGuests
                }
                onUpdateStatus={handleUpdateStatus}
                onDeleteRequest={handleDeleteRequest}
                onClearVerzoekjes={handleClearVerzoekjes}
              />
            )}

            {activeTab === 'dj' && isOwner && (
              <DJDashboard
                requests={requests}
                onDeleteRequest={handleDeleteRequest}
                onClearToDownloadRequests={handleClearToDownloadRequests}
              />
            )}
          </main>
        </>
      )}

      <RequestModal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        onSubmit={handleSubmitRequest}
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
          />
        </>
      )}

      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} library={currentLibrary} />

      {isOwner && (
        <PlaylistFilterModal
          isOpen={isPlaylistFilterOpen}
          onClose={() => setIsPlaylistFilterOpen(false)}
          playlists={currentLibrary.playlists || []}
          playlistTree={currentLibrary.playlistTree}
          selectedPlaylistIds={activeSelectedPlaylistIds}
          onSaveFilter={handleSavePlaylistFilter}
        />
      )}
    </div>
  );
}
