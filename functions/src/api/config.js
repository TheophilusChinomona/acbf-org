'use strict';

/**
 * Runtime configuration for the internal voting API.
 *
 * All values arrive from the container environment; credentials use a server-only
 * base64 JSON variable or a read-only GOOGLE_APPLICATION_CREDENTIALS file. Every check
 * fails fast with `ApiConfigError`, which mentions only the offending variable or
 * file path — never the file's contents — so a misconfiguration cannot leak
 * secrets into logs.
 */

const fs = require('node:fs');

const DEFAULT_PORT = 3001;
const MIN_PORT = 1;
const MAX_PORT = 65535;

const PROJECT_ID_PATTERN = /^[a-z][a-z0-9-]{3,62}$/;

class ApiConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ApiConfigError';
    this.code = 'invalid-configuration';
  }
}

function readString(env, name) {
  const value = env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function parsePort(raw) {
  if (raw === '') return DEFAULT_PORT;
  if (!/^\d+$/.test(raw)) {
    throw new ApiConfigError(`PORT must be a whole number, received "${raw}".`);
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new ApiConfigError(`PORT must be between ${MIN_PORT} and ${MAX_PORT}.`);
  }
  return port;
}

/**
 * Accept only a bare browser origin: no path, query, fragment or credentials. A
 * wildcard is rejected because the API requires one exact value.
 *
 * @param {string} raw
 * @returns {string}
 */
function parseOrigin(raw) {
  if (raw === '') {
    throw new ApiConfigError('PUBLIC_ORIGIN is required, for example https://acbf.org.za.');
  }
  if (raw === '*') {
    throw new ApiConfigError('PUBLIC_ORIGIN must be one exact origin; a wildcard is not allowed.');
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new ApiConfigError(
      'PUBLIC_ORIGIN must be an absolute origin, for example https://acbf.org.za.',
    );
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new ApiConfigError('PUBLIC_ORIGIN must use http or https.');
  }
  if (
    url.pathname !== '/' ||
    url.search !== '' ||
    url.hash !== '' ||
    url.username !== '' ||
    url.password !== ''
  ) {
    throw new ApiConfigError(
      'PUBLIC_ORIGIN must contain only the scheme and host, for example https://acbf.org.za.',
    );
  }

  return url.origin;
}

function parseProjectId(raw) {
  if (raw === '') {
    throw new ApiConfigError('FIREBASE_PROJECT_ID is required.');
  }
  if (!PROJECT_ID_PATTERN.test(raw)) {
    throw new ApiConfigError('FIREBASE_PROJECT_ID is not a valid Firebase project id.');
  }
  return raw;
}

function readCredentials(credentialsPath, encodedCredentials = '') {
  if (credentialsPath && encodedCredentials) {
    throw new ApiConfigError('Provide only one credential source: GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_ADMIN_CREDENTIALS_BASE64.');
  }
  let raw;
  if (encodedCredentials) {
    // Base64 is a single-line transport format, not encryption. Keep this value
    // exclusively in the server runtime environment, never frontend build args.
    if (encodedCredentials.length > 131072 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(encodedCredentials) ||
        Buffer.from(encodedCredentials, 'base64').toString('base64') !== encodedCredentials) {
      throw new ApiConfigError('FIREBASE_ADMIN_CREDENTIALS_BASE64 must be valid base64-encoded service-account JSON.');
    }
    raw = Buffer.from(encodedCredentials, 'base64').toString('utf8');
  } else {
    if (credentialsPath === '') {
      throw new ApiConfigError('GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_ADMIN_CREDENTIALS_BASE64 is required.');
    }
    try {
      raw = fs.readFileSync(credentialsPath, 'utf8');
    } catch {
      throw new ApiConfigError('The Firebase credentials file could not be read. Mount it read-only and check its permissions.');
    }
  }

  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch {
    throw new ApiConfigError('The Firebase credentials file is not valid JSON.');
  }

  if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) {
    throw new ApiConfigError('The Firebase credentials file is not a service account key.');
  }
  if (credentials.type !== 'service_account') {
    throw new ApiConfigError(
      'The Firebase credentials file must be a service account key (type "service_account").',
    );
  }
  if (
    typeof credentials.project_id !== 'string' ||
    credentials.project_id.trim() === '' ||
    typeof credentials.client_email !== 'string' ||
    credentials.client_email.trim() === '' ||
    typeof credentials.private_key !== 'string' ||
    credentials.private_key.trim() === ''
  ) {
    throw new ApiConfigError(
      'The Firebase credentials file is incomplete: project_id, client_email and private_key are required.',
    );
  }

  return credentials;
}

/**
 * @param {Record<string, string|undefined>} [env]
 * @returns {{port: number, projectId: string, allowedOrigin: string, credentialsPath: string, credentials: object}}
 */
function loadApiConfig(env = process.env) {
  const port = parsePort(readString(env, 'PORT'));
  const projectId = parseProjectId(readString(env, 'FIREBASE_PROJECT_ID'));
  const allowedOrigin = parseOrigin(readString(env, 'PUBLIC_ORIGIN'));
  const credentialsPath = readString(env, 'GOOGLE_APPLICATION_CREDENTIALS');
  const credentials = readCredentials(credentialsPath, readString(env, 'FIREBASE_ADMIN_CREDENTIALS_BASE64'));

  if (credentials.project_id.trim() !== projectId) {
    throw new ApiConfigError(
      'The Firebase credentials file is for a different project than FIREBASE_PROJECT_ID.',
    );
  }

  return { port, projectId, allowedOrigin, credentialsPath, credentials };
}

module.exports = {
  DEFAULT_PORT,
  ApiConfigError,
  loadApiConfig,
  parseOrigin,
  parsePort,
  parseProjectId,
};
