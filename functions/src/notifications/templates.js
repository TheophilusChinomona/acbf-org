'use strict';

/** Plain, escaped admin notification emails for the two public forms. */

const SAST = 'Africa/Johannesburg';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stamp(now) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: SAST,
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(now);
}

function render({ title, rows, now }) {
  const html = `<!doctype html>
<html><body style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:640px;margin:0 auto;padding:24px">
<h2 style="color:#7c5a10;margin:0 0 16px">${escapeHtml(title)}</h2>
<table style="width:100%;border-collapse:collapse">
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;width:160px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
  )
  .join('\n')}
</table>
<p style="color:#9ca3af;font-size:12px;margin-top:16px">Received ${escapeHtml(stamp(now))} (SAST) via acbf.org.za</p>
</body></html>`;
  const text = [title, '', ...rows.map(([label, value]) => `${label}: ${value}`), '', `Received ${stamp(now)} (SAST)`].join('\n');
  return { html, text };
}

function contactEmail(data, now = new Date()) {
  const { html, text } = render({
    title: 'New contact form submission',
    now,
    rows: [
      ['Name', data.name],
      ['Email', data.email],
      ['Subject', data.subject],
      ['Message', data.message],
    ],
  });
  return { subject: `New Contact Form: ${data.subject}`, html, text, replyTo: data.email };
}

function membershipEmail(data, now = new Date()) {
  const rows = [
    ['Name', data.name],
    ['Email', data.email],
    ['Phone', data.phone],
  ];
  if (data.business_name) rows.push(['Business name', data.business_name]);
  rows.push(['Business type', data.business_type]);
  if (data.message) rows.push(['Message', data.message]);
  const { html, text } = render({ title: 'New membership application', now, rows });
  return { subject: `New Membership Application: ${data.name}`, html, text, replyTo: data.email };
}

module.exports = { contactEmail, membershipEmail, escapeHtml };
