'use strict';

/**
 * Startup configuration tests.
 *
 * Credentials are supplied through `GOOGLE_APPLICATION_CREDENTIALS` (a read-only
 * mounted secret in Compose). A missing, unreadable, malformed or wrong-project
 * file must abort startup with a controlled error that never contains credential
 * contents.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { loadApiConfig, ApiConfigError } = require('../../src/api/config');

const PROJECT_ID = 'acbf-rsa-backend';
const ORIGIN = 'https://acbf.org.za';

function serviceAccount(overrides = {}) {
  return {
    type: 'service_account',
    project_id: PROJECT_ID,
    private_key_id: 'key-id',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIBVAIBADANBg\n-----END PRIVATE KEY-----\n',
    client_email: `voting-api@${PROJECT_ID}.iam.gserviceaccount.com`,
    client_id: '100000000000000000000',
    token_uri: 'https://oauth2.googleapis.com/token',
    ...overrides,
  };
}

function isConfigError(pattern) {
  return (error) => {
    assert.ok(error instanceof ApiConfigError, `expected ApiConfigError, got ${error?.name}`);
    assert.match(error.message, pattern);
    return true;
  };
}

describe('loadApiConfig', () => {
  let directory;
  let counter = 0;

  before(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'acbf-api-config-'));
  });

  after(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  function credentialFile(contents) {
    counter += 1;
    const file = path.join(directory, `credentials-${counter}.json`);
    fs.writeFileSync(file, typeof contents === 'string' ? contents : JSON.stringify(contents));
    return file;
  }

  function envFor(overrides = {}) {
    return {
      FIREBASE_PROJECT_ID: PROJECT_ID,
      PUBLIC_ORIGIN: ORIGIN,
      GOOGLE_APPLICATION_CREDENTIALS: credentialFile(serviceAccount()),
      ...overrides,
    };
  }

  it('loads the port, project, origin and parsed credentials', () => {
    const file = credentialFile(serviceAccount());
    const config = loadApiConfig({
      FIREBASE_PROJECT_ID: PROJECT_ID,
      PUBLIC_ORIGIN: `${ORIGIN}/`,
      GOOGLE_APPLICATION_CREDENTIALS: file,
      PORT: '3100',
    });

    assert.equal(config.port, 3100);
    assert.equal(config.projectId, PROJECT_ID);
    assert.equal(config.allowedOrigin, ORIGIN);
    assert.equal(config.credentialsPath, file);
    assert.equal(config.credentials.project_id, PROJECT_ID);
    assert.equal(config.credentials.client_email, serviceAccount().client_email);
  });

  it('defaults the port to 3001', () => {
    assert.equal(loadApiConfig(envFor()).port, 3001);
  });

  it('fails when the Firebase project id is missing', () => {
    assert.throws(
      () => loadApiConfig(envFor({ FIREBASE_PROJECT_ID: '' })),
      isConfigError(/FIREBASE_PROJECT_ID/),
    );
    assert.throws(() => loadApiConfig(envFor({ FIREBASE_PROJECT_ID: undefined })), isConfigError(/FIREBASE_PROJECT_ID/));
  });

  it('fails when the public origin is invalid', () => {
    for (const origin of ['', '*', 'acbf.org.za', 'https://acbf.org.za/app', 'https://acbf.org.za?x=1', 'ftp://acbf.org.za']) {
      assert.throws(
        () => loadApiConfig(envFor({ PUBLIC_ORIGIN: origin })),
        isConfigError(/PUBLIC_ORIGIN/),
        `${origin} must be rejected`,
      );
    }
  });

  it('fails when the port is invalid', () => {
    for (const port of ['0', 'not-a-port', '70000']) {
      assert.throws(
        () => loadApiConfig(envFor({ PORT: port })),
        isConfigError(/PORT/),
        `${port} must be rejected`,
      );
    }
  });

  it('fails safely when the credentials path is missing or unreadable', () => {
    assert.throws(
      () => loadApiConfig(envFor({ GOOGLE_APPLICATION_CREDENTIALS: '' })),
      isConfigError(/GOOGLE_APPLICATION_CREDENTIALS/),
    );
    assert.throws(
      () => loadApiConfig(envFor({ GOOGLE_APPLICATION_CREDENTIALS: path.join(directory, 'absent.json') })),
      isConfigError(/could not be read/),
    );
  });

  it('fails safely on malformed credentials without echoing their contents', () => {
    const secret = `not-json-${'sensitive'.repeat(20)}`;
    assert.throws(
      () =>
        loadApiConfig(
          envFor({ GOOGLE_APPLICATION_CREDENTIALS: credentialFile(secret) }),
        ),
      (error) => {
        assert.ok(error instanceof ApiConfigError);
        assert.match(error.message, /not valid JSON/);
        assert.ok(!error.message.includes(secret), 'credential contents must never appear in the error');
        return true;
      },
    );
  });

  it('rejects credentials that are not a service account', () => {
    assert.throws(
      () =>
        loadApiConfig(
          envFor({ GOOGLE_APPLICATION_CREDENTIALS: credentialFile(serviceAccount({ type: 'authorized_user' })) }),
        ),
      isConfigError(/service account/),
    );
  });

  it('rejects credentials for another project', () => {
    assert.throws(
      () =>
        loadApiConfig(
          envFor({
            GOOGLE_APPLICATION_CREDENTIALS: credentialFile(serviceAccount({ project_id: 'someone-else' })),
          }),
        ),
      isConfigError(/project/i),
    );
  });

  it('rejects credentials missing their key material', () => {
    for (const field of ['private_key', 'client_email']) {
      assert.throws(
        () =>
          loadApiConfig(
            envFor({
              GOOGLE_APPLICATION_CREDENTIALS: credentialFile(serviceAccount({ [field]: '' })),
            }),
          ),
        isConfigError(/incomplete/i),
        `${field} must be required`,
      );
    }
  });
});
