import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { API_PATHS, parseVoteResult, postBackendApi } from '../lib/backendApi';
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

const COMPETITION_COLLECTION = 'award_competitions';
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
 * no Firebase function is involved. The local deadline timer only drives the UI;
 * `failed-precondition` from the server closes the ballot regardless of the
 * device clock.
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
  const [votingCategoryId, setVotingCategoryId] = useState(null);
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

  // Public catalogue subscriptions.
  useEffect(() => {
    let loaded = 0;
    const markLoaded = () => {
      loaded += 1;
      if (loaded >= 3) setLoading(false);
    };

    const competitionRef = doc(db, COMPETITION_COLLECTION, competitionId);
    const unsubscribeCompetition = onSnapshot(
      competitionRef,
      (snapshot) => {
        setCompetition(snapshot.exists() ? snapshot.data() : null);
        setError(null);
        markLoaded();
      },
      (snapshotError) => {
        console.error('Failed to load the awards competition:', snapshotError);
        setError(snapshotError.message || 'Failed to load awards voting.');
        markLoaded();
      },
    );

    const unsubscribeCategories = onSnapshot(
      collection(db, COMPETITION_COLLECTION, competitionId, 'categories'),
      (snapshot) => {
        setCategories(
          snapshot.docs
            .map((categoryDoc) => ({ id: categoryDoc.id, ...categoryDoc.data() }))
            .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
        );
        markLoaded();
      },
      (snapshotError) => {
        console.error('Failed to load award categories:', snapshotError);
        setError(snapshotError.message || 'Failed to load award categories.');
        markLoaded();
      },
    );

    const unsubscribeNominees = onSnapshot(
      collection(db, COMPETITION_COLLECTION, competitionId, 'nominees'),
      (snapshot) => {
        setNominees(
          snapshot.docs
            .map((nomineeDoc) => ({ id: nomineeDoc.id, ...nomineeDoc.data() }))
            .filter((nominee) => nominee.disabled !== true)
            .sort((a, b) => (a.personName ?? a.businessName ?? '').localeCompare(b.personName ?? b.businessName ?? '')),
        );
        markLoaded();
      },
      (snapshotError) => {
        console.error('Failed to load award nominees:', snapshotError);
        setError(snapshotError.message || 'Failed to load award nominees.');
        markLoaded();
      },
    );

    return () => {
      unsubscribeCompetition();
      unsubscribeCategories();
      unsubscribeNominees();
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

  const castVote = useCallback(
    async ({ categoryId, nomineeId, name, email } = {}) => {
      if (!isOpen) {
        return {
          status: 'closed',
          message: deadlineReached
            ? `Voting closed on ${deadlineLabel}.`
            : 'Voting is not open yet. You can browse the nominees.',
        };
      }
      if (votedCategoryIds.includes(categoryId)) {
        return {
          status: 'already-voted',
          message: 'This browser has already voted in this category.',
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

      setVotingCategoryId(categoryId);
      try {
        const payload = { competitionId, categoryId, nomineeId, browserToken };
        // Anonymous mode sends no optional identity fields at all.
        if (details.value.name !== null) payload.name = details.value.name;
        if (details.value.email !== null) payload.email = details.value.email;

        const response = await postBackendApi(API_PATHS.vote, payload);
        const result = parseVoteResult(response?.data);

        // Only a recorded outcome may lock the category locally. A duplicate is
        // already recorded server-side, so the attempt is remembered without
        // claiming a nominee the response never discloses.
        const nextVotes = recordVotedCategory(
          undefined,
          result.status === 'accepted' ? { categoryId, nomineeId } : { categoryId },
        );
        if (mountedRef.current) setVotedCategoryIds(Object.keys(nextVotes));

        if (result.status === 'already-voted') {
          return {
            status: 'already-voted',
            message: 'This browser has already voted in this category.',
          };
        }

        return { status: 'accepted', nomineeId };
      } catch (callError) {
        const code = normalizeErrorCode(callError);
        if (code === 'failed-precondition' && mountedRef.current) setServerClosed(true);

        return {
          status: 'error',
          errorCode: code,
          message: messageFor(callError),
        };
      } finally {
        if (mountedRef.current) setVotingCategoryId(null);
      }
    },
    [
      competitionId,
      deadlineLabel,
      deadlineReached,
      isOpen,
      storageAvailable,
      storageMessage,
      votedCategoryIds,
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
    castVote,
    votingCategoryId,
    votedCategoryIds,
    storageAvailable,
    storageMessage,
  };
}

export default useAwardsVoting;
