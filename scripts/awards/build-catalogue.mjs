#!/usr/bin/env node
/**
 * Build the voting catalogue snapshot straight from the nominee workbook, with no
 * Firestore access. The output is the file the API serves and votes against
 * (`/data/catalogue.json`).
 *
 *   node scripts/awards/build-catalogue.mjs "Awards Nominees 5.xlsx" catalogue.json --open
 *
 * `--open` marks voting open; without it the snapshot is closed. The closing time
 * is the confirmed competition deadline from the shared policy module.
 * Document shapes match what `import-nominees.mjs` writes to Firestore.
 */

import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  loadCategoryMap,
  normalizeNominees,
  readNomineeWorkbook,
  summarizeNormalization,
  formatDryRunReport,
} from './normalize-nominees.mjs';

const functionsRequire = createRequire(new URL('../../functions/package.json', import.meta.url));
const policy = functionsRequire('./src/awards/policy.js');

/**
 * Corrections applied on top of the workbook, keyed by original nominee ID
 * so each rebuild applies them to the same entries.
 */
const FIELD_EDITS = Object.freeze({
  // This is a different nominee. Keep votes for Rosheen on the original ID.
  'financial-services-south-africa-rosheen-ngorima-neeps-consulting-services': {
    id: 'financial-services-zimbabwe-vimbai-chinguwa-mountfin-finance',
    personName: 'Vimbai Chinguwa',
    businessName: 'Mountfin Finance',
    country: 'Zimbabwe',
  },
  'legal-and-compliance-services-award-australia-joseph-and-hildah-nyemba-mwm-mid-west-migration': {
    personName: 'Joseph Nyemba and Hildah Nyemba',
    businessName: 'Miracle Worker Migration Solutions Pty Ltd - trading as MW Migration Solutions',
    country: 'Australia',
  },
  'women-leadership-united-kingdom-prieska-chimhini-briska-healthcare-pbc-consulting-emelda-properties': {
    businessName: 'Brisca Healthcare Ltd, PBC Consulting, Emelda Properties',
  },
  'women-leadership-zimbabwe-memory-mugabe-mama-prenuer-women-in-mining': {
    businessName: 'Founder & President of MamaPreneurs Women Empowerment organization',
  },
  'sme-excellence-award-australia-diana-shumbayaonda-amabez-cleaning-services': {
    personName: 'Diana and Archbold Shumbayaonda',
    businessName: 'Amabez support services PVT LTD',
  },
  'healthcare-united-kingdom-martin-mangaba-potter-s-healthcare': {
    personName: 'Tinotenda Chikwature, Martin Mangaba and Nyasha Mangaba',
    businessName: 'Potters Health Care',
  },
  'professional-services-award-south-africa-reliable-accountants': {
    personName: 'Tendai Mapenda',
  },
  'information-technology-south-africa-dr-tunjera-digital-solutions-consultancy': {
    personName: 'Dr Nyarai Blessed Tunjera',
    businessName: 'ZoomIn Digital Solutions Consultancy',
  },
  'food-industry-south-africa-kundai-mbekapi-bakers-well-midlander': {
    personName: 'Kundai Mubekapi',
    businessName: 'Bakers well Midrand',
  },
  'tourism-events-south-africa-lilly-bee-events': {
    personName: 'Lilian Banda',
  },
  'healthcare-south-africa-panashe-furusa-panashe-furusa-physiotherapy': {
    personName: 'Panashe Furusa-Mukombachoto',
  },
  // Former bank affiliation removed (14 Nov).
  'financial-services-zimbabwe-dr-mandas-marikanda-zimbabwe-women-microfinance-bank': { businessName: '' },
  // Media and Entertainment: remove "Tapiwa", keep "Taps Media".
  'media-entertainment-south-africa-tapiwa-taps-media': { personName: '' },
  // Job Creation: remove "(Honorable)".
  'job-creation-and-skills-development-award-zimbabwe-zivai-mhetu-honorable-on-purpose-international-hotel': {
    personName: 'Zivai Mhetu',
  },
  // Construction: rename.
  'construction-and-infrastructure-award-south-africa-sibongile-zimani-mijeb-construction': {
    businessName: 'Mijeb Investment and Projects',
  },
  // Built Environment: rename.
  'built-environment-south-africa-heritage-chapuma-chad-designs': { businessName: 'Chad Arch Designs' },
});

