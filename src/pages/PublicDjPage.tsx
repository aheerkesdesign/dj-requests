import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { USBLibrary, TrackRequest, RequestStatus, RequestKind, SocialLinks } from '../types';
import {
  fetchLibraryBySlug,
  fetchMyLibrary,
  updateLibraryDetails,
  upsertMyLibraryCatalog,
  updateMyProfile,
  uploadLogo,
  uploadStartImage,
  fetchRequests,
  submitRequest,
  updateRequestStatus,
  deleteRequest as apiDeleteRequest,
  clearAllRequests as apiClearAllRequests,
  clearLibraryCatalog,
  subscribeToRequests,
  subscribeToLibrary,
} from '../utils/api';
import { isTrackInLibrary } from '../utils/library';
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
import { Disc3, PlusCircle, Sparkles, ListFilter } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n/LanguageContext';

interface PublicDjPageProps {
  /** When true, treat as owner dashboard embed (auth session) */
  ownerMode?: boolean;
}

export default function PublicDjPage({ ownerMode = false }: PublicDjPageProps) {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useI18n();
  const slug = ownerMode ? profile?.slug : routeSlug;
  const isOwner = ownerMode;

  const [currentLibrary, setCurrentLibrary] = useState<USBLibrary | null>(null);
  const [requests, setRequests] = useState<TrackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const getInitialState = () => {
    if (typeof window === 'undefined') {
      return { view: ownerMode ? ('library' as const) : ('start' as const), tab: 'tracks' as const };
    }

    // Dashboard (owner) always opens the library UI — don't reuse guest start-screen session
    if (ownerMode) {
      const ownerTab = sessionStorage.getItem('owner_active_tab') as 'tracks' | 'requests' | 'dj' | null;
      const tab: 'tracks' | 'requests' | 'dj' =
        ownerTab === 'tracks' || ownerTab === 'requests' || ownerTab === 'dj' ? ownerTab : 'tracks';
      return { view: 'library' as const, tab };
    }

    const urlParams = new URLSearchParams(window.location.search);
    const paramView = urlParams.get('view') as 'start' | 'library' | null;
    const paramTab = urlParams.get('tab') as 'tracks' | 'requests' | 'dj' | null;
    const sessionView = sessionStorage.getItem('app_view_mode') as 'start' | 'library' | null;
    const sessionTab = sessionStorage.getItem('app_active_tab') as 'tracks' | 'requests' | 'dj' | null;

    const view: 'start' | 'library' =
      paramView === 'start' || paramView === 'library'
        ? paramView
        : sessionView === 'start' || sessionView === 'library'
          ? sessionView
          : 'start';

    let tab: 'tracks' | 'requests' | 'dj' =
      paramTab === 'tracks' || paramTab === 'requests' || paramTab === 'dj'
        ? paramTab
        : sessionTab === 'tracks' || sessionTab === 'requests' || sessionTab === 'dj'
          ? sessionTab
          : 'tracks';

    if (tab === 'dj') tab = 'tracks';

    return { view, tab };
  };

  const initialState = useMemo(() => getInitialState(), [ownerMode]);

  const [viewMode, setViewMode] = useState<'start' | 'library'>(initialState.view);
  const [activeTab, setActiveTab] = useState<'tracks' | 'requests' | 'dj'>(initialState.tab);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isPlaylistFilterOpen, setIsPlaylistFilterOpen] = useState(false);
  const [prefilledRequest, setPrefilledRequest] = useState({ artist: '', title: '' });
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[] | null>(null);
  const isPlaylistFilterOpenRef = useRef(isPlaylistFilterOpen);

  const [filters, setFilters] = useState({
    searchQuery: '',
    sortBy: 'title' as 'title' | 'artist',
    sortOrder: 'asc' as 'asc' | 'desc',
  });

  useEffect(() => {
    isPlaylistFilterOpenRef.current = isPlaylistFilterOpen;
  }, [isPlaylistFilterOpen]);

  useEffect(() => {
    async function init() {
      if (ownerMode) {
        if (!user?.id) {
          setLoading(true);
          return;
        }
        if (!profile) {
          setNotFound(true);
          setLoading(false);
          return;
        }
      }

      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotFound(false);
      try {
        const lib = ownerMode && user?.id
          ? await fetchMyLibrary(user.id)
          : await fetchLibraryBySlug(slug);
        if (!lib) {
          setNotFound(true);
          setCurrentLibrary(null);
          return;
        }
        setCurrentLibrary(lib);
        if (lib.selectedPlaylistIds && Array.isArray(lib.selectedPlaylistIds)) {
          setSelectedPlaylistIds(lib.selectedPlaylistIds);
        } else {
          setSelectedPlaylistIds(null);
        }
        const reqList = await fetchRequests(lib.id);
        setRequests(reqList);
      } catch (err) {
        console.error('Fout bij initialisatie:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, [slug, ownerMode, profile?.id, user?.id]);

  useEffect(() => {
    if (!currentLibrary?.id) return;
    const unsubReq = subscribeToRequests(currentLibrary.id, setRequests);
    const unsubLib = subscribeToLibrary(currentLibrary.id, (updatedLib) => {
      setCurrentLibrary(updatedLib);
      if (!isPlaylistFilterOpenRef.current && Array.isArray(updatedLib.selectedPlaylistIds)) {
        setSelectedPlaylistIds(updatedLib.selectedPlaylistIds);
      }
    });
    return () => {
      unsubReq();
      unsubLib();
    };
  }, [currentLibrary?.id]);

  useEffect(() => {
    if (ownerMode) {
      sessionStorage.setItem('owner_active_tab', activeTab);
      return;
    }

    sessionStorage.setItem('app_view_mode', viewMode);
    sessionStorage.setItem('app_active_tab', activeTab);
    sessionStorage.removeItem('app_is_dj_mode');

    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('view', viewMode);
    urlParams.set('tab', activeTab === 'dj' ? 'tracks' : activeTab);
    urlParams.delete('dj');
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);
  }, [viewMode, activeTab, ownerMode]);

  const handleSavePlaylistFilter = async (selectedIds: string[]) => {
    setSelectedPlaylistIds(selectedIds);
    if (!currentLibrary || !isOwner) return;
    setCurrentLibrary((prev) => (prev ? { ...prev, selectedPlaylistIds: selectedIds } : prev));
    try {
      await updateLibraryDetails(currentLibrary.id, { selectedPlaylistIds: selectedIds }, { asOwner: true });
    } catch (err) {
      console.error('Fout bij opslaan van playlist filter:', err);
    }
  };

  const handleUpdateLibraryDetails = async (updates: {
    name?: string;
    djName?: string;
    logoUrl?: string;
    logoBlob?: Blob;
    startImageUrl?: string;
    startImageBlob?: Blob;
    socials?: SocialLinks;
    slug?: string;
  }) => {
    if (!currentLibrary || !user) {
      throw new Error(t('public.loginToEditProfile'));
    }

    let logoPath: string | null | undefined = undefined;
    if (updates.logoBlob) {
      logoPath = await uploadLogo(user.id, updates.logoBlob, 'jpg');
    } else if (updates.logoUrl === '') {
      logoPath = null;
    }

    let startImagePath: string | null | undefined = undefined;
    if (updates.startImageBlob) {
      startImagePath = await uploadStartImage(user.id, updates.startImageBlob, 'jpg');
    } else if (updates.startImageUrl === '') {
      startImagePath = null;
    }

    await updateMyProfile(user.id, {
      displayName: updates.djName,
      slug: updates.slug,
      socials: updates.socials,
      logoPath,
      startImagePath,
    });

    if (updates.name) {
      await updateLibraryDetails(currentLibrary.id, { name: updates.name });
    }

    await refreshProfile();
    const refreshed = await fetchLibraryBySlug(updates.slug || currentLibrary.slug || slug || '');
    if (refreshed) setCurrentLibrary(refreshed);
  };

  const handleUploadSuccess = async (newLib: USBLibrary) => {
    if (!user) throw new Error(t('public.loginToUpload'));
    const saved = await upsertMyLibraryCatalog(user.id, newLib);
    setCurrentLibrary(saved);
    setRequests([]);
    setActiveTab('tracks');
  };

  const handleSubmitRequest = async (title: string, artist: string) => {
    if (!currentLibrary) return;
    const kind: RequestKind = isTrackInLibrary({ title, artist }, currentLibrary.tracks)
      ? 'playable'
      : 'wishlist';
    const req = await submitRequest(currentLibrary.id, title, artist, kind);
    setRequests((prev) => [req, ...prev]);
  };

  const handleUpdateStatus = async (requestId: string, status: RequestStatus) => {
    if (!currentLibrary || !isOwner) return;
    try {
      const updated = await updateRequestStatus(currentLibrary.id, requestId, status, { asOwner: true });
      setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
    } catch (err) {
      console.error('Fout bij bijwerken status:', err);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!currentLibrary || !isOwner) return;
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    try {
      await apiDeleteRequest(currentLibrary.id, requestId, { asOwner: true });
    } catch (err) {
      console.error('Fout bij verwijderen verzoek:', err);
      setRequests(await fetchRequests(currentLibrary.id));
    }
  };

  const handleClearToDownloadRequests = async () => {
    if (!currentLibrary || !isOwner) return;
    const toDownload = requests.filter(
      (r) => r.kind === 'wishlist' && r.status !== 'declined'
    );
    if (toDownload.length === 0) return;
    const idsToDelete = toDownload.map((r) => r.id);
    setRequests((prev) => prev.filter((r) => !idsToDelete.includes(r.id)));
    try {
      await apiClearAllRequests(currentLibrary.id, { asOwner: true, reqIds: idsToDelete });
    } catch (err) {
      console.error(err);
      setRequests(await fetchRequests(currentLibrary.id));
    }
  };

  const handleClearVerzoekjes = async () => {
    if (!currentLibrary || !isOwner) return;
    const verzoekjes = requests.filter((r) => r.kind === 'playable');
    if (verzoekjes.length === 0) return;
    const idsToDelete = verzoekjes.map((r) => r.id);
    setRequests((prev) => prev.filter((r) => !idsToDelete.includes(r.id)));
    try {
      await apiClearAllRequests(currentLibrary.id, { asOwner: true, reqIds: idsToDelete });
    } catch (err) {
      console.error(err);
      setRequests(await fetchRequests(currentLibrary.id));
    }
  };

  const handleDeleteLibrary = async () => {
    if (!currentLibrary || !user || !isOwner) return;
    try {
      await clearLibraryCatalog(currentLibrary.id);
      const refreshed = await fetchLibraryBySlug(currentLibrary.slug || slug || '');
      if (refreshed) setCurrentLibrary(refreshed);
      setRequests([]);
      setActiveTab('tracks');
    } catch (err) {
      console.error('Fout bij wissen bibliotheek:', err);
    }
  };

  const handleOpenRequestPrefilled = (artist = '', title = '') => {
    setPrefilledRequest({ artist, title: title || filters.searchQuery });
    setIsRequestOpen(true);
  };

  const activeSelectedPlaylistIds = useMemo(() => {
    if (!currentLibrary?.playlists) return [];
    if (selectedPlaylistIds === null) return currentLibrary.playlists.map((p) => p.id);
    return selectedPlaylistIds;
  }, [currentLibrary, selectedPlaylistIds]);

  const filteredTracks = useMemo(() => {
    if (!currentLibrary?.tracks) return [];
    let result = [...currentLibrary.tracks];

    if (currentLibrary.playlists?.length > 0) {
      const allPlaylistIds = currentLibrary.playlists.map((p) => p.id);
      if (activeSelectedPlaylistIds.length < allPlaylistIds.length) {
        if (activeSelectedPlaylistIds.length === 0) {
          result = [];
        } else {
          const selectedPlaylists = currentLibrary.playlists.filter((p) =>
            activeSelectedPlaylistIds.includes(p.id)
          );
          const selectedNames = new Set(selectedPlaylists.map((p) => p.name));
          const selectedTrackIds = new Set(selectedPlaylists.flatMap((p) => p.trackIds));
          result = result.filter(
            (t) =>
              (t.playlists && t.playlists.some((pName) => selectedNames.has(pName))) ||
              (t.trackId && selectedTrackIds.has(t.trackId))
          );
        }
      }
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const comp =
        filters.sortBy === 'artist'
          ? a.artist.localeCompare(b.artist)
          : a.name.localeCompare(b.name);
      return filters.sortOrder === 'asc' ? comp : -comp;
    });

    return result;
  }, [currentLibrary, filters, activeSelectedPlaylistIds]);

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
                {isOwner ? (
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
                ) : (
                  <div className="bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-cyan-950/80 border border-emerald-500/30 rounded-2xl p-4 shadow-md flex items-center justify-between gap-3 flex-wrap">
                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" /> {t('public.trackNotFound')}
                      </div>
                      <h2 className="text-sm font-bold text-zinc-100">
                        {t('public.requestNextTime')}
                      </h2>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {t('public.requestHint')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenRequestPrefilled()}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" /> {t('public.requestTrack')}
                    </button>
                  </div>
                )}

                <div className="sticky top-[118px] z-20 bg-zinc-950/95 backdrop-blur-md py-3 border-b border-zinc-800/60 shadow-lg -mx-4 px-4 sm:mx-0 sm:px-0">
                  <SearchBarAndFilters
                    filters={filters}
                    onFilterChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
                    totalTracksCount={currentLibrary.tracks.length || 0}
                    filteredTracksCount={filteredTracks.length}
                    onOpenRequestModal={() => handleOpenRequestPrefilled()}
                  />
                </div>

                <TrackList
                  tracks={filteredTracks}
                  searchQuery={filters.searchQuery}
                  requests={requests}
                  isOwner={isOwner}
                  onRequestModalOpen={() => handleOpenRequestPrefilled()}
                  onRequestSimilar={(artist, title) => handleSubmitRequest(title, artist)}
                />
              </div>
            )}

            {activeTab === 'requests' && (
              <RequestTab
                requests={requests}
                libraryTracks={currentLibrary.tracks}
                onOpenRequestModal={() => handleOpenRequestPrefilled()}
                isOwner={isOwner}
                onUpdateStatus={handleUpdateStatus}
                onDeleteRequest={handleDeleteRequest}
                onClearVerzoekjes={handleClearVerzoekjes}
              />
            )}

            {activeTab === 'dj' && isOwner && (
              <DJDashboard
                library={currentLibrary}
                requests={requests}
                onUpdateStatus={handleUpdateStatus}
                onDeleteRequest={handleDeleteRequest}
                onClearToDownloadRequests={handleClearToDownloadRequests}
                onDeleteLibrary={handleDeleteLibrary}
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
