/**
 * Firestore security-rules tests for the awards voting collections and the
 * nomination archive.
 *
 * Run against the emulator:
 *   firebase emulators:exec --only firestore --project demo-acbf \
 *     "node --test tests/firestore/awards.rules.test.mjs"
 *
 * Nothing here talks to production: the emulator is selected by demo project id
 * and the rules under test are the local firestore.rules file.
 */

import test, { before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';

const PROJECT_ID = 'demo-acbf';
const SUPER_ADMIN_EMAIL = 'chinomonatinotenda19@gmail.com';
const RULES = readFileSync(fileURLToPath(new URL('../../firestore.rules', import.meta.url)), 'utf8');

const COMPETITION_PATH = 'award_competitions/2026';
const CATEGORY_PATH = `${COMPETITION_PATH}/categories/education`;
const NOMINEE_PATH = `${COMPETITION_PATH}/nominees/education-kenya-some-person`;
const VOTE_PATH = `${COMPETITION_PATH}/votes/vote-key`;
const TOTAL_PATH = `${COMPETITION_PATH}/totals/education-kenya-some-person`;
const RATE_LIMIT_PATH = `${COMPETITION_PATH}/rate_limits/browser_abc`;

let testEnv;

async function seed(testEnvToSeed) {
  await testEnvToSeed.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.doc(COMPETITION_PATH).set({
      isOpen: true,
      closesAt: new Date('2026-11-19T14:00:00Z'),
    });
    await db.doc(CATEGORY_PATH).set({ id: 'education', name: 'Excellence in Education' });
    await db.doc(NOMINEE_PATH).set({
      id: 'education-kenya-some-person',
      categoryId: 'education',
      businessName: 'Synthetic Business',
      personName: 'Some Person',
      country: 'Kenya',
    });
    await db.doc(VOTE_PATH).set({
      competitionId: '2026',
      categoryId: 'education',
      nomineeId: 'education-kenya-some-person',
      name: 'Voter',
      email: 'voter@example.test',
      createdAt: new Date(),
    });
    await db.doc(TOTAL_PATH).set({ count: 1 });
    await db.doc(RATE_LIMIT_PATH).set({ count: 1 });

    await db.doc('approved_admins/admin@example.test').set({
      email: 'admin@example.test',
      name: 'Approved Admin',
      status: 'approved',
    });
    await db.doc('users/member-uid').set({
      email: 'member@example.test',
      name: 'Member',
      role: 'member',
      status: 'approved',
    });
    await db.doc('users/other-member-uid').set({
      email: 'other-member@example.test',
      name: 'Other Member',
      role: 'member',
      status: 'approved',
    });
    await db.doc('users/admin-uid').set({
      email: 'admin@example.test',
      name: 'Approved Admin',
      role: 'admin',
      status: 'approved',
    });
    await db.doc('awards_nominations/legacy-nomination').set({
      category: 'Excellence in Education',
      status: 'pending',
      archived: true,
      submittedAt: new Date(),
    });
    await db.doc('contact_submissions/contact-1').set({
      name: 'Public Sender',
      email: 'sender@example.test',
      subject: 'Hello',
      message: 'Message',
      status: 'new',
      created_at: new Date(),
    });
    await db.doc('admin_invitations/invite-1').set({
      email: 'invitee@example.test',
      token: 'a'.repeat(64),
      status: 'pending',
      created_at: new Date(),
    });
    await db.doc('membership_applications/application-1').set({
      name: 'Applicant',
      email: 'applicant@example.test',
      phone: '+27000000000',
      business_type: 'Retail',
      status: 'pending',
      created_at: new Date(),
    });
  });
}

function parseEmulatorHost() {
  const value = process.env.FIRESTORE_EMULATOR_HOST;
  if (!value) return null;
  const [host, port] = value.split(':');
  return { host, port: Number(port) };
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: RULES,
      ...(parseEmulatorHost() ?? { host: '127.0.0.1', port: 8787 }),
    },
  });
  await seed(testEnv);
});

after(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seed(testEnv);
});

const anonDb = () => testEnv.unauthenticatedContext().firestore();
const memberDb = () =>
  testEnv.authenticatedContext('member-uid', { email: 'member@example.test' }).firestore();
const adminDb = () =>
  testEnv.authenticatedContext('admin-uid', { email: 'admin@example.test' }).firestore();
