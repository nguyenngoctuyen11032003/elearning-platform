import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const reportDir = join(__dirname, '..', 'artifacts', 'reports')
mkdirSync(reportDir, { recursive: true })

const DEFAULT_GROUPS = ['admin', 'auth', 'learning', 'legal', 'marketing', 'teacher', 'enrollment']
const DEFAULT_LOCALES = ['vi', 'en']

const groups = (process.env.SMOKE_GROUPS || DEFAULT_GROUPS.join(','))
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean)

const locales = (process.env.SMOKE_LOCALES || DEFAULT_LOCALES.join(','))
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean)

if (groups.length === 0 || locales.length === 0) {
  throw new Error('SMOKE_GROUPS or SMOKE_LOCALES is empty')
}

const baseTag = (process.env.SMOKE_REPORT_TAG || 'deterministic').trim()
const subReports = []
const failedJobs = []

for (const locale of locales) {
  for (const group of groups) {
    const subTag = `${baseTag}-${locale}-${group}`
    console.log(`RUN_DETERMINISTIC locale=${locale} group=${group} tag=${subTag}`)

    const childEnv = {
      ...process.env,
      SMOKE_LOCALES: locale,
      SMOKE_GROUPS: group,
      SMOKE_REPORT_TAG: subTag,
    }

    const result = spawnSync(process.execPath, [join(__dirname, 'route-groups-smoke.mjs')], {
      cwd: join(__dirname, '..'),
      env: childEnv,
      stdio: 'inherit',
    })

    const jsonPath = join(reportDir, `route-groups-smoke-report-${subTag}.json`)
    subReports.push({ locale, group, tag: subTag, jsonPath })

    if (result.status !== 0) {
      failedJobs.push({ locale, group, code: result.status })
    }
  }
}

const orderedResults = []
let detectedBase = ''

for (const locale of locales) {
  for (const group of groups) {
    const item = subReports.find((x) => x.locale === locale && x.group === group)
    if (!item || !existsSync(item.jsonPath)) continue

    const payload = JSON.parse(readFileSync(item.jsonPath, 'utf-8'))
    if (!detectedBase && payload.base) {
      detectedBase = payload.base
    }

    const rows = Array.isArray(payload.results) ? payload.results : []
    rows.sort((a, b) => {
      if ((a.dynamic ? 1 : 0) !== (b.dynamic ? 1 : 0)) {
        return (a.dynamic ? 1 : 0) - (b.dynamic ? 1 : 0)
      }
      return String(a.route).localeCompare(String(b.route))
    })
    orderedResults.push(...rows)
  }
}

const pass = orderedResults.filter((x) => x.ok).length
const fail = orderedResults.length - pass

const byGroup = groups.reduce((acc, group) => {
  const rows = orderedResults.filter((r) => r.group === group)
  const groupPass = rows.filter((r) => r.ok).length
  acc[group] = {
    pass: groupPass,
    fail: rows.length - groupPass,
    total: rows.length,
  }
  return acc
}, {})

const summary = { pass, fail, total: orderedResults.length }

const mergedJsonPath = join(reportDir, `route-groups-smoke-report-${baseTag}.json`)
writeFileSync(
  mergedJsonPath,
  JSON.stringify(
    {
      base: detectedBase,
      locales,
      groups,
      deterministic: true,
      summary,
      byGroup,
      failedJobs,
      results: orderedResults,
    },
    null,
    2,
  ),
  'utf-8',
)

const mdRows = [
  '# Route Group Smoke Report (Deterministic)',
  '',
  `- Base URL: ${detectedBase || 'unknown'}`,
  `- Locales: ${locales.join(', ')}`,
  `- Groups: ${groups.join(', ')}`,
  `- Summary: PASS=${summary.pass} FAIL=${summary.fail} TOTAL=${summary.total}`,
  '',
  '| Group | Route | Dynamic | Locale | HTTP | Final Path | Result | Note |',
  '|---|---|---:|---|---:|---|---|---|',
]

for (const row of orderedResults) {
  mdRows.push(
    `| ${row.group} | ${row.route} | ${row.dynamic ? 'yes' : 'no'} | ${row.locale} | ${row.status} | ${row.finalPath || ''} | ${row.ok ? 'PASS' : 'FAIL'} | ${row.note || ''} |`,
  )
}

mdRows.push('', '## Summary By Group')
for (const group of groups) {
  const s = byGroup[group]
  mdRows.push(`- ${group}: PASS=${s.pass} FAIL=${s.fail} TOTAL=${s.total}`)
}

if (failedJobs.length > 0) {
  mdRows.push('', '## Failed Jobs')
  for (const job of failedJobs) {
    mdRows.push(`- ${job.locale}/${job.group}: exit=${job.code}`)
  }
}

mdRows.push('')
const mergedMdPath = join(reportDir, `route-groups-smoke-report-${baseTag}.md`)
writeFileSync(mergedMdPath, mdRows.join('\n'), 'utf-8')

console.log(`DETERMINISTIC_REPORT_JSON=${mergedJsonPath}`)
console.log(`DETERMINISTIC_REPORT_MD=${mergedMdPath}`)
console.log(`DETERMINISTIC_SUMMARY PASS=${summary.pass} FAIL=${summary.fail} TOTAL=${summary.total}`)

if (summary.fail > 0 || failedJobs.length > 0) {
  process.exitCode = 1
}
