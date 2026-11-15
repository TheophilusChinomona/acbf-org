# Real nominee workbook validation

Validated 13 November 2026 against the privately supplied Awards Nominees 5.xlsx. No production import was performed; the original workbook and its contact fields are not committed.

- 139 unique nominees; 9 countries; 32 populated categories.
- 0 blocking issues; 3 missing business names; 21 missing person names.
- Blank sixth header is accepted only for the exact known seven-column workbook layout. Business Person is a recognized name column.

## Mapping decisions

Use the spreadsheet awards rather than the old website categories. Preserve old category IDs where the meaning matches; add standalone awards instead of combining construction/real estate or agriculture/mining. New public category names follow the workbook.

Merge only these explicit variants: energy “and”/“&”; singular/plural risk-management award; youth entrepreneurship spelling and optional trailing “Award”; case and whitespace. Correct “Enterprenuership” to “Entrepreneurship” for display.

Keep Legal and Compliance Services Award and Legal and Compliance Services Excellence Award separate, with four nominees and one nominee respectively. Keep Professional Services Award separate. Owner publication signoff may explicitly merge them later; no such merge is assumed. The mapping review date stays unset until owner signoff.

## Ballot category counts

| Category | Nominees |
|---|---:|
| Agri Business Excellence Award | 4 |
| Beauty and Fashion Excellence Award | 4 |
| Built Environment Excellence Award | 4 |
| Business Leader of the Year | 4 |
| Community Impact Award | 5 |
| Construction and Infrastructure Award | 5 |
| Creative Industries and Tourism Award | 9 |
| Education and Training Excellence Award | 4 |
| Energy & Utilities Excellence Award | 5 |
| Excellence in Music & Arts Award | 3 |
| Financial Services Excellence Award | 5 |
| Food Industry Excellence Award | 4 |
| Furniture and Interiors Excellence Award | 4 |
| Healthcare and Wellness Excellence Award | 9 |
| I.T & A.I Solutions Excellence Award | 4 |
| Investment Excellence Award | 4 |
| Job Creation and Skills Development Award | 4 |
| Legal and Compliance Services Award | 4 |
| Legal and Compliance Services Excellence Award | 1 |
| Lifetime Achievement Award | 1 |
| Manufacturing and Industrial Development Award | 4 |
| Media and Entertainment Excellence Award | 5 |
| Mining and Natural Resources Excellence Award | 2 |
| Professional Services Award | 6 |
| Real Estate Excellence Award | 4 |
| Retail and Consumer Services Excellence Award | 3 |
| Risk Management and Security Excellence Award | 3 |
| Services Excellence Award | 6 |
| SME Excellence Award | 3 |
| Transport & Logistics Excellence Award | 6 |
| Woman in Business Leadership Award | 5 |
| Youth Entrepreneurship of the Year Award | 5 |

## Reproduce

```bash
AWARDS_NOMINEES_XLSX="/absolute/private/path/Awards Nominees 5.xlsx" npm run test:awards
node scripts/awards/import-nominees.mjs "/absolute/private/path/Awards Nominees 5.xlsx"
```

The importer defaults to dry run. Production apply requires authenticated Admin SDK credentials and approved launch preparation.
