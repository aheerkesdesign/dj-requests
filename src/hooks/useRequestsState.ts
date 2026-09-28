import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { RequestKind, RequestStatus, Track, TrackRequest, USBLibrary } from '../types';
import { normalizeLibrarySettings } from '../types';
import {
  clearAllRequests as apiClearAllRequests,
  deleteRequest as apiDeleteRequest,
  fetchRequests,
  libraryHasTrack,
  matchRequestTracks,
  submitRequest,
  updateRequestStatus,
} from '../utils/api';
import { findTrackInLibrary } from '../utils/library';

interface UseRequestsStateArgs {
  currentLibrary: USBLibrary | null;
  isOwner: boolean;
  requests: TrackRequest[];
  setRequests: Dispatch<SetStateAction<TrackRequest[]>>;
}

export function useRequestsState({
  currentLibrary,
  isOwner,
  requests,
  setRequests,
}: UseRequestsStateArgs) {
  const [matchedTracks, setMatchedTracks] = useState<Track[]>([]);

  useEffect(() => {
    if (!currentLibrary?.id) return;
    let cancelled = false;
    const libraryId = currentLibrary.id;
    void (async () => {
      try {
        const tracks = await matchRequestTracks(
          libraryId,
          requests.map((request) => ({ title: request.title, artist: request.artist }))
        );
        if (!cancelled) setMatchedTracks(tracks);
      } catch (err) {
        console.error(err);
        if (!cancelled) setMatchedTracks([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentLibrary?.id, requests]);

  /** Map request id → catalog track using the server-matched candidate set. */
  const matchedByRequestId = useMemo(() => {
    const map = new Map<string, Track>();
    for (const req of requests) {
      const track = findTrackInLibrary(req, matchedTracks);
      if (track) map.set(req.id, track);
    }
    return map;
  }, [requests, matchedTracks]);

  const handleSubmitRequest = async (title: string, artist: string) => {
    if (!currentLibrary) return;
    const kind: RequestKind = (await libraryHasTrack(currentLibrary.id, title, artist))
      ? 'playable'
      : 'wishlist';
    const ls = normalizeLibrarySettings(currentLibrary.librarySettings);
    if (kind === 'wishlist' && !ls.enableDownloadRequests) {
      return;
    }
    const req = await submitRequest(currentLibrary.id, title, artist, kind);
    setRequests((prev) => [req, ...prev]);
  };

  const handleUpdateStatus = async (requestId: string, status: RequestStatus) => {
    if (!currentLibrary || !isOwner) return;
    try {
      const updated = await updateRequestStatus(currentLibrary.id, requestId, status);
      setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
    } catch (err) {
      console.error('Fout bij bijwerken status:', err);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!currentLibrary || !isOwner) return;
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    try {
      await apiDeleteRequest(currentLibrary.id, requestId);
    } catch (err) {
      console.error('Fout bij verwijderen verzoek:', err);
      setRequests(await fetchRequests(currentLibrary.id));
    }
  };

  const handleClearToDownloadRequests = async () => {
    if (!currentLibrary || !isOwner) return;
    const toDownload = requests.filter((r) => r.kind === 'wishlist' && r.status !== 'declined');
    if (toDownload.length === 0) return;
    const idsToDelete = toDownload.map((r) => r.id);
    setRequests((prev) => prev.filter((r) => !idsToDelete.includes(r.id)));
    try {
      await apiClearAllRequests(currentLibrary.id, { reqIds: idsToDelete });
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
      await apiClearAllRequests(currentLibrary.id, { reqIds: idsToDelete });
    } catch (err) {
      console.error(err);
      setRequests(await fetchRequests(currentLibrary.id));
    }
  };

  return {
    matchedByRequestId,
    handleSubmitRequest,
    handleUpdateStatus,
    handleDeleteRequest,
    handleClearToDownloadRequests,
    handleClearVerzoekjes,
  };
}
