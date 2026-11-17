'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createApiServer } = require('../../src/api/app');
const { createResendMailer } = require('../../src/notifications/mailer');
const { createNotifications, LIMITS } = require('../../src/notifications');

const ORIGIN = 'https://acbf.org.za';
const quiet = { warn() {}, error() {}, info() {} };

function fakeResend({ status = 200 } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    return { ok: status >= 200 && status < 300, status };
  };
  return { calls, fetchImpl };
}

function makeMailer(options) {
  const resend = fakeResend(options);
  const mailer = createResendMailer({
    apiKey: 're_test_key',
    from: 'ACBF <noreply@example.org>',
    to: 'admin@example.org',
    fetchImpl: resend.fetchImpl,
    logger: quiet,
  });
  return { mailer, resend };
}

async function withServer(notifications, run) {
  const server = createApiServer({
    castVote: async () => ({}),
    lookupInvitation: async () => ({}),
    acceptInvitation: async () => ({}),
    readiness: async () => {},
    sendContact: notifications?.sendContact,
    sendMembership: notifications?.sendMembership,
    allowedOrigin: ORIGIN,
    logger: quiet,
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const post = (base, path, body, ip = '41.0.0.1') =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, 'x-acbf-client-ip': ip },
    body: JSON.stringify(body),
  });

const contact = { name: 'Ada Lovelace', email: 'ada@example.com', subject: 'Hello there', message: 'A message long enough.' };
const membership = { name: 'Ada Lovelace', email: 'ada@example.com', phone: '+27 82 000 0000', business_type: 'retail', business_name: '', message: '' };

test('contact: sends one email to the fixed admin address with reply-to set, and escapes input', async () => {
  const { mailer, resend } = makeMailer();
  await withServer(createNotifications({ mailer }), async (base) => {
    const res = await post(base, '/api/v1/notify/contact', { ...contact, message: '<script>alert(1)</script> hello' });
    assert.equal(res.status, 200);
    assert.deepEqual((await res.json()).data, { status: 'sent' });
  });
  assert.equal(resend.calls.length, 1);
  const { url, init, body } = resend.calls[0];
  assert.equal(url, 'https://api.resend.com/emails');
  assert.equal(init.headers.authorization, 'Bearer re_test_key');
  assert.deepEqual(body.to, ['admin@example.org']);
  assert.equal(body.reply_to, 'ada@example.com');
  assert.ok(body.html.includes('&lt;script&gt;'));
  assert.ok(!body.html.includes('<script>'));
  assert.equal(body.subject, 'New Contact Form: Hello there');
});

test('membership: sends the application, optional fields omitted when blank', async () => {
  const { mailer, resend } = makeMailer();
  await withServer(createNotifications({ mailer }), async (base) => {
    assert.equal((await post(base, '/api/v1/notify/membership', membership)).status, 200);
  });
  const { body } = resend.calls[0];
  assert.equal(body.subject, 'New Membership Application: Ada Lovelace');
  assert.ok(!body.text.includes('Business name'));
  assert.ok(body.text.includes('Business type: retail'));
});

test('validation: bad email, short fields, unexpected fields and a client-chosen recipient are refused', async () => {
  const { mailer, resend } = makeMailer();
  await withServer(createNotifications({ mailer }), async (base) => {
    const url = '/api/v1/notify/contact';
    assert.equal((await post(base, url, { ...contact, email: 'nope' })).status, 400);
    assert.equal((await post(base, url, { ...contact, subject: 'hi' })).status, 400);
    assert.equal((await post(base, url, { ...contact, message: 'short' })).status, 400);
    assert.equal((await post(base, url, { ...contact, to: 'victim@example.com' })).status, 400);
    assert.equal((await post(base, '/api/v1/notify/membership', { ...membership, phone: '123' })).status, 400);
  });
  assert.equal(resend.calls.length, 0);
});

test('rate limit: per-network ceiling returns 429 and other networks are unaffected', async () => {
  const { mailer, resend } = makeMailer();
  await withServer(createNotifications({ mailer }), async (base) => {
    for (let i = 0; i < LIMITS.perNetworkPerHour; i += 1) {
      assert.equal((await post(base, '/api/v1/notify/contact', contact, '41.5.5.5')).status, 200);
    }
    assert.equal((await post(base, '/api/v1/notify/contact', contact, '41.5.5.5')).status, 429);
    assert.equal((await post(base, '/api/v1/notify/contact', contact, '41.6.6.6')).status, 200);
  });
  assert.equal(resend.calls.length, LIMITS.perNetworkPerHour + 1);
});

test('provider failure is reported as unavailable and never leaks provider detail', async () => {
  const { mailer } = makeMailer({ status: 500 });
  await withServer(createNotifications({ mailer }), async (base) => {
    const res = await post(base, '/api/v1/notify/contact', contact);
    assert.equal(res.status, 503);
    const body = JSON.stringify(await res.json());
    assert.ok(body.includes('could not be sent'));
    assert.ok(!body.includes('re_test_key'));
  });
});

test('not configured: answers unavailable, and the routes are absent without a handler', async () => {
  await withServer(createNotifications({ mailer: null }), async (base) => {
    assert.equal((await post(base, '/api/v1/notify/contact', contact)).status, 503);
  });
  await withServer(undefined, async (base) => {
    assert.equal((await post(base, '/api/v1/notify/contact', contact)).status, 404);
  });
});

test('the old PHP paths are gone', async () => {
  await withServer(createNotifications({ mailer: null }), async (base) => {
    assert.equal((await post(base, '/api/contact-email.php', contact)).status, 404);
  });
});