const superAdminDb = () =>
  testEnv.authenticatedContext('super-uid', { email: SUPER_ADMIN_EMAIL }).firestore();

describe('public catalogue', () => {
  test('anonymous visitors can read the competition, categories and nominees', async () => {
    const db = anonDb();

    await assertSucceeds(db.doc(COMPETITION_PATH).get());
    await assertSucceeds(db.doc(CATEGORY_PATH).get());
    await assertSucceeds(db.doc(NOMINEE_PATH).get());
    await assertSucceeds(db.collection(`${COMPETITION_PATH}/nominees`).get());
    await assertSucceeds(db.collection(`${COMPETITION_PATH}/categories`).get());
  });

  test('catalogue documents carry display fields only', async () => {
    const snapshot = await assertSucceeds(adminDb().doc(NOMINEE_PATH).get());
    assert.deepEqual(Object.keys(snapshot.data()).sort(), [
      'businessName',
      'categoryId',
      'country',
      'id',
      'personName',
    ]);
  });
});

describe('private voting data', () => {
  test('anonymous visitors cannot read votes, totals or rate limits', async () => {
    const db = anonDb();

    await assertFails(db.doc(VOTE_PATH).get());
    await assertFails(db.doc(TOTAL_PATH).get());
    await assertFails(db.doc(RATE_LIMIT_PATH).get());
  });

  test('members cannot read votes or totals', async () => {
    const db = memberDb();

    await assertFails(db.doc(VOTE_PATH).get());
    await assertFails(db.doc(TOTAL_PATH).get());
  });

  test('approved admins can read votes and totals', async () => {
    const db = adminDb();

    await assertSucceeds(db.doc(VOTE_PATH).get());
    await assertSucceeds(db.doc(TOTAL_PATH).get());
    await assertSucceeds(db.collection(`${COMPETITION_PATH}/totals`).get());
  });

  test('the super admin can read totals without an approved_admins record', async () => {
    await assertSucceeds(superAdminDb().doc(TOTAL_PATH).get());
  });

  test('no client can write voting data or the catalogue', async () => {
    for (const db of [anonDb(), memberDb(), adminDb()]) {
      await assertFails(db.doc(VOTE_PATH).set({ nomineeId: 'tampered' }));
      await assertFails(db.doc(TOTAL_PATH).set({ count: 9999 }, { merge: true }));
      await assertFails(db.doc(RATE_LIMIT_PATH).set({ count: 0 }));
      await assertFails(db.doc(NOMINEE_PATH).set({ personName: 'Tampered' }, { merge: true }));
      await assertFails(db.doc(CATEGORY_PATH).set({ name: 'Tampered' }, { merge: true }));
      await assertFails(db.doc(COMPETITION_PATH).set({ isOpen: true }, { merge: true }));
    }
  });

  test('rate limits are never readable, even by admins', async () => {
    await assertFails(adminDb().doc(RATE_LIMIT_PATH).get());
  });
});

describe('nomination archive', () => {
  test('public nomination submissions are rejected', async () => {
    await assertFails(
      anonDb().collection('awards_nominations').add({
        category: 'Excellence in Education',
        status: 'pending',
        submittedAt: new Date(),
      }),
    );
  });

  test('admins still read archived nominations and can unarchive them', async () => {
    const db = adminDb();
    const snapshot = await assertSucceeds(db.doc('awards_nominations/legacy-nomination').get());
    assert.equal(snapshot.data().archived, true);
    await assertSucceeds(
      db.doc('awards_nominations/legacy-nomination').update({ archived: false }),
    );
  });

  test('anonymous visitors and members cannot read nominations', async () => {
    await assertFails(anonDb().doc('awards_nominations/legacy-nomination').get());
    await assertFails(memberDb().doc('awards_nominations/legacy-nomination').get());
  });

  test('nomination records cannot be deleted', async () => {
    await assertFails(adminDb().doc('awards_nominations/legacy-nomination').delete());
    await assertFails(superAdminDb().doc('awards_nominations/legacy-nomination').delete());
  });
});

