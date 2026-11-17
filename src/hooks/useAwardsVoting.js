import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_PATHS, getBackendApi, parseVoteResult, postBackendApi } from '../lib/backendApi';
import { submitVoteBatch } from '../lib/voteBatch';
import {
  AwardsStorageError,
  VOTING_COMPETITION_ID,
  ensureBrowserToken,
  formatVotingDeadline,
  isBrowserStorageAvailable,
  readVotedCategories,
  recordVotedCategory,
  toEpochMs,
  validateVoterDetails,
} from '../utils/awardsVoting';

const CATALOGUE_REFRESH_MS = 120_000;
const PAYLOAD_DEADLINE_POLL_MS = 30_000;
const DEFAULT_ERROR = 'Your vote could not be submitted. Please try again.';

function normalizeErrorCode(error) {
  const raw = String(error?.code ?? '');
  return raw.includes('/') ? raw.split('/').pop() : raw;
}

function messageFor(error) {
  const code = normalizeErrorCode(error);

  if (code === 'resource-exhausted') {
    return error?.message || 'Too many votes from this network right now. Please try again later.';
  }
  if (code === 'unavailable' || code === 'internal' || code === 'deadline-exceeded') {
    return 'Voting is temporarily unavailable. Please try again — a retry cannot count your vote twice.';
  }
  if (code === 'failed-precondition' || code === 'invalid-argument' || code === 'not-found') {
    return error?.message || DEFAULT_ERROR;
  }
  return DEFAULT_ERROR;
}

/**
 * Public awards ballot state.
 *
 * Subscribes only to the public catalogue (competition settings, categories and
 * nominee display fields). Votes go through the same-origin internal API
 * (`/api/v1/awards/vote`), which owns the deadline, deduplication and rate limits;
 * no Firebase function is involved. `castVotes` sends one request per selected
 * category in sequence, so a partial failure leaves accepted votes recorded and
 * the remaining selections can be retried. The local deadline timer only drives
 * the UI; `failed-precondition` from the server closes the ballot regardless of
 * the device clock.
 *
 * @param {string} [competitionId]
 */
