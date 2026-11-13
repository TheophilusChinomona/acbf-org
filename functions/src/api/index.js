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

function fail(error) {
  // Only our own configuration errors carry reviewed text. Anything else is
  // reported by shape so a library message cannot leak credential material.
  if (error instanceof ApiConfigError) {
    console.error('api: startup failed:', error.message);
  } else {
    console.error('api: startup failed', {
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

  admin.initializeApp({
    credential: admin.credential.cert(config.credentials),
    projectId: config.projectId,
  });

  const resolvedProjectId = admin.app().options.projectId;
  if (resolvedProjectId !== config.projectId) {
    throw new ApiConfigError(
      'The Admin SDK resolved a different project than FIREBASE_PROJECT_ID.',
    );
  }
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
    fail(error);
    return { server: null };
  }

  const db = admin.firestore();
  const auth = admin.auth();

  const server = createApiServer({
    castVote: createCastAwardVote({ db, now: Date.now }),
    lookupInvitation: createGetAdminInvitation({ db, now: Date.now }),
    acceptInvitation: createAcceptAdminInvitation({ db, auth, now: Date.now }),
    readiness: createReadinessProbe({ db, projectId: config.projectId }),
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
