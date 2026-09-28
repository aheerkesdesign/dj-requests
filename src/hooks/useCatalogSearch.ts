import { useEffect, useMemo, useRef, useState } from 'react';
import type { Track, USBLibrary } from '../types';
import { searchLibraryTracks, TRACK_PAGE_SIZE } from '../utils/api';

export interface CatalogFilters {
  searchQuery: string;
  sortBy: 'title' | 'artist';
  sortOrder: 'asc' | 'desc';
}

interface UseCatalogSearchArgs {
  currentLibrary: USBLibrary | null;
  selectedPlaylistIds: string[] | null;
  ownerMode: boolean;
  viewMode: 'start' | 'library';
}

export function useCatalogSearch({
  currentLibrary,
  selectedPlaylistIds,
  ownerMode,
  viewMode,
}: UseCatalogSearchArgs) {
  const [filters, setFilters] = useState<CatalogFilters>({
    searchQuery: '',
    sortBy: 'title',
    sortOrder: 'asc',
  });
  const [catalogTracks, setCatalogTracks] = useState<Track[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(false);
  /** List key for which `catalogTracks` is a completed first-page result. */
  const [resolvedListKey, setResolvedListKey] = useState<string | null>(null);
  const searchRequest = useRef(0);
  const resolvedListKeyRef = useRef<string | null>(null);
  resolvedListKeyRef.current = resolvedListKey;

  const activeSelectedPlaylistIds = useMemo(() => {
    if (!currentLibrary?.playlists) return [];
    if (selectedPlaylistIds === null) return currentLibrary.playlists.map((p) => p.id);
    return selectedPlaylistIds;
  }, [currentLibrary, selectedPlaylistIds]);

  const playlistIdsForSearch = useMemo(() => {
    if (!currentLibrary?.playlists?.length) return null;
    const allIds = currentLibrary.playlists.map((p) => p.id);
    const allSelected =
      activeSelectedPlaylistIds.length === allIds.length &&
      allIds.every((id) => activeSelectedPlaylistIds.includes(id));
    return allSelected ? null : activeSelectedPlaylistIds;
  }, [currentLibrary, activeSelectedPlaylistIds]);

  const catalogListKey = `${currentLibrary?.id ?? ''}|${currentLibrary?.trackCount ?? 0}|${
    filters.searchQuery
  }|${filters.sortBy}|${filters.sortOrder}|${playlistIdsForSearch?.join(',') ?? 'all'}`;

  const shouldSearch = Boolean(currentLibrary?.id) && (ownerMode || viewMode === 'library');
  const catalogReady = shouldSearch && resolvedListKey === catalogListKey;
  const showTracks = catalogReady;

  useEffect(() => {
    if (!shouldSearch || !currentLibrary?.id) {
      searchRequest.current += 1;
      setCatalogTracks([]);
      setCatalogTotal(0);
      setCatalogLoading(false);
      setResolvedListKey(null);
      return;
    }

    // Already have a complete page for this key (e.g. Strict Mode remount) — don't flash empty.
    if (resolvedListKeyRef.current === catalogListKey) {
      setCatalogLoading(false);
      return;
    }

    const libraryId = currentLibrary.id;
    const requestId = ++searchRequest.current;
    const listKey = catalogListKey;
    setCatalogLoading(true);

    // Debounce only free-text search; playlist/sort/library changes fetch immediately.
    const delayMs = filters.searchQuery.trim() ? 300 : 0;
    const handle = window.setTimeout(() => {
      // Hide rows before replacing so we never paint a stale page mid-transition.
      setResolvedListKey(null);
      setCatalogTracks([]);
      setCatalogTotal(0);

      void (async () => {
        try {
          const page = await searchLibraryTracks(libraryId, {
            query: filters.searchQuery,
            playlistIds: playlistIdsForSearch,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            offset: 0,
            limit: TRACK_PAGE_SIZE,
          });
          if (searchRequest.current !== requestId) return;
          setCatalogTracks(page.tracks);
          setCatalogTotal(page.total);
          setResolvedListKey(listKey);
        } catch (err) {
          console.error(err);
          if (searchRequest.current !== requestId) return;
          setCatalogTracks([]);
          setCatalogTotal(0);
          setResolvedListKey(listKey);
        } finally {
          if (searchRequest.current === requestId) setCatalogLoading(false);
        }
      })();
    }, delayMs);

    return () => {
      window.clearTimeout(handle);
    };
  }, [shouldSearch, currentLibrary?.id, catalogListKey, filters.searchQuery, playlistIdsForSearch]);

  const loadMoreTracks = async () => {
    if (!currentLibrary?.id || catalogLoading || !catalogReady || catalogTracks.length >= catalogTotal) {
      return;
    }
    const requestId = searchRequest.current;
    setCatalogLoading(true);
    try {
      const page = await searchLibraryTracks(currentLibrary.id, {
        query: filters.searchQuery,
        playlistIds: playlistIdsForSearch,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        offset: catalogTracks.length,
        limit: TRACK_PAGE_SIZE,
      });
      if (searchRequest.current !== requestId) return;
      setCatalogTracks((prev) => [...prev, ...page.tracks]);
      setCatalogTotal(page.total);
    } catch (err) {
      console.error(err);
    } finally {
      if (searchRequest.current === requestId) setCatalogLoading(false);
    }
  };

  return {
    filters,
    setFilters,
    catalogTracks: showTracks ? catalogTracks : [],
    catalogTotal: showTracks ? catalogTotal : 0,
    catalogLoading: shouldSearch && !catalogReady,
    catalogReady,
    catalogListKey,
    activeSelectedPlaylistIds,
    loadMoreTracks,
  };
}
