import { useMemo, useState } from 'react';
import { FiBarChart2, FiLoader, FiUsers } from 'react-icons/fi';
import { useAwardsResults } from '../../hooks/useAwardsResults';
import {
  categoriesWithCounts,
  nomineeDisplayName,
} from '../../utils/awardsVoting';

export default function AwardsVotingPanel() {
  const { categories, nominees, totals, acceptedVoteCount, competition, loading, error } =
    useAwardsResults();
  const [categoryFilter, setCategoryFilter] = useState('all');

  const visibleCategories = useMemo(
    () => categoriesWithCounts(categories, nominees),
    [categories, nominees],
  );

  const groupedNominees = useMemo(() => {
    const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
    const groups = new Map();

    for (const nominee of nominees) {
      const categoryId = nominee.categoryId ?? 'uncategorised';
      if (!groups.has(categoryId)) {
        groups.set(categoryId, {
          id: categoryId,
          name: categoryNameById.get(categoryId) ?? 'Uncategorised nominees',
          nominees: [],
        });
      }
      groups.get(categoryId).nominees.push({
        ...nominee,
        count: totals[nominee.id] ?? 0,
      });
    }

    const ordered = [...groups.values()]
      .filter((group) => categoryFilter === 'all' || group.id === categoryFilter)
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const group of ordered) {
      group.nominees.sort(
        (a, b) => b.count - a.count || nomineeDisplayName(a).localeCompare(nomineeDisplayName(b)),
      );
      group.total = group.nominees.reduce((sum, nominee) => sum + nominee.count, 0);
    }

    return ordered;
  }, [categories, nominees, totals, categoryFilter]);

  const closedByDeadline = useMemo(() => {
    const closesAt = competition?.closesAt;
    if (!closesAt) return null;
    const ms =
      typeof closesAt.toMillis === 'function'
        ? closesAt.toMillis()
        : new Date(closesAt).getTime();
    return Number.isFinite(ms) ? Date.now() >= ms : null;
  }, [competition]);

  const statusLabel =
    competition?.isOpen === true && closedByDeadline !== true
      ? 'Voting open'
      : competition?.isOpen === true
        ? 'Closed by deadline'
        : 'Voting closed';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FiLoader className="w-8 h-8 text-gray-400 animate-spin mb-4" aria-hidden="true" />
        <p className="text-gray-600 text-sm md:text-base">Loading live vote totals…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium mb-1 text-sm md:text-base">Unable to load vote results</p>
        <p className="text-red-600 text-xs md:text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Awards Voting Results</h2>
          <p className="text-xs md:text-sm text-gray-600">
            Live totals per nominee. Individual votes and voter details are never shown here.
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            statusLabel === 'Voting open'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs md:text-sm font-medium text-yellow-900">Accepted votes</h3>
            <FiBarChart2 className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" aria-hidden="true" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-yellow-900">{acceptedVoteCount}</p>
          <p className="text-xs text-yellow-700 mt-1">Counted once per browser and category</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs md:text-sm font-medium text-gray-800">Voting categories</h3>
            <FiBarChart2 className="w-4 h-4 md:w-5 md:h-5 text-gray-500" aria-hidden="true" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">{visibleCategories.length}</p>
          <p className="text-xs text-gray-600 mt-1">Categories with official nominees</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs md:text-sm font-medium text-gray-800">Nominees</h3>
            <FiUsers className="w-4 h-4 md:w-5 md:h-5 text-gray-500" aria-hidden="true" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">{nominees.length}</p>
          <p className="text-xs text-gray-600 mt-1">Across all countries</p>
        </div>
      </div>

      <div className="max-w-sm">
        <label htmlFor="voting-category-filter" className="block text-sm font-medium text-gray-700 mb-1">
          Filter by category
        </label>
        <select
          id="voting-category-filter"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All categories</option>
          {visibleCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {groupedNominees.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-gray-700">
          No nominees have been imported for this competition yet.
        </p>
      ) : (
        <div className="space-y-6">
          {groupedNominees.map((group) => (
            <section key={group.id} aria-labelledby={`voting-category-${group.id}`}>
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h3
                  id={`voting-category-${group.id}`}
                  className="text-base font-semibold text-gray-900"
                >
                  {group.name}
                </h3>
                <p className="text-xs md:text-sm text-gray-600">
                  {group.total} vote{group.total === 1 ? '' : 's'}
                </p>
              </div>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {group.nominees.map((nominee) => (
                  <li
                    key={nominee.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {nominee.personName || nominee.businessName || 'Nominee'}
                      </p>
                      {nominee.personName && nominee.businessName && (
                        <p className="text-sm text-gray-700 truncate">{nominee.businessName}</p>
                      )}
                      <p className="text-xs text-gray-500">{nominee.country ?? 'Unknown country'}</p>
                    </div>
                    <p
                      className="flex-shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary"
                      aria-label={`${nominee.count} vote${nominee.count === 1 ? '' : 's'}`}
                    >
                      {nominee.count}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
