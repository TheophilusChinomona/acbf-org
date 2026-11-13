/**
 * Nominee catalogue normalization for the ACBF awards ballot.
 *
 * Source data is the privately supplied "Awards Nominees 5.xlsx" workbook. It is
 * never committed and never bundled with the site; only the public display fields
 * (category, business name, person name, country) leave this module. Contact
 * columns in the workbook are ignored and cannot leak into a nominee record.
 *
 * The output of this module is deterministic: normalizing the same rows with the
 * same category map yields the same nominee IDs, so re-running the import can
 * never duplicate nominees or reset vote totals.
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);

/** Columns that are intentionally never copied to public nominee records. */
export const EXCLUDED_SOURCE_FIELDS = Object.freeze([
  'contact number',
  'contact',
  'phone',
  'telephone',
  'mobile',
  'cell',
  'email',
  'e-mail',
  'notes',
  'note',
  'comments',
  'nominator',
  'website',
]);

const COLUMN_ALIASES = Object.freeze({
  category: ['category', 'award category', 'award', 'award name', 'category name'],
  businessName: [
    'business name',
    'business',
    'company name',
    'company',
    'organisation',
    'organization',
    'business/organisation',
  ],
  personName: ['business person', 'person name', 'person', 'nominee name', 'nominee', 'name', 'individual', 'full name'],
  country: ['country', 'nation', 'country of origin'],
});

const ISSUE_CODES = Object.freeze({
  UNMAPPED_CATEGORY: 'unmapped-category',
  AMBIGUOUS_CATEGORY: 'ambiguous-category',
  MISSING_CATEGORY: 'missing-category',
  MISSING_NOMINEE_NAME: 'missing-nominee-name',
  MISSING_COUNTRY: 'missing-country',
  DUPLICATE_NOMINEE_ID: 'duplicate-nominee-id',
  NO_ROWS: 'no-nominee-rows',
});

const SEVERITY = Object.freeze({ ERROR: 'error', WARNING: 'warning' });

/**
 * Normalize a raw cell value into a comparison key: diacritics stripped,
 * lowercased, ampersands spelled out, punctuation removed, whitespace collapsed.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeKey(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Build a URL-safe, stable slug from arbitrary text.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function slugify(value) {
  return normalizeKey(value).replace(/\s+/g, '-');
}

function trimText(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function resolveColumns(rows) {
  const keys = new Set();
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    for (const key of Object.keys(row)) keys.add(key);
  }

  const normalizedKeys = [...keys].map((key) => ({ raw: key, normalized: normalizeKey(key) }));
  const resolved = {};
  const missing = [];

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const match = normalizedKeys.find((candidate) => aliases.includes(candidate.normalized));
    if (match) {
      resolved[field] = match.raw;
    } else if (field === 'category' || field === 'country') {
      missing.push(field);
    } else {
      resolved[field] = null;
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Nominee sheet is missing required column(s): ${missing.join(', ')}. ` +
        `Found columns: ${[...keys].join(', ') || '(none)'}`,
    );
  }

  return resolved;
}

/**
 * Compile the reviewed category map into lookup tables.
 *
 * @param {object} categoryMap - Parsed `category-map.json`.
 * @returns {{ categoriesById: Map<string, object>, byAlias: Map<string, string>, ambiguous: Map<string, object> }}
 */
export function buildCategoryIndex(categoryMap) {
  const categoriesById = new Map();
  const byAlias = new Map();
  const ambiguous = new Map();

  for (const category of categoryMap?.categories ?? []) {
    const id = slugify(category.id);
    if (!id) throw new Error('Category map contains a category without an id');
    if (categoriesById.has(id)) throw new Error(`Category map contains duplicate id "${id}"`);

    const entry = { id, name: trimText(category.name) || trimText(category.id) };
    categoriesById.set(id, entry);

    const aliases = new Set([entry.name, ...(category.aliases ?? [])]);
    for (const alias of aliases) {
      const key = normalizeKey(alias);
      if (!key) continue;
      const existing = byAlias.get(key);
      if (existing && existing !== id) {
        throw new Error(
          `Category alias "${alias}" maps to both "${existing}" and "${id}"; ` +
            'list the ambiguous label under "ambiguousAliases" instead.',
        );
      }
      byAlias.set(key, id);
    }
  }

  for (const entry of categoryMap?.ambiguousAliases ?? []) {
    const key = normalizeKey(entry.alias);
    if (!key) continue;
    ambiguous.set(key, { alias: trimText(entry.alias), reason: trimText(entry.reason) });
  }

  return { categoriesById, byAlias, ambiguous };
}

function buildNomineeId({ categoryId, country, personName, businessName }) {
  return [
    slugify(categoryId),
    slugify(country),
    slugify(personName),
    slugify(businessName),
  ]
    .filter(Boolean)
    .join('-');
}

