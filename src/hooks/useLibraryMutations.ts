import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type {
  LibrarySettings,
  Profile,
  SocialLinks,
  TrackDisplayPrefs,
  TrackRequest,
  USBLibrary,
} from '../types';
import { normalizeLibrarySettings, normalizeTrackDisplayPrefs } from '../types';
import {
  fetchLibraryBySlug,
  removeStorageFile,
  updateLibraryDetails,
  updateMyProfile,
  uploadLogo,
  uploadStartImage,
  upsertMyLibraryCatalog,
} from '../utils/api';
import type { TranslateFn } from '../i18n/types';
import type { DjActiveTab } from './useDjPageNavigation';

interface UseLibraryMutationsArgs {
  currentLibrary: USBLibrary | null;
  setCurrentLibrary: Dispatch<SetStateAction<USBLibrary | null>>;
  setSelectedPlaylistIds: Dispatch<SetStateAction<string[] | null>>;
  setRequests: Dispatch<SetStateAction<TrackRequest[]>>;
  setActiveTab: (tab: DjActiveTab) => void;
  isOwner: boolean;
  user: User | null;
  profile: Profile | null;
  slug: string | undefined;
  refreshProfile: () => Promise<void>;
  t: TranslateFn;
}

export function useLibraryMutations({
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
}: UseLibraryMutationsArgs) {
  const handleSavePlaylistFilter = async (selectedIds: string[]) => {
    setSelectedPlaylistIds(selectedIds);
    if (!currentLibrary || !isOwner) return;
    setCurrentLibrary((prev) => (prev ? { ...prev, selectedPlaylistIds: selectedIds } : prev));
    try {
      await updateLibraryDetails(currentLibrary.id, { selectedPlaylistIds: selectedIds });
    } catch (err) {
      console.error('Fout bij opslaan van playlist filter:', err);
    }
  };

  const handleSaveTrackDisplayPrefs = async (prefs: TrackDisplayPrefs, libSettings: LibrarySettings) => {
    if (!currentLibrary || !isOwner) {
      throw new Error(t('settings.loginToSave'));
    }
    const normalized = normalizeTrackDisplayPrefs(prefs);
    const normalizedSettings = normalizeLibrarySettings(libSettings);
    setCurrentLibrary((prev) =>
      prev ? { ...prev, trackDisplayPrefs: normalized, librarySettings: normalizedSettings } : prev
    );
    await updateLibraryDetails(currentLibrary.id, {
      trackDisplayPrefs: normalized,
      librarySettings: normalizedSettings,
    });
  };

  const handleSaveRequestSortBy = async (sortBy: LibrarySettings['requestSortBy']) => {
    if (!currentLibrary || !isOwner) return;
    const nextSettings = normalizeLibrarySettings({
      ...currentLibrary.librarySettings,
      requestSortBy: sortBy,
    });
    setCurrentLibrary((prev) =>
      prev ? { ...prev, librarySettings: nextSettings } : prev
    );
    try {
      await updateLibraryDetails(currentLibrary.id, { librarySettings: nextSettings });
    } catch (err) {
      console.error('Fout bij opslaan van sorteervoorkeur:', err);
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

    const previousLogoPath = profile?.logoPath;
    const previousStartImagePath = profile?.startImagePath;

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

    if (logoPath !== undefined && previousLogoPath && previousLogoPath !== logoPath) {
      await removeStorageFile(previousLogoPath);
    }
    if (startImagePath !== undefined && previousStartImagePath && previousStartImagePath !== startImagePath) {
      await removeStorageFile(previousStartImagePath);
    }

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

  return {
    handleSavePlaylistFilter,
    handleSaveTrackDisplayPrefs,
    handleSaveRequestSortBy,
    handleUpdateLibraryDetails,
    handleUploadSuccess,
  };
}
