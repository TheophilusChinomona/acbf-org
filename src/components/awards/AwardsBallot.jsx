import { useMemo, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import Loading from '../common/Loading';
import VotingCountdown from './VotingCountdown';
import { useAwardsVoting } from '../../hooks/useAwardsVoting';
import {
  categoriesWithCounts,
  filterNominees,
  listCountries,
  nomineeDisplayName,
  validateVoterDetails,
} from '../../utils/awardsVoting';

const STATUS_TONES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

export default function AwardsBallot() {
  const {
    categories,
    nominees,
    loading,
    error,
    isOpen,
    deadlineLabel,
    deadlineReached,
    closesAt,
    castVote,
    votingCategoryId,
    votedCategoryIds,
    storageAvailable,
    storageMessage,
  } = useAwardsVoting();

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedNomineeId, setSelectedNomineeId] = useState('');
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [voterName, setVoterName] = useState('');
  const [voterEmail, setVoterEmail] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const visibleCategories = useMemo(
    () => categoriesWithCounts(categories, nominees),
    [categories, nominees],
  );
  const countries = useMemo(() => listCountries(nominees), [nominees]);

  const activeCategoryId = selectedCategoryId || visibleCategories[0]?.id || '';
  const activeCategory =
    visibleCategories.find((category) => category.id === activeCategoryId) ?? null;
  const alreadyVoted = activeCategoryId ? votedCategoryIds.includes(activeCategoryId) : false;

  const categoryNominees = useMemo(
    () => filterNominees(nominees, { categoryId: activeCategoryId, search, country }),
    [nominees, activeCategoryId, search, country],
  );

  const nomineeById = useMemo(() => {
    const map = new Map();
    for (const nominee of nominees) map.set(nominee.id, nominee);
    return map;
  }, [nominees]);

  const details = validateVoterDetails({
    name: anonymous ? '' : voterName,
    email: anonymous ? '' : voterEmail,
  });

  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setSelectedNomineeId('');
    setSearch('');
    setCountry('');
    setStatus(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isOpen) {
      setStatus({
        tone: 'info',
        message: deadlineReached
          ? `Voting closed on ${deadlineLabel}.`
          : 'Voting is not open yet. You can browse the nominees.',
      });
      return;
    }
    if (!activeCategoryId || !selectedNomineeId) {
      setStatus({ tone: 'warning', message: 'Choose a nominee before confirming your vote.' });
      return;
    }
    if (!details.ok) {
      setStatus({ tone: 'error', message: details.errors.name || details.errors.email });
      return;
    }

    setSubmitting(true);
    setStatus({ tone: 'info', message: 'Sending your vote…' });

    const chosenNominee = nomineeById.get(selectedNomineeId);
    const result = await castVote({
      categoryId: activeCategoryId,
      nomineeId: selectedNomineeId,
      name: details.value.name,
      email: details.value.email,
    });

    setSubmitting(false);

    switch (result.status) {
      case 'accepted':
        setStatus({
          tone: 'success',
          message: `Your vote for ${nomineeDisplayName(chosenNominee)} in ${
            activeCategory?.name ?? 'this category'
          } has been recorded.`,
        });
        toast.success('Your vote has been recorded.');
        setSelectedNomineeId('');
        break;
      case 'already-voted':
        setStatus({
          tone: 'info',
          message: 'This browser has already voted in this category. Each browser can vote once per category.',
        });
        break;
      case 'closed':
        setStatus({ tone: 'info', message: result.message });
        break;
      case 'storage-unavailable':
        setStatus({ tone: 'warning', message: result.message });
        break;
      case 'invalid':
        setStatus({ tone: 'error', message: result.message });
        break;
      default:
        setStatus({ tone: 'error', message: result.message });
        toast.error(result.message);
        break;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Loading text="Loading the awards ballot…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="font-medium text-red-800 mb-1">The awards ballot could not load</p>
        <p className="text-sm text-red-700">{error}</p>
        <p className="text-sm text-red-700 mt-2">Please refresh the page to try again.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Vote for the 2026 ACBF Awards</h2>
          <p className="text-gray-600 mt-1">
            One vote per category per browser. No account or email verification is required.
          </p>
        </div>
        <p
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
          }`}
        >
          {isOpen ? 'Voting open' : deadlineReached ? 'Voting closed' : 'Voting is not open yet'}
        </p>
      </div>

      <VotingCountdown closesAt={closesAt} deadlineLabel={deadlineLabel} />

      {!storageAvailable && (
        <p className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          <FiAlertTriangle className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>
            {storageMessage ??
              'Voting needs browser storage to remember your vote. Enable site data, then reload the page.'}{' '}
            You can still browse the nominees.
          </span>
        </p>
      )}

      {!isOpen && (
        <p className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <FiInfo className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>
            {deadlineReached
              ? `Voting closed on ${deadlineLabel}. The nominee list stays available for reference; no further votes are accepted.`
              : `Voting is not open yet. You can browse the nominees. The scheduled closing time is ${deadlineLabel}.`}
          </span>
        </p>
      )}

      {visibleCategories.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-gray-700">
          The official nominee list is being prepared. Please check back shortly.
        </p>
      ) : (
        <>
          <section aria-labelledby="award-category-heading">
            <h3 id="award-category-heading" className="text-lg font-semibold text-gray-900 mb-3">
              Choose a category
            </h3>
            <label htmlFor="award-category" className="sr-only">Choose a category</label>
            <select
              id="award-category"
              value={activeCategoryId}
              onChange={(event) => handleCategoryChange(event.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {visibleCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.nomineeCount}){votedCategoryIds.includes(category.id) ? ' — vote recorded' : ''}
                </option>
              ))}
            </select>
          </section>

          <section aria-labelledby="nominee-list-heading" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="nominee-search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search nominees
                </label>
                <div className="relative">
                  <FiSearch
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    id="nominee-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Person or business name"
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="sm:w-56">
                <label htmlFor="nominee-country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  id="nominee-country"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All countries</option>
                  {countries.map((countryName) => (
                    <option key={countryName} value={countryName}>
                      {countryName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset
              className="rounded-lg border border-gray-200 bg-white"
              aria-describedby="nominee-list-note"
            >
              <legend
                id="nominee-list-heading"
                className="px-4 pt-4 text-lg font-semibold text-gray-900"
              >
                {activeCategory?.name ?? 'Nominees'}
              </legend>
              <p id="nominee-list-note" className="px-4 pb-2 text-sm text-gray-600">
                {alreadyVoted
                  ? 'This browser has already voted in this category.'
                  : 'Select one nominee, then confirm your vote below.'}
              </p>

              {categoryNominees.length === 0 ? (
                <p className="px-4 pb-4 text-sm text-gray-600">
                  No nominees match your search in this category.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {categoryNominees.map((nominee) => {
                    const inputId = `nominee-${nominee.id}`;
                    const isChecked = selectedNomineeId === nominee.id;
                    return (
                      <li key={nominee.id}>
                        <label
                          htmlFor={inputId}
                          className={`flex cursor-pointer items-start gap-3 px-4 py-3 ${
                            alreadyVoted ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            id={inputId}
                            type="radio"
                            name="nominee"
                            value={nominee.id}
                            checked={isChecked}
                            disabled={!isOpen || alreadyVoted || submitting}
                            onChange={() => setSelectedNomineeId(nominee.id)}
                            className="mt-1 h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="min-w-0">
                            <span className="block font-medium text-gray-900">
                              {nominee.personName || nominee.businessName || 'Nominee'}
                            </span>
                            {nominee.personName && nominee.businessName && (
                              <span className="block text-sm text-gray-700">{nominee.businessName}</span>
                            )}
                            <span className="block text-sm text-gray-500">{nominee.country}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </fieldset>
          </section>

          <section aria-labelledby="voter-details-heading" className="space-y-4">
            <div>
              <h3 id="voter-details-heading" className="text-lg font-semibold text-gray-900">
                Your details (optional)
              </h3>
              <p className="text-sm text-gray-600">
                Votes are final. Names and emails are unverified, kept private, and never shown with
                results.
              </p>
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(event) => {
                  setAnonymous(event.target.checked);
                  if (event.target.checked) {
                    setVoterName('');
                    setVoterEmail('');
                  }
                }}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>Vote anonymously — do not include my name or email.</span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="voter-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  id="voter-name"
                  type="text"
                  value={voterName}
                  onChange={(event) => setVoterName(event.target.value)}
                  disabled={anonymous}
                  maxLength={120}
                  autoComplete="name"
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 disabled:bg-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {!anonymous && details.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{details.errors.name}</p>
                )}
              </div>
              <div>
                <label htmlFor="voter-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="voter-email"
                  type="email"
                  value={voterEmail}
                  onChange={(event) => setVoterEmail(event.target.value)}
                  disabled={anonymous}
                  maxLength={254}
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 disabled:bg-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {!anonymous && details.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{details.errors.email}</p>
                )}
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="submit"
              size="lg"
              disabled={!isOpen || !selectedNomineeId || submitting || alreadyVoted}
              className="gap-2"
            >
              <FiCheckCircle aria-hidden="true" />
              {submitting ? 'Submitting…' : 'Confirm my vote'}
            </Button>
            {votingCategoryId && (
              <p className="text-sm text-gray-600">Your vote is being sent…</p>
            )}
          </div>

          <div role="status" aria-live="polite" className="min-h-[1.5rem]">
            {status && (
              <p className={`rounded-lg border p-4 text-sm ${STATUS_TONES[status.tone] ?? STATUS_TONES.info}`}>
                {status.message}
              </p>
            )}
          </div>
        </>
      )}
    </form>
  );
}
