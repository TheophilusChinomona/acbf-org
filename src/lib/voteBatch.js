/**
 * Sequence a browser's votes for several categories.
 *
 * Kept free of React and Firebase so the submission semantics are testable:
 * one request at a time, accepted votes recorded immediately, and no hammering
 * once the ballot has closed or the API is unreachable. The caller owns input
 * validation, the browser token and the transport.
 */

const TERMINAL_CODES = new Set([
  'failed-precondition',
  'unavailable',
  'internal',
  'deadline-exceeded',
  'resource-exhausted',
]);

/**
 * @param {{
 *   entries: Array<{categoryId: string, nomineeId: string}>,
 *   sendVote: (entry: {categoryId: string, nomineeId: string}) => Promise<{status: string}>,
 *   recordVote: (entry: {categoryId: string, nomineeId?: string}) => void,
 *   describeError: (error: unknown) => {errorCode?: string, message?: string},
 *   onProgress?: (progress: {done: number, total: number}) => void,
 * }} options
 * @returns {Promise<{
 *   status: 'accepted'|'partial'|'error'|'invalid',
 *   accepted: Array<{categoryId: string, nomineeId: string}>,
 *   alreadyVoted: Array<{categoryId: string}>,
 *   failed: Array<{categoryId: string, nomineeId: string, errorCode: string, message: string}>,
 *   closed: boolean,
 * }>}
 */
export async function submitVoteBatch({
  entries,
  sendVote,
  recordVote,
  describeError,
  onProgress,
} = {}) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return {
      status: 'invalid',
      accepted: [],
      alreadyVoted: [],
      failed: [],
      closed: false,
    };
  }

  const accepted = [];
  const alreadyVoted = [];
  const failed = [];
  let closed = false;

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    onProgress?.({ done: index, total: entries.length });

    try {
      const result = await sendVote(entry);

      if (result?.status === 'already-voted') {
        alreadyVoted.push({ categoryId: entry.categoryId });
        recordVote?.({ categoryId: entry.categoryId });
      } else if (result?.status === 'accepted') {
        accepted.push({
          categoryId: entry.categoryId,
          nomineeId: entry.nomineeId,
        });
        recordVote?.({
          categoryId: entry.categoryId,
          nomineeId: entry.nomineeId,
        });
      } else {
        throw new Error('The voting service returned an unexpected result.');
      }
    } catch (error) {
      const described = describeError?.(error) ?? {};
      const errorCode = described.errorCode ?? '';

      if (errorCode === 'failed-precondition') closed = true;
      failed.push({
        categoryId: entry.categoryId,
        nomineeId: entry.nomineeId,
        errorCode,
        message: described.message ?? 'Your vote could not be submitted.',
      });

      if (TERMINAL_CODES.has(errorCode)) break;
    }
  }

  onProgress?.({ done: entries.length, total: entries.length });

  if (failed.length === 0) {
    return { status: 'accepted', accepted, alreadyVoted, failed, closed };
  }

  return {
    status: accepted.length + alreadyVoted.length > 0 ? 'partial' : 'error',
    accepted,
    alreadyVoted,
    failed,
    closed,
  };
}

export default submitVoteBatch;