/** Harold Mpondi sits alone in a duplicate Legal category; use the main one. */
const MOVES = Object.freeze([
  {
    id: 'legal-and-compliance-services-excellence-award-south-africa-harold-mpondi-hmb-verifications',
    toCategoryId: 'legal-and-compliance-services-award',
    newId: 'legal-and-compliance-services-award-south-africa-harold-mpondi-hmb-verifications',
    dropCategoryId: 'legal-and-compliance-services-excellence-award',
  },
]);

/** New nominees. Country was not given, so it stays blank rather than guessed. */
const ADDITIONS = Object.freeze([
  {
    categoryId: 'agri-business-excellence-award',
    personName: 'Theo Chiyoka',
    businessName: 'Greenlife Business Solutions',
  },
  {
    categoryId: 'logistics',
    personName: 'Joel Sithole',
    businessName: 'Suplog',
  },
]);

function slug(value) {
  return String(value).toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function applyEdits({ categories, nominees }) {
  const categoryIds = new Set(categories.map((category) => category.id));
  const byId = new Map(nominees.map((nominee) => [nominee.id, nominee]));
  const problems = [];

  for (const id of Object.keys(FIELD_EDITS)) {
    if (!byId.has(id)) problems.push(`edit target not found: ${id}`);
  }
  for (const move of MOVES) {
    if (!byId.has(move.id)) problems.push(`move target not found: ${move.id}`);
    if (!categoryIds.has(move.toCategoryId)) problems.push(`move category not found: ${move.toCategoryId}`);
  }
  for (const add of ADDITIONS) {
    if (!categoryIds.has(add.categoryId)) problems.push(`addition category not found: ${add.categoryId}`);
  }
  if (problems.length > 0) throw new Error(problems.join('\n'));

  let result = nominees.map((nominee) => {
    const edited = FIELD_EDITS[nominee.id] ? { ...nominee, ...FIELD_EDITS[nominee.id] } : nominee;
    const move = MOVES.find((m) => m.id === nominee.id);
    return move ? { ...edited, id: move.newId, categoryId: move.toCategoryId } : edited;
  });

  for (const add of ADDITIONS) {
    result.push({
      id: `${add.categoryId}-${slug(add.personName)}-${slug(add.businessName)}`,
      categoryId: add.categoryId,
      businessName: add.businessName,
      personName: add.personName,
      country: '',
    });
  }

  const dropped = new Set(MOVES.map((m) => m.dropCategoryId));
  const keptCategories = categories.filter((category) => !dropped.has(category.id));
  const ids = new Set();
  for (const nominee of result) {
    if (ids.has(nominee.id)) throw new Error(`duplicate nominee id: ${nominee.id}`);
    ids.add(nominee.id);
  }
  return { categories: keptCategories, nominees: result };
}

export function buildCatalogue({ categories, nominees, open }) {
  const edited = applyEdits({ categories, nominees });
  return {
    exportedAt: new Date().toISOString(),
    source: 'workbook',
    competition: { isOpen: Boolean(open), closesAt: new Date(policy.VOTING_DEADLINE_MS).toISOString() },
    categories: edited.categories.map((category) => ({ id: category.id, name: category.name })),
    nominees: edited.nominees.map((nominee) => ({
      id: nominee.id,
      categoryId: nominee.categoryId,
      businessName: nominee.businessName,
      personName: nominee.personName,
      country: nominee.country,
    })),
  };
}

function main(argv) {
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  const open = argv.includes('--open');
  const [workbook, out] = positional;
  if (!workbook || !out) {
    process.stderr.write('Usage: node scripts/awards/build-catalogue.mjs <workbook.xlsx> <out.json> [--open]\n');
    return 2;
  }

  const result = normalizeNominees(readNomineeWorkbook(workbook), loadCategoryMap());
  const summary = summarizeNormalization(result);
  process.stdout.write(`${formatDryRunReport(summary, { source: workbook, mode: 'catalogue build' })}\n\n`);
  if (summary.errorCount > 0) {
    process.stderr.write('Build blocked: resolve the reported issues first.\n');
    return 1;
  }

  const catalogue = buildCatalogue({ categories: result.categories, nominees: result.nominees, open });
  writeFileSync(out, JSON.stringify(catalogue));
  process.stdout.write(
    `Wrote ${out}: ${catalogue.categories.length} categories, ${catalogue.nominees.length} nominees, voting ${open ? 'OPEN' : 'closed'}, closes ${catalogue.competition.closesAt}\n`,
  );
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
