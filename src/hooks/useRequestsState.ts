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
  /** False until the initial requests fetch for the current library finishes. */
  requestsReady: boolean;
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

function applyMatchResults(
  toMatch: TrackRequest[],
  tracks: Track[],
  setMatchedByRequestId: Dispatch<SetStateAction<Map<string, Track>>>,
  setSettledIds: Dispatch<SetStateAction<Set<string>>>
) {
  setMatchedByRequestId((prev) => {
    let changed = false;
    const next = new Map(prev);
    for (const req of toMatch) {
      if (next.has(req.id)) continue;
      const track = findTrackInLibrary(req, tracks);
      if (track) {
        next.set(req.id, track);
        changed = true;
      }
    }
    return changed ? next : prev;
  });
  setSettledIds((prev) => {
    let changed = false;
    const next = new Set(prev);
    for (const req of toMatch) {
      if (!next.has(req.id)) {
        next.add(req.id);
        changed = true;
      }
    }
    return changed ? next : prev;
  });
}

export function useRequestsState({
  currentLibrary,
  isOwner,
  requestsReady,
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
  /** Request ids with a match RPC already in flight (avoids duplicate calls). */
  const inFlightMatchIdsRef = useRef<Set<string>>(new Set());
  /**
   * After the first match pass for a library (batch on initial load), further
   * arrivals are matched one-by-one so rows can appear incrementally.
   */
  const initialMatchDoneRef = useRef(false);

  const libraryId = currentLibrary?.id ?? null;

  const unmatchedKey = useMemo(
    () => playableUnmatchedKey(requests, matchedByRequestId, settledIds),
    [requests, matchedByRequestId, settledIds]
  );

  // Drop cache entries for deleted requests; reset when library changes.
  useEffect(() => {
    if (!libraryId) {
      matchedLibraryIdRef.current = null;
      inFlightMatchIdsRef.current.clear();
      initialMatchDoneRef.current = false;
      setMatchedByRequestId(new Map());
      setSettledIds(new Set());
      return;
    }

    if (matchedLibraryIdRef.current !== libraryId) {
      matchedLibraryIdRef.current = libraryId;
      inFlightMatchIdsRef.current.clear();
      initialMatchDoneRef.current = false;
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

  // Initial load: one batch RPC. Later arrivals (realtime): one RPC per request
  // so already-matched rows can show without waiting for siblings.
  useEffect(() => {
    if (!libraryId || !requestsReady) return;

    if (!unmatchedKey) {
      initialMatchDoneRef.current = true;
      return;
    }

    const idsToMatch = unmatchedKey.split('\n').filter(Boolean);
    const libraryIdForMatch = libraryId;
    const useBatch = !initialMatchDoneRef.current;

    if (useBatch) {
      const alreadyInFlight = idsToMatch.some((id) => inFlightMatchIdsRef.current.has(id));
      if (alreadyInFlight) return;

      for (const id of idsToMatch) inFlightMatchIdsRef.current.add(id);

      void (async () => {
        try {
          const toMatch = requestsRef.current.filter((r) => idsToMatch.includes(r.id));
          if (toMatch.length === 0) return;

          const tracks = await matchRequestTracks(
            libraryIdForMatch,
            toMatch.map((request) => ({ title: request.title, artist: request.artist }))
          );

          if (matchedLibraryIdRef.current !== libraryIdForMatch) return;

          applyMatchResults(toMatch, tracks, setMatchedByRequestId, setSettledIds);
        } catch (err) {
          console.error(err);
          if (matchedLibraryIdRef.current !== libraryIdForMatch) return;
          setSettledIds((prev) => {
            const next = new Set(prev);
            for (const id of idsToMatch) next.add(id);
            return next;
          });
        } finally {
          for (const id of idsToMatch) inFlightMatchIdsRef.current.delete(id);
          if (matchedLibraryIdRef.current === libraryIdForMatch) {
            initialMatchDoneRef.current = true;
          }
        }
      })();
      return;
    }

    for (const id of idsToMatch) {
      if (inFlightMatchIdsRef.current.has(id)) continue;
      inFlightMatchIdsRef.current.add(id);

      void (async () => {
        try {
          const req = requestsRef.current.find((r) => r.id === id);
          if (!req) return;

          const tracks = await matchRequestTracks(libraryIdForMatch, [
            { title: req.title, artist: req.artist },
          ]);

          if (matchedLibraryIdRef.current !== libraryIdForMatch) return;
          if (!requestsRef.current.some((r) => r.id === id)) return;

          applyMatchResults([req], tracks, setMatchedByRequestId, setSettledIds);
        } catch (err) {
          console.error(err);
          if (matchedLibraryIdRef.current !== libraryIdForMatch) return;
          setSettledIds((prev) => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            return next;
          });
        } finally {
          inFlightMatchIdsRef.current.delete(id);
        }
      })();
    }
  }, [libraryId, requestsReady, unmatchedKey]);
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
    /** Playable request ids whose catalog match has finished (hit or miss). */
    settledIds,
    handleSubmitRequest,
    handleUpdateStatus,
    handleDeleteRequest,
    handleClearToDownloadRequests,
    handleClearVerzoekjes,
  };
}
