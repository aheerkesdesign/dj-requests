import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile, USBLibrary } from '../types';
import { normalizeLibrarySettings } from '../types';
import { fetchLibraryBySlug, fetchMyLibrary, fetchRequests, subscribeToLibrary, subscribeToRequests } from '../utils/api';
import type { TrackRequest } from '../types';
import type { Locale } from '../i18n/types';
import { LOCALE_STORAGE_KEY } from '../i18n/LanguageContext';

interface UseLibraryLoaderArgs {
  ownerMode: boolean;
  slug: string | undefined;
  user: User | null;
  profile: Profile | null;
  setViewMode: (view: 'start' | 'library') => void;
  setLocale: (locale: Locale) => void;
  setRequests: Dispatch<SetStateAction<TrackRequest[]>>;
}

export function useLibraryLoader({
  ownerMode,
  slug,
  user,
  profile,
  setViewMode,
  setLocale,
  setRequests,
}: UseLibraryLoaderArgs) {
  const [currentLibrary, setCurrentLibrary] = useState<USBLibrary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[] | null>(null);
  const [isPlaylistFilterOpen, setIsPlaylistFilterOpen] = useState(false);
  const isPlaylistFilterOpenRef = useRef(isPlaylistFilterOpen);

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
        const lib =
          ownerMode && user?.id ? await fetchMyLibrary(user.id) : await fetchLibraryBySlug(slug);
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

        if (!ownerMode) {
          const ls = normalizeLibrarySettings(lib.librarySettings);
          if (ls.skipStartScreen) {
            sessionStorage.setItem('app_view_mode', 'library');
            setViewMode('library');
          } else {
            sessionStorage.removeItem('app_view_mode');
          }
          if (ls.pageDefaultLocale !== 'auto' && !localStorage.getItem(LOCALE_STORAGE_KEY)) {
            setLocale(ls.pageDefaultLocale);
          }
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
  }, [slug, ownerMode, profile?.id, user?.id, setViewMode, setLocale, setRequests]);

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
  }, [currentLibrary?.id, setRequests]);

  return {
    currentLibrary,
    setCurrentLibrary,
    loading,
    notFound,
    selectedPlaylistIds,
    setSelectedPlaylistIds,
    isPlaylistFilterOpen,
    setIsPlaylistFilterOpen,
  };
}
