#!/usr/bin/env node
/**
 * Import the official ACBF award nominees into Firestore.
 *
 * Dry run by default: nothing is written unless `--apply` is passed explicitly.
 * The importer only upserts the public catalogue (categories + nominees). It never
 * touches votes, totals, or rate limits, and it never resets the competition's
 * open/closed state — so re-running it can never reset results or reopen voting.
 *
 * Auth: Firebase Admin SDK from the functions package using application default
 * credentials (`GOOGLE_APPLICATION_CREDENTIALS` or an authenticated gcloud user).
 *
 * Usage:
 *   node scripts/awards/import-nominees.mjs "/path/Awards Nominees 5.xlsx"
 *   node scripts/awards/import-nominees.mjs "/path/Awards Nominees 5.xlsx" --apply --project acbf-rsa-backend
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  loadCategoryMap,
  normalizeNominees,
  readNomineeWorkbook,
  summarizeNormalization,
  formatDryRunReport,
} from './normalize-nominees.mjs';

const functionsRequire = createRequire(new URL('../../functions/package.json', import.meta.url));
// Shared deadline so the importer and the callable cannot drift apart.
const policy = functionsRequire('./src/awards/policy.js');

export const COMPETITION_ID = policy.VOTING_COMPETITION_ID;
export const COMPETITION_CLOSES_AT_MS = policy.VOTING_DEADLINE_MS;

export const COLLECTION_ROOT = 'award_competitions';

function catalogueRefs(db, competitionId) {
  const root = db.collection(COLLECTION_ROOT).doc(competitionId);
  return {
    competition: root,
    categories: root.collection('categories'),
    nominees: root.collection('nominees'),
    votes: root.collection('votes'),
  };
}

/**
 * Compare the planned catalogue with what is already stored.
 *
 * Identity is the nominee document id. Once votes exist, the set of nominee ids
 * and every nominee's category are frozen: changing either would silently
 * reinterpret votes that were already cast.
 *
 * @param {object} params
 * @param {Array<object>} params.nominees - Planned nominees.
 * @param {Array<object>} params.existingNominees - Nominees already stored.
 * @param {boolean} params.hasVotes - Whether any accepted vote exists.
 * @returns {{ errors: string[], added: string[], removed: string[], changedCategory: string[] }}
 */
export function evaluateExistingCatalogue({ nominees, existingNominees, hasVotes }) {
  const planned = new Map(nominees.map((nominee) => [nominee.id, nominee]));
  const existing = new Map(existingNominees.map((nominee) => [nominee.id, nominee]));

  const added = [...planned.keys()].filter((id) => !existing.has(id));
  const removed = [...existing.keys()].filter((id) => !planned.has(id));
  const changedCategory = [...planned.keys()].filter(
    (id) => existing.has(id) && existing.get(id).categoryId !== planned.get(id).categoryId,
  );

  const errors = [];
  if (hasVotes) {
    if (added.length > 0) {
      errors.push(
        `Refusing to add ${added.length} nominee(s) after votes exist: ${added.slice(0, 5).join(', ')}` +
          (added.length > 5 ? ', …' : ''),
      );
    }
    if (removed.length > 0) {
      errors.push(
        `Refusing to remove ${removed.length} nominee(s) after votes exist: ${removed.slice(0, 5).join(', ')}` +
          (removed.length > 5 ? ', …' : ''),
      );
    }
    if (changedCategory.length > 0) {
      errors.push(
        `Refusing to move nominee(s) to another category after votes exist: ${changedCategory
          .slice(0, 5)
          .join(', ')}${changedCategory.length > 5 ? ', …' : ''}`,
      );
    }
  }

  return { errors, added, removed, changedCategory };
}

/**
 * Write the catalogue: categories, nominees, and (only when absent) the competition.
 *
 * @param {object} params
 * @param {import('firebase-admin/firestore').Firestore} params.db
 * @param {object} params.admin - The firebase-admin module (for Timestamp/FieldValue).
 * @param {string} params.competitionId
 * @param {Array<object>} params.categories
 * @param {Array<object>} params.nominees
 * @returns {Promise<{ createdCompetition: boolean, writtenCategories: number, writtenNominees: number }>}
 */
