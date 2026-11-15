import test from 'node:test';
import assert from 'node:assert/strict';

import { submitVoteBatch } from './voteBatch.js';

const entries = [
  { categoryId: 'cat-a', nomineeId: 'nominee-1' },
  { categoryId: 'cat-b', nomineeId: 'nominee-2' },
  { categoryId: 'cat-c', nomineeId: 'nominee-3' },
];

test('submits every selected category and records each accepted vote', async () => {
  const sent = [];
  const recorded = [];

  const result = await submitVoteBatch({
    entries,
    sendVote: async (entry) => {
      sent.push(entry.categoryId);
      return { status: 'accepted', nomineeId: entry.nomineeId };
    },
    recordVote: (entry) => recorded.push(entry),
    describeError: () => ({}),
  });

  assert.deepEqual(sent, ['cat-a', 'cat-b', 'cat-c'], 'all categories are sent');
  assert.equal(result.status, 'accepted');
  assert.deepEqual(result.accepted, entries);
  assert.deepEqual(recorded, entries);
});

test('a closed ballot stops the batch and keeps earlier accepted votes', async () => {
  let calls = 0;
  const recorded = [];

  const result = await submitVoteBatch({
    entries,
    sendVote: async (entry) => {
      calls += 1;
      if (entry.categoryId === 'cat-b') {
        throw Object.assign(new Error('Voting has closed.'), {
          code: 'failed-precondition',
        });
      }
      return { status: 'accepted', nomineeId: entry.nomineeId };
    },
    recordVote: (entry) => recorded.push(entry),
    describeError: (error) => ({ errorCode: error.code, message: error.message }),
  });

  assert.equal(calls, 2, 'remaining categories are not attempted');
  assert.equal(result.status, 'partial');
  assert.equal(result.closed, true);
  assert.deepEqual(result.accepted, [entries[0]]);
  assert.deepEqual(result.failed.map((failure) => failure.categoryId), ['cat-b']);
  assert.deepEqual(recorded, [entries[0]]);
});

test('an unavailable API is not retried for every category', async () => {
  let calls = 0;

  const result = await submitVoteBatch({
    entries,
    sendVote: async () => {
      calls += 1;
      throw Object.assign(new Error('Voting is temporarily unavailable.'), {
        code: 'unavailable',
      });
    },
    recordVote: () => {},
    describeError: (error) => ({ errorCode: error.code, message: error.message }),
  });

  assert.equal(calls, 1);
  assert.equal(result.status, 'error');
  assert.equal(result.failed.length, 1);
});

test('a recorded category is reported without exposing a nominee', async () => {
  const recorded = [];

  const result = await submitVoteBatch({
    entries: [entries[0]],
    sendVote: async () => ({ status: 'already-voted' }),
    recordVote: (entry) => recorded.push(entry),
    describeError: () => ({}),
  });

  assert.equal(result.status, 'accepted');
  assert.deepEqual(result.alreadyVoted, [{ categoryId: 'cat-a' }]);
  assert.deepEqual(recorded, [{ categoryId: 'cat-a' }]);
});

test('progress reaches the full count after the last response', async () => {
  const progress = [];

  await submitVoteBatch({
    entries,
    sendVote: async (entry) => ({ status: 'accepted', nomineeId: entry.nomineeId }),
    recordVote: () => {},
    describeError: () => ({}),
    onProgress: (value) => progress.push(value),
  });

  assert.deepEqual(progress, [
    { done: 0, total: 3 },
    { done: 1, total: 3 },
    { done: 2, total: 3 },
    { done: 3, total: 3 },
  ]);
});
