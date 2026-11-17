import { useEffect, useMemo, useState } from 'react';
import { auth } from '../lib/firebase';
import { API_PATHS, getBackendApi } from '../lib/backendApi';
import { VOTING_COMPETITION_ID } from '../utils/awardsVoting';

const REFRESH_MS = 15_000;

/**
 * Live private result totals for the admin voting panel.
 *
 * Totals are read from the voting API (`/api/v1/admin/awards/results`), which
 * counts the votes it recorded and authorises the caller from their Firebase
 * sign-in token. An unauthorised account receives an explicit error rather than
 * a silent zero. Individual vote records and voter details are never returned.
 *
 * @param {string} [competitionId] - Kept for call compatibility; the API serves
 * the single configured competition.
 */
// eslint-disable-next-line no-unused-vars
export function useAwardsResults(competitionId = VOTING_COMPETITION_ID) {
  const [categories, setCategories] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [totals, setTotals] = useState({});
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw Object.assign(new Error('Sign in to view award results.'), { code: 'unauthenticated' });
        const token = await user.getIdToken();
        const { data } = await getBackendApi(API_PATHS.adminResults, {
          headers: { authorization: `Bearer ${token}` },
        });
        if (cancelled) return;

        setCompetition(data.competition ?? null);
        setCategories(
          [...(data.categories ?? [])].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
        );
        setNominees(data.nominees ?? []);
        setTotals(data.totals ?? {});
        setError(null);
      } catch (loadError) {
        if (cancelled) return;
        console.error('Failed to load award vote totals:', loadError);
        setError(loadError.message || 'Failed to load award vote totals.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

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
