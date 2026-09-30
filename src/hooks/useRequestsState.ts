import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { RequestKind, RequestStatus, Track, TrackRequest, USBLibrary } from '../types';
import { normalizeLibrarySettings } from '../types';
import {
  clearAllRequests as apiClearAllRequests,
  deleteRequest as apiDeleteRequest,
  fetchRequests,
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

function playableUnmatchedKey(
  requests: TrackRequest[],
  matchedByRequestId: Map<string, Track>,
  settledIds: Set<string>
): string {
  return requests
    .filter(
      (r) => r.kind === 'playable' && !matchedByRequestId.has(r.id) && !settledIds.has(r.id)
    )
    .map((r) => r.id)
    .sort()
    .join('\n');
}

export function useRequestsState({
  currentLibrary,
  isOwner,
  requests,
  setRequests,
}: UseRequestsStateArgs) {
  const [matchedByRequestId, setMatchedByRequestId] = useState<Map<string, Track>>(
    () => new Map()
  );
  /** Playable request ids we already tried to match (including no-hit). */
  const [settledIds, setSettledIds] = useState<Set<string>>(() => new Set());
  const requestsRef = useRef(requests);
  requestsRef.current = requests;
  const matchedLibraryIdRef = useRef<string | null>(null);

  const libraryId = currentLibrary?.id ?? null;

  const unmatchedKey = useMemo(
    () => playableUnmatchedKey(requests, matchedByRequestId, settledIds),
    [requests, matchedByRequestId, settledIds]
  );

  /** True once every playable request is linked or match was attempted. */
  const matchingReady =
    !libraryId ||
    requests
      .filter((r) => r.kind === 'playable')
      .every((r) => matchedByRequestId.has(r.id) || settledIds.has(r.id));

  // Drop cache entries for deleted requests; reset when library changes.
  useEffect(() => {
    if (!libraryId) {
      matchedLibraryIdRef.current = null;
      setMatchedByRequestId(new Map());
      setSettledIds(new Set());
      return;
    }

    if (matchedLibraryIdRef.current !== libraryId) {
      matchedLibraryIdRef.current = libraryId;
      setMatchedByRequestId(new Map());
      setSettledIds(new Set());
      return;
    }

    const liveIds = new Set(requests.map((r) => r.id));
    setMatchedByRequestId((prev) => {
      let changed = false;
      const next = new Map<string, Track>();
      for (const [id, track] of prev) {
        if (liveIds.has(id)) next.set(id, track);
        else changed = true;
      }
      return changed ? next : prev;
    });
    setSettledIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (liveIds.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [libraryId, requests]);

  // Server-match only playable requests that are not already linked.
  useEffect(() => {
    if (!libraryId || !unmatchedKey) return;

    let cancelled = false;
    const idsToMatch = new Set(unmatchedKey.split('\n').filter(Boolean));

    void (async () => {
      try {
        const toMatch = requestsRef.current.filter((r) => idsToMatch.has(r.id));
        if (toMatch.length === 0) return;

        const tracks = await matchRequestTracks(
          libraryId,
          toMatch.map((request) => ({ title: request.title, artist: request.artist }))
        );
        if (cancelled) return;

        setMatchedByRequestId((prev) => {
          const next = new Map(prev);
          for (const req of toMatch) {
            if (next.has(req.id)) continue;
            const track = findTrackInLibrary(req, tracks);
            if (track) next.set(req.id, track);
          }
          return next;
        });
        setSettledIds((prev) => {
          const next = new Set(prev);
          for (const id of idsToMatch) next.add(id);
          return next;
        });
      } catch (err) {
        console.error(err);
        if (cancelled) return;
        setSettledIds((prev) => {
          const next = new Set(prev);
          for (const id of idsToMatch) next.add(id);
          return next;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [libraryId, unmatchedKey]);

  /**
   * Submit a request with an explicit kind from the UI intent:
   * - playable: guest tapped "request" on a catalog track (pass that track to skip rematch)
   * - wishlist: guest asked to download a track that search did not find
   */
  const handleSubmitRequest = async (
    title: string,
    artist: string,
    kind: RequestKind,
    catalogTrack?: Track
  ) => {
    if (!currentLibrary) return;
    const ls = normalizeLibrarySettings(currentLibrary.librarySettings);
    if (kind === 'wishlist' && !ls.enableDownloadRequests) {
      return;
    }
    const req = await submitRequest(currentLibrary.id, title, artist, kind);
    if (catalogTrack) {
      setMatchedByRequestId((prev) => {
        const next = new Map(prev);
        next.set(req.id, catalogTrack);
        return next;
      });
      setSettledIds((prev) => {
        const next = new Set(prev);
        next.add(req.id);
        return next;
      });
    }
    setRequests((prev) => [req, ...prev]);
  };

  const handleUpdateStatus = async (requestId: string, status: RequestStatus) => {
    if (!currentLibrary || !isOwner) return;
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)));
    try {
      const updated = await updateRequestStatus(currentLibrary.id, requestId, status);
      setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
    } catch (err) {
      console.error('Fout bij bijwerken status:', err);
      setRequests(await fetchRequests(currentLibrary.id));
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
    matchingReady,
    handleSubmitRequest,
    handleUpdateStatus,
    handleDeleteRequest,
    handleClearToDownloadRequests,
    handleClearVerzoekjes,
  };
}