/**
 * Normalize raw nominee rows into a public catalogue.
 *
 * Rows that cannot become a valid nominee are reported as error issues and are
 * left out of `nominees`. Unmapped categories keep their own provisional ID
 * (semantically distinct labels are never merged) and are reported so the
 * category map can be reviewed before the importer is allowed to apply.
 *
 * @param {Array<Record<string, unknown>>} rows - Rows as returned by the sheet reader.
 * @param {object} categoryMap - Parsed `category-map.json`.
 * @returns {{ nominees: Array<object>, categories: Array<object>, issues: Array<object> }}
 */
export function normalizeNominees(rows, categoryMap) {
  if (!categoryMap || typeof categoryMap !== 'object') {
    throw new TypeError('normalizeNominees requires a category map object');
  }

  const sheetRows = Array.isArray(rows) ? rows : [];
  const issues = [];
  const nominees = [];
  const nomineesById = new Map();
  const categoriesById = new Map();
  const seenRowsByCategory = new Map();

  if (sheetRows.length === 0) {
    issues.push({
      code: ISSUE_CODES.NO_ROWS,
      severity: SEVERITY.ERROR,
      message: 'The nominee sheet contains no data rows.',
    });
    return { nominees, categories: [], issues };
  }

  const columns = resolveColumns(sheetRows);
  const { categoriesById: mappedCategories, byAlias, ambiguous } = buildCategoryIndex(categoryMap);

  let carriedCountry = '';

  sheetRows.forEach((row, index) => {
    const sheetRow = index + 2; // header row is row 1 in the workbook
    const rawCategory = trimText(row?.[columns.category]);
    const rawBusiness = columns.businessName ? trimText(row?.[columns.businessName]) : '';
    const rawPerson = columns.personName ? trimText(row?.[columns.personName]) : '';
    const rawCountry = trimText(row?.[columns.country]);

    // Blank rows are formatting noise (section breaks, trailing rows).
    if (!rawCategory && !rawBusiness && !rawPerson && !rawCountry) return;

    const country = rawCountry || carriedCountry;
    if (rawCountry) carriedCountry = rawCountry;

    if (!rawCategory) {
      issues.push({
        code: ISSUE_CODES.MISSING_CATEGORY,
        severity: SEVERITY.ERROR,
        row: sheetRow,
        message: `Row ${sheetRow} has a nominee but no category.`,
      });
      return;
    }

    const categoryKey = normalizeKey(rawCategory);
    const ambiguousEntry = ambiguous.get(categoryKey);
    let categoryId;
    let categoryName;

    if (ambiguousEntry) {
      categoryId = `review-${slugify(ambiguousEntry.alias)}`;
      categoryName = ambiguousEntry.alias;
      issues.push({
        code: ISSUE_CODES.AMBIGUOUS_CATEGORY,
        severity: SEVERITY.ERROR,
        row: sheetRow,
        category: rawCategory,
        message:
          `Category "${rawCategory}" is ambiguous` +
          (ambiguousEntry.reason ? `: ${ambiguousEntry.reason}` : '.') +
          ' Resolve it in scripts/awards/category-map.json before importing.',
      });
    } else {
      const mappedId = byAlias.get(categoryKey);
      if (mappedId) {
        categoryId = mappedId;
        categoryName = mappedCategories.get(mappedId).name;
      } else {
        const provisionalId = slugify(rawCategory) || 'uncategorized';
        categoryId = provisionalId;
        categoryName = rawCategory;
        issues.push({
          code: ISSUE_CODES.UNMAPPED_CATEGORY,
          severity: SEVERITY.ERROR,
          row: sheetRow,
          category: rawCategory,
          message:
            `Category "${rawCategory}" is not in scripts/awards/category-map.json. ` +
            'Add it (or map it to an existing category) and review the change before importing.',
        });
      }
    }

    const personName = rawPerson || null;
    const businessName = rawBusiness || null;

    if (!personName && !businessName) {
      issues.push({
        code: ISSUE_CODES.MISSING_NOMINEE_NAME,
        severity: SEVERITY.ERROR,
        row: sheetRow,
        category: rawCategory,
        message: `Row ${sheetRow} has neither a person name nor a business name.`,
      });
      return;
    }

    if (!country) {
      issues.push({
        code: ISSUE_CODES.MISSING_COUNTRY,
        severity: SEVERITY.ERROR,
        row: sheetRow,
        category: rawCategory,
        message: `Row ${sheetRow} has no country and none can be carried forward.`,
      });
    }

    const id = buildNomineeId({ categoryId, country, personName, businessName });

    if (nomineesById.has(id)) {
      const firstRow = nomineesById.get(id).row;
      issues.push({
        code: ISSUE_CODES.DUPLICATE_NOMINEE_ID,
        severity: SEVERITY.ERROR,
        row: sheetRow,
        nomineeId: id,
        message:
          `Row ${sheetRow} resolves to the same nominee identity as row ${firstRow} ("${id}"). ` +
          'Two source rows must never collapse into one nominee.',
      });
      return;
    }

    const nominee = {
      id,
      categoryId,
      businessName,
      personName,
      country: country || null,
    };
    nomineesById.set(id, { row: sheetRow, nominee });
    nominees.push(nominee);

    if (!categoriesById.has(categoryId)) {
      categoriesById.set(categoryId, { id: categoryId, name: categoryName });
    }

    const count = (seenRowsByCategory.get(categoryId) ?? 0) + 1;
    seenRowsByCategory.set(categoryId, count);
  });

  const categories = [...categoriesById.values()].sort((a, b) => a.name.localeCompare(b.name));

  return { nominees, categories, issues };
}

