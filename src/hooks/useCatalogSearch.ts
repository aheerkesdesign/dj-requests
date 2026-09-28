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
  const searchRequest = useRef(0);

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

  const catalogListKey = `${filters.searchQuery}|${filters.sortBy}|${filters.sortOrder}|${
    playlistIdsForSearch?.join(',') ?? 'all'
  }`;

  useEffect(() => {
    if (!currentLibrary?.id) return;
    const requestId = ++searchRequest.current;
    if (!ownerMode && viewMode !== 'library') return;

    const libraryId = currentLibrary.id;
    setCatalogLoading(true);
    const handle = window.setTimeout(() => {
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
        } catch (err) {
          console.error(err);
          if (searchRequest.current !== requestId) return;
          setCatalogTracks([]);
          setCatalogTotal(0);
        } finally {
          if (searchRequest.current === requestId) setCatalogLoading(false);
        }
      })();
    }, 300);

    return () => {
      window.clearTimeout(handle);
    };
  }, [
    currentLibrary?.id,
    currentLibrary?.trackCount,
    filters.searchQuery,
    filters.sortBy,
    filters.sortOrder,
    playlistIdsForSearch,
    ownerMode,
    viewMode,
  ]);

  const loadMoreTracks = async () => {
    if (!currentLibrary?.id || catalogLoading || catalogTracks.length >= catalogTotal) return;
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
    catalogTracks,
    catalogTotal,
    catalogLoading,
    catalogListKey,
    activeSelectedPlaylistIds,
    loadMoreTracks,
  };
}
