'use strict';

/**
 * Internal API entry point (Compose service `api`).
 *
 * Startup order:
 *   1. read and validate the environment (`config.js`) — a missing, unreadable,
 *      malformed or wrong-project service-account file aborts startup;
 *   2. initialise the Admin SDK with those credentials only (never a CLI login
 *      token) and confirm the resolved project matches;
 *   3. build the transport-independent domain services and the HTTP server;
 *   4. listen on `0.0.0.0:3001`, which Compose keeps private behind nginx.
 *
 * Only the port and the allowed origin are logged. Credential contents, request
 * bodies, passwords and browser tokens are never logged.
 */

const admin = require('firebase-admin');

const { loadApiConfig, ApiConfigError } = require('./config');
const { createApiServer, withTimeout } = require('./app');
const { createCastAwardVote } = require('../awards/voting');
const { createGetAdminInvitation, createAcceptAdminInvitation } = require('../admin/invitations');
const policy = require('../awards/policy');
const { DomainError, ERROR_CODES } = require('../errors');
const { createResendMailer } = require('../notifications/mailer');
const { createNotifications } = require('../notifications');
const { createSqliteVoteStore, createCatalogueSource } = require('../awards/sqliteStore');

const READINESS_TIMEOUT_MS = 3_000;
const SHUTDOWN_TIMEOUT_MS = 10_000;
const HEALTHCHECK_PATH = '/api/v1/health';

/**
 * Readiness must prove the credentials actually work, so it performs one
 * harmless read. A doc read on the competition root returns a snapshot whether or
 * not the document exists; it never writes and never reveals data.
 *
 * @param {{db: import('firebase-admin/firestore').Firestore, projectId: string, timeoutMs?: number}} options
 * @returns {() => Promise<void>}
 */
function createReadinessProbe({ db, projectId, timeoutMs = READINESS_TIMEOUT_MS }) {
  if (!db) throw new TypeError('createReadinessProbe requires a Firestore instance');
  if (typeof projectId !== 'string' || projectId === '') {
    throw new TypeError('createReadinessProbe requires a project id');
  }

  return async function readiness() {
    const reference = db.doc(`${policy.COMPETITION_COLLECTION}/${policy.VOTING_COMPETITION_ID}`);
    await withTimeout(reference.get(), timeoutMs);
  };
}

function fail(error, logger) {
  // Only our own configuration errors carry reviewed text. Anything else is
  // reported by shape so a library message cannot leak credential material.
  if (error instanceof ApiConfigError) {
    logger.error('api: startup failed:', error.message);
  } else {
    logger.error('api: startup failed', {
      name: error && error.name,
      code: error && error.code,
    });
  }
  process.exitCode = 1;
}

function initialiseAdmin(config) {
  if (admin.apps.length > 0) {
    throw new Error('The Admin SDK is already initialised.');
  }

  // `loadApiConfig` already proved `credentials.project_id === config.projectId`
  // and validated the key material; trusting `app().options.projectId` here would
  // only assert the value just passed in.
  admin.initializeApp({
    credential: admin.credential.cert(config.credentials),
    projectId: config.projectId,
  });
}

/**
 * Start the API. Exported so tests can drive startup failures without spawning a
 * process.
 *
 * @param {{env?: Record<string, string|undefined>, logger?: Console}} [options]
 * @returns {Promise<{server: import('node:http').Server|null}>}
 */