describe('role escalation', () => {
  test('members cannot raise their own role or status', async () => {
    const db = memberDb();

    await assertFails(db.doc('users/member-uid').update({ role: 'admin' }));
    await assertFails(db.doc('users/member-uid').update({ status: 'rejected' }));
    await assertSucceeds(db.doc('users/member-uid').update({ name: 'Member Renamed' }));
  });

  test('members cannot read other member profiles', async () => {
    await assertSucceeds(memberDb().doc('users/member-uid').get());
    await assertFails(memberDb().doc('users/other-member-uid').get());
  });

  test('members cannot grant themselves an approved admin record', async () => {
    await assertFails(
      memberDb().doc('approved_admins/member@example.test').set({
        email: 'member@example.test',
        name: 'Member',
        status: 'approved',
      }),
    );
  });

  test('anonymous visitors cannot create approved admin records', async () => {
    await assertFails(
      anonDb().doc('approved_admins/intruder@example.test').set({
        email: 'intruder@example.test',
        name: 'Intruder',
        status: 'approved',
      }),
    );
  });

  test('members cannot read or write admin invitations', async () => {
    const db = memberDb();
    await assertFails(db.collection('admin_invitations').get());
    await assertFails(
      db.doc('admin_invitations/invite-2').set({
        email: 'member@example.test',
        token: 'b'.repeat(64),
        status: 'pending',
        created_at: new Date(),
      }),
    );
  });

  test('anonymous visitors cannot read admin invitations at all', async () => {
    await assertFails(anonDb().collection('admin_invitations').get());
    await assertFails(anonDb().doc('admin_invitations/invite-1').get());
  });

  test('approved admins still manage invitations', async () => {
    const db = adminDb();
    await assertSucceeds(db.collection('admin_invitations').get());
    await assertSucceeds(
      db.doc('admin_invitations/invite-3').set({
        email: 'another@example.test',
        token: 'c'.repeat(64),
        status: 'pending',
        created_at: new Date(),
      }),
    );
  });

  test('a new account cannot register itself as an admin', async () => {
    const fresh = testEnv
      .authenticatedContext('fresh-uid', { email: 'fresh@example.test' })
      .firestore();

    await assertFails(
      fresh.doc('users/fresh-uid').set({
        email: 'fresh@example.test',
        name: 'Fresh',
        role: 'admin',
        status: 'approved',
      }),
    );
    await assertSucceeds(
      fresh.doc('users/fresh-uid').set({
        email: 'fresh@example.test',
        name: 'Fresh',
        role: 'member',
        status: 'pending',
      }),
    );
  });

  test('a new account cannot create its own approved admin record', async () => {
    const fresh = testEnv
      .authenticatedContext('fresh-uid', { email: 'fresh@example.test' })
      .firestore();

    await assertSucceeds(
      fresh.doc('users/fresh-uid').set({
        email: 'fresh@example.test',
        name: 'Fresh',
        role: 'member',
        status: 'pending',
      }),
    );
    await assertFails(
      fresh.doc('approved_admins/fresh@example.test').set({
        email: 'fresh@example.test',
        name: 'Fresh',
        status: 'approved',
      }),
    );
  });
});

describe('unrelated flows keep working', () => {
  test('the public contact form can create submissions but not read them', async () => {
    const db = anonDb();

    await assertSucceeds(
      db.collection('contact_submissions').add({
        name: 'Public Sender',
        email: 'sender@example.test',
        subject: 'Hello',
        message: 'Message',
        status: 'new',
        created_at: new Date(),
      }),
    );
    await assertFails(db.collection('contact_submissions').get());
  });

  test('membership applications can be created and read by id, but not listed', async () => {
    const db = anonDb();

    await assertSucceeds(
      db.collection('membership_applications').add({
        name: 'Applicant',
        email: 'applicant2@example.test',
        phone: '+27000000000',
        business_type: 'Retail',
        status: 'pending',
        created_at: new Date(),
      }),
    );
    await assertSucceeds(db.doc('membership_applications/application-1').get());
    await assertFails(db.collection('membership_applications').get());
  });

  test('admins can read and process contact and membership submissions', async () => {
    const db = adminDb();

    await assertSucceeds(db.doc('contact_submissions/contact-1').get());
    await assertSucceeds(db.doc('contact_submissions/contact-1').update({ status: 'resolved' }));
    await assertSucceeds(db.doc('membership_applications/application-1').get());
    await assertSucceeds(
      db.doc('membership_applications/application-1').update({ status: 'approved' }),
    );
  });

  test('unmatched collections stay closed', async () => {
    await assertFails(adminDb().doc('unknown_collection/doc-1').get());
    await assertFails(anonDb().doc('unknown_collection/doc-1').set({ value: true }));
  });
});