/**
 * Summarize a normalization result, including countries and issue counts.
 *
 * @param {{ nominees: Array<object>, categories: Array<object>, issues: Array<object> }} result
 * @returns {{ nomineeCount: number, categoryCount: number, countryCount: number, countries: string[], errorCount: number, warningCount: number, byCategory: Array<object>, issues: Array<object> }}
 */
export function summarizeNormalization({ nominees, categories, issues }) {
  const countryCounts = new Map();
  for (const nominee of nominees) {
    const country = nominee.country ?? '(none)';
    countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
  }

  const categoryCounts = new Map();
  for (const nominee of nominees) {
    categoryCounts.set(nominee.categoryId, (categoryCounts.get(nominee.categoryId) ?? 0) + 1);
  }

  const byCategory = categories
    .map((category) => ({
      ...category,
      nomineeCount: categoryCounts.get(category.id) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    nomineeCount: nominees.length,
    categoryCount: categories.length,
    countryCount: countryCounts.size,
    countries: [...countryCounts.keys()].sort(),
    errorCount: issues.filter((issue) => issue.severity === SEVERITY.ERROR).length,
    warningCount: issues.filter((issue) => issue.severity === SEVERITY.WARNING).length,
    byCategory,
    issues,
  };
}

/**
 * Render a dry-run report for humans. Contains no contact data by construction.
 *
 * @param {object} summary - Result of {@link summarizeNormalization}.
 * @param {{ source?: string, mode?: string }} [meta]
 * @returns {string}
 */
export function formatDryRunReport(summary, meta = {}) {
  const lines = [];
  const mode = meta.mode ?? 'dry run';
  lines.push(`ACBF awards nominee catalogue — ${mode}`);
  if (meta.source) lines.push(`Source: ${meta.source}`);
  lines.push('');
  lines.push(`Nominees:   ${summary.nomineeCount}`);
  lines.push(`Categories: ${summary.categoryCount}`);
  lines.push(`Countries:  ${summary.countryCount} (${summary.countries.join(', ') || 'none'})`);
  lines.push('');
  lines.push('Nominees per category:');
  for (const category of summary.byCategory) {
    const flag = category.id.startsWith('review-') ? ' [needs review]' : '';
    lines.push(`  ${String(category.nomineeCount).padStart(3, ' ')}  ${category.name}${flag}`);
  }

  if (summary.issues.length > 0) {
    lines.push('');
    lines.push(`Issues (${summary.errorCount} error, ${summary.warningCount} warning):`);
    for (const issue of summary.issues) {
      const location = issue.row ? `row ${issue.row}: ` : '';
      lines.push(`  [${issue.severity}] ${location}${issue.message}`);
    }
  }

  lines.push('');
  lines.push(
    summary.errorCount === 0
      ? 'No blocking issues. Review the category mapping, then re-run with --apply.'
      : `${summary.errorCount} blocking issue(s): the importer will refuse to apply until they are resolved.`,
  );

  return lines.join('\n');
}

/**
 * Load and parse a `category-map.json` file.
 *
 * @param {string} [filePath]
 * @returns {object}
 */
export function loadCategoryMap(filePath) {
  const resolved =
    filePath ?? new URL('./category-map.json', import.meta.url).pathname;
  return JSON.parse(readFileSync(resolved, 'utf8'));
}

/**
 * Read the first worksheet of an XLSX workbook into row objects.
 *
 * The workbook stays outside the repository and outside `public/`; this function
 * only reads from the path it is given.
 *
 * @param {string} workbookPath
 * @returns {Array<Record<string, unknown>>}
 */
export function readNomineeWorkbook(workbookPath) {
  const XLSX = require('xlsx');
  const workbook = XLSX.readFile(workbookPath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error(`Workbook "${workbookPath}" has no worksheets`);
  const sheet = workbook.Sheets[sheetName];
  // Version 5 has an intentionally blank sixth heading. Recognize only its
  // exact surrounding layout; never guess a category from an arbitrary column.
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: true });
  const headers = matrix[0]?.map(normalizeKey) ?? [];
  if (headers.length === 7 &&
      headers[0] === 'country' && headers[1] === 'business name' &&
      headers[2] === 'business person' && headers[3] === 'contact number' &&
      headers[4] === 'email' && headers[5] === '' && headers[6] === 'extra notes') {
    const names = [...matrix[0]];
    names[5] = 'Award Category';
    return matrix.slice(1).map(cells => Object.fromEntries(names.map((name, i) => [name, cells[i] ?? ''])));
  }
  return XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: false });
}