export async function writeCatalogue({ db, admin, competitionId, categories, nominees }) {
  const refs = catalogueRefs(db, competitionId);

  let createdCompetition = false;
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(refs.competition);
    if (!snapshot.exists) {
      createdCompetition = true;
      transaction.set(refs.competition, {
        isOpen: false,
        closesAt: admin.firestore.Timestamp.fromMillis(COMPETITION_CLOSES_AT_MS),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    // Existing competition documents are never rewritten: the open flag and the
    // closing time stay exactly as the committee configured them.
  });

  const batch = db.batch();
  for (const category of categories) {
    batch.set(refs.categories.doc(category.id), { id: category.id, name: category.name });
  }
  for (const nominee of nominees) {
    batch.set(refs.nominees.doc(nominee.id), {
      id: nominee.id,
      categoryId: nominee.categoryId,
      businessName: nominee.businessName,
      personName: nominee.personName,
      country: nominee.country,
    });
  }
  await batch.commit();

  return {
    createdCompetition,
    writtenCategories: categories.length,
    writtenNominees: nominees.length,
  };
}

async function readExistingCatalogue(db, competitionId) {
  const refs = catalogueRefs(db, competitionId);
  const [nomineeSnapshot, voteSnapshot] = await Promise.all([
    refs.nominees.get(),
    refs.votes.limit(1).get(),
  ]);

  return {
    existingNominees: nomineeSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    hasVotes: !voteSnapshot.empty,
  };
}

function parseArgs(argv) {
  const args = { apply: false, project: null, path: null };
  const rest = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--apply') {
      args.apply = true;
    } else if (arg === '--project') {
      args.project = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      rest.push(arg);
    }
  }
  args.path = rest[0] ?? null;
  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);

  if (args.help || !args.path) {
    process.stdout.write(
      [
        'Usage: node scripts/awards/import-nominees.mjs <workbook.xlsx> [--apply] [--project <id>]',
        '',
        'Without --apply this prints a dry-run report and writes nothing.',
        'The workbook must stay outside the repository and outside public/.',
        '',
      ].join('\n'),
    );
    return args.help ? 0 : 2;
  }

  const categoryMap = loadCategoryMap();
  const rows = readNomineeWorkbook(args.path);
  const result = normalizeNominees(rows, categoryMap);
  const summary = summarizeNormalization(result);

  process.stdout.write(
    `${formatDryRunReport(summary, {
      source: args.path,
      mode: args.apply ? 'apply' : 'dry run',
    })}\n\n`,
  );

  if (summary.errorCount > 0) {
    process.stderr.write('Import blocked: resolve the reported issues first.\n');
    return 1;
  }

  if (!args.apply) {
    process.stdout.write('Dry run only. Re-run with --apply to write the catalogue.\n');
    return 0;
  }

  const projectId =
    args.project ?? process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? null;
  if (!projectId) {
    process.stderr.write(
      'Import blocked: pass --project <firebase-project-id> (or set GCLOUD_PROJECT).\n',
    );
    return 1;
  }

  const admin = functionsRequire('firebase-admin');
  if (!admin.apps.length) admin.initializeApp({ projectId });
  const db = admin.firestore();

  const { existingNominees, hasVotes } = await readExistingCatalogue(db, COMPETITION_ID);
  const comparison = evaluateExistingCatalogue({
    nominees: result.nominees,
    existingNominees,
    hasVotes,
  });

  if (comparison.errors.length > 0) {
    for (const error of comparison.errors) process.stderr.write(`Import blocked: ${error}\n`);
    return 1;
  }

  const written = await writeCatalogue({
    db,
    admin,
    competitionId: COMPETITION_ID,
    categories: result.categories,
    nominees: result.nominees,
  });

  process.stdout.write(
    [
      'Catalogue imported.',
      `  competition ${COMPETITION_ID}: ${written.createdCompetition ? 'created (closed)' : 'left unchanged'}`,
      `  categories written: ${written.writtenCategories}`,
      `  nominees written:   ${written.writtenNominees}`,
      `  existing votes:     ${hasVotes ? 'yes — identity and categories were checked' : 'none'}`,
      '',
    ].join('\n'),
  );
  return 0;
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`));

if (invokedDirectly) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      process.stderr.write(`Import failed: ${error?.message ?? error}\n`);
      process.exitCode = 1;
    });
}
