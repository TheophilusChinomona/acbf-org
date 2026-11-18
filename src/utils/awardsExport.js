import { format } from 'date-fns';

/**
 * Row builders for the admin awards exports. They are pure (no file or network
 * access) so they can be tested; `utils/exportData.js` turns the rows into Excel.
 */

function categoryNames(categories) {
  return new Map((categories ?? []).map((category) => [category.id, category.name]));
}

function byName(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''));
}

/**
 * One row per nominee with its vote total, grouped by category and ranked within
 * it. Voter details are never part of this export.
 *
 * @param {{categories: Array, nominees: Array, totals: Record<string, number>}} data
 */
export function prepareAwardsResults({ categories, nominees, totals }) {
  const names = categoryNames(categories);
  const rows = (nominees ?? []).map((nominee) => ({
    category: names.get(nominee.categoryId) ?? nominee.categoryId ?? 'Uncategorised',
    nominee,
    votes: totals?.[nominee.id] ?? 0,
  }));

  rows.sort(
    (a, b) =>
      byName(a.category, b.category) ||
      b.votes - a.votes ||
      byName(a.nominee.personName || a.nominee.businessName, b.nominee.personName || b.nominee.businessName),
  );

  const rankByCategory = new Map();
  return rows.map(({ category, nominee, votes }) => {
    const rank = (rankByCategory.get(category) ?? 0) + 1;
    rankByCategory.set(category, rank);
    return {
      Category: category,
      Rank: rank,
      Nominee: nominee.personName || '',
      Business: nominee.businessName || '',
      Country: nominee.country || '',
      Votes: votes,
    };
  });
}

function formatVoteTime(createdAt) {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? '' : format(date, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * One row per accepted vote, oldest first, including the optional voter name and
 * email. Admin-only: voters were told these are kept private.
 *
 * @param {{categories: Array, nominees: Array, votes: Array}} data
 */
export function prepareAwardsVotes({ categories, nominees, votes }) {
  const names = categoryNames(categories);
  const nomineeById = new Map((nominees ?? []).map((nominee) => [nominee.id, nominee]));

  return [...(votes ?? [])]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((vote) => {
      const nominee = nomineeById.get(vote.nomineeId);
      return {
        'Voted At': formatVoteTime(vote.createdAt),
        Category: names.get(vote.categoryId) ?? vote.categoryId ?? '',
        Nominee: nominee?.personName || '',
        Business: nominee?.businessName || '',
        Country: nominee?.country || '',
        'Voter Name': vote.name || '',
        'Voter Email': vote.email || '',
      };
    });
}
