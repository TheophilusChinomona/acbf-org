'use strict';

/**
 * One-off migration, run inside the API container once Firestore answers:
 *
 *   docker exec <api-container> node src/awards/exportFromFirestore.js
 *
 * By default this ONLY imports votes already recorded in Firestore into the
 * SQLite store, keyed by their existing vote key, so re-running never double
 * counts. A vote made in both stores for the same browser and category counts
 * once (the SQLite record is kept).
 *
 * The catalogue file is left untouched, because it may carry edits that Firestore
 * does not have. Pass `--catalogue` to also overwrite it from Firestore.
 *
 * Reads Firestore only; nothing is written or deleted there. Credentials come
 * from the same environment variables the API uses and are never printed.
 */

const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');

const { loadApiConfig } = require('../api/config');
const policy = require('./policy');
const { createSqliteVoteStore, createCatalogueSource } = require('./sqliteStore');

function plain(value) {
  if (value && typeof value === 'object' && typeof value.toMillis === 'function') {
    return new Date(value.toMillis()).toISOString();
  }
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
  }
  return value;
}

async function main(env = process.env) {
  const config = loadApiConfig(env);
  const storePath = (env.AWARDS_STORE_PATH || '').trim();
  if (storePath === '') throw new Error('AWARDS_STORE_PATH is not set.');
  const cataloguePath =
    (env.AWARDS_CATALOGUE_PATH || '').trim() || path.join(path.dirname(storePath), 'catalogue.json');

  admin.initializeApp({
    credential: admin.credential.cert(config.credentials),
    projectId: config.projectId,
  });
  const db = admin.firestore();
  const root = db.collection(policy.COMPETITION_COLLECTION).doc(policy.VOTING_COMPETITION_ID);

  const [competition, categories, nominees, votes] = await Promise.all([
    root.get(),
    root.collection(policy.SUBCOLLECTIONS.categories).get(),
    root.collection(policy.SUBCOLLECTIONS.nominees).get(),
    root.collection(policy.SUBCOLLECTIONS.votes).get(),
  ]);

  if (!competition.exists) throw new Error('The competition document does not exist.');

  const snapshot = {
    exportedAt: new Date().toISOString(),
    competition: plain(competition.data()),
    categories: categories.docs.map((d) => ({ id: d.id, ...plain(d.data()) })),
    nominees: nominees.docs.map((d) => ({ id: d.id, ...plain(d.data()) })),
  };

  const writeCatalogue = process.argv.includes('--catalogue');
  if (writeCatalogue) {
    fs.mkdirSync(path.dirname(cataloguePath), { recursive: true });
    const tmp = `${cataloguePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(snapshot));
    fs.renameSync(tmp, cataloguePath);
  }

  const store = createSqliteVoteStore({
    path: storePath,
    catalogue: createCatalogueSource(cataloguePath),
  });
  const rows = votes.docs.map((d) => {
    const v = d.data();
    return {
      voteKey: d.id,
      competitionId: v.competitionId,
      categoryId: v.categoryId,
      nomineeId: v.nomineeId,
      name: v.name ?? null,
      email: v.email ?? null,
      createdAt: typeof v.createdAt?.toMillis === 'function' ? v.createdAt.toMillis() : Date.now(),
    };
  });
  const result = store.importVotes(rows);
  store.close();

  console.log(
    writeCatalogue
      ? `catalogue: ${snapshot.categories.length} categories, ${snapshot.nominees.length} nominees -> ${cataloguePath}`
      : 'catalogue: left unchanged (pass --catalogue to overwrite it from Firestore)',
  );
  console.log(`votes: ${result.imported} imported, ${result.skipped} already present`);
}

if (require.main === module) {
  main().then(
    () => process.exit(0),
    (error) => {
      console.error('export failed:', error && error.code ? `code ${error.code}` : '', String(error && error.message).slice(0, 300));
      process.exit(1);
    },
  );
}

module.exports = { main };
