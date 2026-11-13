import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { VOTING_COMPETITION_ID } from '../utils/awardsVoting';

const COMPETITION_COLLECTION = 'award_competitions';

/**
 * Live private result totals for the admin voting panel.
 *
 * Subscribes to the nominee catalogue and the private `totals` collection only
 * while the panel is mounted. Access is authorised by Firestore rules: a caller
 * without an approved admin record receives permission errors, which surface
 * through `error` rather than as a silent zero.
 *
 * Individual vote records (and any optional voter details on them) are never
 * fetched here — totals are enough to report results.
 *
 * @param {string} [competitionId]
 */
export function useAwardsResults(competitionId = VOTING_COMPETITION_ID) {
  const [categories, setCategories] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [totals, setTotals] = useState({});
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let loaded = 0;
    const markLoaded = () => {
      loaded += 1;
      if (loaded >= 3) setLoading(false);
    };

    const base = [COMPETITION_COLLECTION, competitionId];

    const unsubscribeCompetition = onSnapshot(
      doc(db, ...base),
      (snapshot) => {
        setCompetition(snapshot.exists() ? snapshot.data() : null);
        markLoaded();
      },
      (snapshotError) => {
        console.error('Failed to load the awards competition:', snapshotError);
        setError(snapshotError.message || 'Failed to load awards competition settings.');
        markLoaded();
      },
    );

    const unsubscribeCategories = onSnapshot(
      collection(db, ...base, 'categories'),
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
      collection(db, ...base, 'nominees'),
      (snapshot) => {
        setNominees(
          snapshot.docs.map((nomineeDoc) => ({ id: nomineeDoc.id, ...nomineeDoc.data() })),
        );
        markLoaded();
      },
      (snapshotError) => {
        console.error('Failed to load award nominees:', snapshotError);
        setError(snapshotError.message || 'Failed to load award nominees.');
        markLoaded();
      },
    );

    const unsubscribeTotals = onSnapshot(
      collection(db, ...base, 'totals'),
      (snapshot) => {
        const next = {};
        for (const totalDoc of snapshot.docs) {
          const count = Number(totalDoc.get('count') ?? 0);
          next[totalDoc.id] = Number.isFinite(count) ? count : 0;
        }
        setTotals(next);
        markLoaded();
      },
      (snapshotError) => {
        console.error('Failed to load award vote totals:', snapshotError);
        setError(
          snapshotError.code === 'permission-denied'
            ? 'Your account is not authorised to view award results.'
            : snapshotError.message || 'Failed to load award vote totals.',
        );
        markLoaded();
      },
    );

    return () => {
      unsubscribeCompetition();
      unsubscribeCategories();
      unsubscribeNominees();
      unsubscribeTotals();
    };
  }, [competitionId]);

  const acceptedVoteCount = useMemo(
    () => Object.values(totals).reduce((sum, count) => sum + count, 0),
    [totals],
  );

  return {
    categories,
    nominees,
    totals,
    acceptedVoteCount,
    competition,
    loading,
    error,
  };
}

export default useAwardsResults;