export function useAwardsVoting(competitionId = VOTING_COMPETITION_ID) {
  const [categories, setCategories] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverClosed, setServerClosed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [storageAvailable, setStorageAvailable] = useState(
    () => isBrowserStorageAvailable(),
  );
  const [storageMessage, setStorageMessage] = useState(null);
  const [votedCategoryIds, setVotedCategoryIds] = useState(
    () => Object.keys(readVotedCategories()),
  );
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Confirm the browser can persist a voting identity before anyone votes.
  useEffect(() => {
    try {
      ensureBrowserToken();
      setStorageAvailable(true);
      setStorageMessage(null);
    } catch (storageError) {
      setStorageAvailable(false);
      setStorageMessage(
        storageError instanceof AwardsStorageError
          ? storageError.message
          : 'Voting needs browser storage to remember your vote.',
      );
    }
  }, []);

  // Public catalogue, served by the API from a snapshot (no Firestore reads).
  useEffect(() => {
    let cancelled = false;
    let hasLoaded = false;

    const load = async () => {
      try {
        const { data } = await getBackendApi(API_PATHS.catalogue);
        if (cancelled) return;
        setCompetition(data.competition ?? null);
        setCategories(
          [...(data.categories ?? [])].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
        );
        setNominees(
          (data.nominees ?? [])
            .filter((nominee) => nominee.disabled !== true)
            .sort((a, b) =>
              (a.personName ?? a.businessName ?? '').localeCompare(b.personName ?? b.businessName ?? ''),
            ),
        );
        hasLoaded = true;
        setError(null);
      } catch (loadError) {
        if (cancelled) return;
        console.error('Failed to load the awards catalogue:', loadError);
        // Keep showing an already-loaded ballot; only surface the error if empty.
        if (!hasLoaded) setError(loadError.message || 'Failed to load awards voting.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, CATALOGUE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [competitionId]);

  // Device clock drive for the visible closed state: refreshed on a timer and
  // whenever the page regains focus, so a stale tab cannot look open forever.
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, PAYLOAD_DEADLINE_POLL_MS);
    const onFocus = () => tick();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const closesAt = competition?.closesAt ?? null;
  const closesAtMs = toEpochMs(closesAt);
  const deadlineReached = closesAtMs === null ? true : now >= closesAtMs;
  const isOpen = Boolean(competition?.isOpen) && !deadlineReached && !serverClosed;

  const deadlineLabel = useMemo(() => formatVotingDeadline(closesAt), [closesAt]);

  const castVotes = useCallback(
    async ({ votes = [], name, email, onProgress } = {}) => {
      if (!isOpen) {
        return {
          status: 'closed',
          message: deadlineReached
            ? `Voting closed on ${deadlineLabel}.`
            : 'Voting is not open yet. You can browse the nominees.',
        };
      }
      if (!storageAvailable) {
        return {
          status: 'storage-unavailable',
          message:
            storageMessage ??
            'Voting needs browser storage to remember your vote. Enable site data, then reload.',
        };
      }

      const details = validateVoterDetails({ name, email });
      if (!details.ok) {
        return {
          status: 'invalid',
          errors: details.errors,
          message: details.errors.name || details.errors.email,
        };
      }

      // One entry per category. The server is authoritative, but dropping
      // categories that are already recorded locally avoids pointless calls.
      const unique = new Map();
      for (const vote of Array.isArray(votes) ? votes : []) {
        if (
          vote &&
          typeof vote.categoryId === 'string' &&
          typeof vote.nomineeId === 'string'
        ) {
          unique.set(vote.categoryId, vote);
        }
      }
      const alreadyRecorded = readVotedCategories();
      const entries = [...unique.values()].filter(
        (vote) => !alreadyRecorded[vote.categoryId],
      );
      if (entries.length === 0) {
        // Another tab may have recorded these after this page loaded; refresh
        // the local state so the stale selections disappear instead of looping.
        if (mountedRef.current) {
          setVotedCategoryIds(Object.keys(alreadyRecorded));
        }
        return { status: 'accepted', accepted: [], alreadyVoted: [], failed: [] };
      }

      let browserToken;
      try {
        browserToken = ensureBrowserToken();
      } catch (storageError) {
        if (mountedRef.current) {
          setStorageAvailable(false);
          setStorageMessage(storageError.message);
        }
        return { status: 'storage-unavailable', message: storageError.message };
      }

      const batch = await submitVoteBatch({
        entries,
        sendVote: async ({ categoryId, nomineeId }) => {
          const payload = { competitionId, categoryId, nomineeId, browserToken };
          // Anonymous mode sends no optional identity fields at all.
          if (details.value.name !== null) payload.name = details.value.name;
          if (details.value.email !== null) payload.email = details.value.email;

          const response = await postBackendApi(API_PATHS.vote, payload);
          return parseVoteResult(response?.data);
        },
        recordVote: (entry) => recordVotedCategory(undefined, entry),
        describeError: (error) => ({
          errorCode: normalizeErrorCode(error),
          message: messageFor(error),
        }),
        onProgress,
      });

      if (batch.closed && mountedRef.current) setServerClosed(true);
      if (mountedRef.current) {
        setVotedCategoryIds(Object.keys(readVotedCategories()));
      }

      return batch;
    },
    [
      competitionId,
      deadlineLabel,
      deadlineReached,
      isOpen,
      storageAvailable,
      storageMessage,
    ],
  );

  return {
    categories,
    nominees,
    competition,
    loading,
    error,
    isOpen,
    closesAt,
    deadlineLabel,
    deadlineReached,
    castVotes,
    votedCategoryIds,
    storageAvailable,
    storageMessage,
  };
}

export default useAwardsVoting;