async function main({ env = process.env, logger = console } = {}) {
  let config;
  try {
    config = loadApiConfig(env);
    initialiseAdmin(config);
  } catch (error) {
    fail(error, logger);
    return { server: null };
  }

  const db = admin.firestore();
  const auth = admin.auth();

  // Votes live in SQLite when AWARDS_STORE_PATH is set, so voting never depends
  // on Firestore quota. The catalogue comes from an exported JSON snapshot.
  let castVote = createCastAwardVote({ db, now: Date.now });
  let readiness = createReadinessProbe({ db, projectId: config.projectId });
  let readCatalogue;
  let readAdminResults;
  let readAdminVotes;
  const storePath = (env.AWARDS_STORE_PATH || '').trim();
  if (storePath !== '') {
    const cataloguePath =
      (env.AWARDS_CATALOGUE_PATH || '').trim() || `${storePath.replace(/[^/]*$/, '')}catalogue.json`;
    try {
      const catalogue = createCatalogueSource(cataloguePath);
      const store = createSqliteVoteStore({ path: storePath, catalogue });
      castVote = store.castAwardVote;
      readiness = async () => store.readiness();
      // Admins are identified by a verified Firebase sign-in token and an email
      // allow-list, so this works even when Firestore is unavailable.
      const adminEmails = new Set(
        (env.AWARDS_ADMIN_EMAILS || '')
          .split(',')
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      );
      const authoriseAdmin = async (idToken) => {
        let decoded;
        try {
          decoded = await auth.verifyIdToken(idToken);
        } catch {
          throw new DomainError(ERROR_CODES.UNAUTHENTICATED, 'Your session has expired. Sign in again.');
        }
        const email = String(decoded.email || '').trim().toLowerCase();
        if (email === '' || !adminEmails.has(email)) {
          throw new DomainError(
            ERROR_CODES.PERMISSION_DENIED,
            'Your account is not authorised to view award results.',
          );
        }
      };
      readAdminResults = async (idToken) => {
        await authoriseAdmin(idToken);
        return store.results();
      };
      readAdminVotes = async (idToken) => {
        await authoriseAdmin(idToken);
        return { ...store.results(), votes: store.votes() };
      };
      readCatalogue = () => {
        const loaded = catalogue.get();
        if (!loaded) throw new Error('catalogue snapshot is not available');
        return loaded.snapshot;
      };
    } catch (error) {
      fail(error, logger);
      return { server: null };
    }
  }

  // Admin email notifications for the contact and membership forms (Resend).
  // Without RESEND_API_KEY the endpoints answer "unavailable" instead of failing silently.
  let mailer = null;
  const resendKey = (env.RESEND_API_KEY || '').trim();
  if (resendKey !== '') {
    try {
      mailer = createResendMailer({
        apiKey: resendKey,
        from: (env.RESEND_FROM || '').trim(),
        to: (env.NOTIFY_TO || '').trim(),
        logger,
      });
    } catch {
      logger.warn('api: email notifications disabled: set RESEND_FROM and NOTIFY_TO');
    }
  } else {
    logger.warn('api: email notifications disabled: RESEND_API_KEY is not set');
  }
  const notifications = createNotifications({ mailer });

  const server = createApiServer({
    sendContact: notifications.sendContact,
    sendMembership: notifications.sendMembership,
    castVote,
    readCatalogue,
    readAdminResults,
    readAdminVotes,
    lookupInvitation: createGetAdminInvitation({ db, now: Date.now }),
    acceptInvitation: createAcceptAdminInvitation({ db, auth, now: Date.now }),
    readiness,
    allowedOrigin: config.allowedOrigin,
    logger,
  });

  server.on('error', (error) => {
    logger.error('api: server error', { code: error && error.code });
    process.exitCode = 1;
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, '0.0.0.0', resolve);
  }).catch((error) => {
    logger.error('api: could not listen', { code: error && error.code });
    process.exitCode = 1;
    return null;
  });

  if (process.exitCode === 1) {
    return { server: null };
  }

  logger.info(
    `api: listening on 0.0.0.0:${config.port} (health ${HEALTHCHECK_PATH}, origin ${config.allowedOrigin})`,
  );

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`api: ${signal} received, draining connections`);

    const timer = setTimeout(() => {
      logger.error('api: shutdown timed out, exiting');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    if (typeof timer.unref === 'function') timer.unref();

    server.close(() => {
      clearTimeout(timer);
      process.exit(0);
    });
    server.closeIdleConnections?.();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return { server };
}

if (require.main === module) {
  main().catch((error) => {
    console.error('api: unexpected startup failure', { name: error && error.name });
    process.exit(1);
  });
}

module.exports = {
  HEALTHCHECK_PATH,
  READINESS_TIMEOUT_MS,
  createReadinessProbe,
  main,
};
