import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const CANDIDATE_BASES = [
  process.env.SMOKE_BASE_URL,
  'http://localhost:3001',
  'http://localhost:3000',
].filter(Boolean)

const DEFAULT_LOCALES = ['vi', 'en']
const DEFAULT_GROUP_ORDER = ['admin', 'auth', 'learning', 'legal', 'marketing', 'teacher', 'enrollment']
const LOCALES = (process.env.SMOKE_LOCALES || DEFAULT_LOCALES.join(','))
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean)
const NAV_TIMEOUT_MS = Number(process.env.SMOKE_NAV_TIMEOUT_MS || 60000)
const NAV_TIMEOUT_MAX_MS = Number(process.env.SMOKE_NAV_TIMEOUT_MAX_MS || 120000)
const NAV_RETRIES = Number(process.env.SMOKE_NAV_RETRIES || 3)
const INTER_ROUTE_DELAY_MS = Number(process.env.SMOKE_INTER_ROUTE_DELAY_MS || 120)
const WAIT_UNTIL = (process.env.SMOKE_WAIT_UNTIL || 'commit').trim() || 'commit'
const RAW_GROUP_ORDER = (process.env.SMOKE_GROUPS || DEFAULT_GROUP_ORDER.join(','))
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean)
const REPORT_TAG = (process.env.SMOKE_REPORT_TAG || '').trim()
const VERBOSE_ROUTE_LOG = process.env.SMOKE_VERBOSE_ROUTE_LOG === '1'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const ROUTE_GROUPS = {
  admin: {
    expected: 'protected',
    routes: [
      '/admin',
      '/admin/dashboard',
      '/admin/users',
      '/admin/subscriptions',
      '/admin/settings',
      '/admin/reports',
      '/admin/profile',
      '/admin/payments',
      '/admin/payments/codes',
      '/admin/exams',
      '/admin/certificates',
      '/admin/categories',
      '/admin/courses',
    ],
  },
  auth: {
    expected: 'public',
    routes: [
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
    ],
  },
  learning: {
    expected: 'protected',
    routes: [
      '/profile',
      '/settings',
      '/my-courses',
      '/checkout',
      '/cart',
      '/wishlist',
      '/notes',
      '/progress',
      '/payment-history',
      '/schedule',
      '/assignments',
      '/discussions',
      '/exams',
      '/certificates',
      '/top-up',
      '/userdb',
    ],
  },
  legal: {
    expected: 'public',
    routes: ['/privacy', '/terms', '/refund'],
  },
  marketing: {
    expected: 'public',
    routes: ['/', '/about', '/courses', '/contact', '/faq', '/teachers'],
  },
  teacher: {
    expected: 'protected',
    routes: [
      '/teacher/dashboard',
      '/teacher/courses',
      '/teacher/courses/create',
      '/teacher/exams',
      '/teacher/exams/create',
      '/teacher/exams/generate',
      '/teacher/exams/generate/create',
      '/teacher/students',
      '/teacher/earnings',
      '/teacher/settings',
      '/teacher/profile',
      '/teacher/analytics',
      '/teacher/lessons',
      '/teacher/certificates',
      '/teacher/certificates/create',
      '/teacher/reviews',
      '/teacher/assignments',
      '/teacher/settings/billing/checkout',
      '/teacher/settings/billing/methods/new',
    ],
  },
  enrollment: {
    expected: 'public',
    routes: ['/enrollment/success'],
  },
}

const GROUP_ORDER = RAW_GROUP_ORDER.filter((g) => ROUTE_GROUPS[g])

const DYNAMIC_ROUTES = [
  { group: 'marketing', route: '/courses/a6a1fcfa-77f1-4937-a50d-860a8004bacc', expected: 'public' },
  { group: 'marketing', route: '/course/a6a1fcfa-77f1-4937-a50d-860a8004bacc', expected: 'public' },
  { group: 'marketing', route: '/course/a6a1fcfa-77f1-4937-a50d-860a8004bacc/enrollment', expected: 'public' },
  { group: 'auth', route: '/reset-password/test-reset-token-123', expected: 'public' },
  { group: 'learning', route: '/exams/11111111-1111-1111-1111-111111111111/take', expected: 'protected' },
  { group: 'learning', route: '/exams/11111111-1111-1111-1111-111111111111/result', expected: 'protected' },
  { group: 'learning', route: '/exams/11111111-1111-1111-1111-111111111111/history', expected: 'protected' },
  { group: 'learning', route: '/player/11111111-1111-1111-1111-111111111111', expected: 'protected' },
  { group: 'teacher', route: '/teacher/courses/a6a1fcfa-77f1-4937-a50d-860a8004bacc/edit', expected: 'protected' },
  { group: 'teacher', route: '/teacher/courses/a6a1fcfa-77f1-4937-a50d-860a8004bacc/lessons', expected: 'protected' },
  { group: 'teacher', route: '/teacher/exams/11111111-1111-1111-1111-111111111111/edit', expected: 'protected' },
  { group: 'admin', route: '/admin/courses/a6a1fcfa-77f1-4937-a50d-860a8004bacc', expected: 'protected' },
  { group: 'admin', route: '/admin/exams/11111111-1111-1111-1111-111111111111', expected: 'protected' },
]

async function pickBaseUrl() {
  for (const base of CANDIDATE_BASES) {
    try {
      const res = await fetch(base, { redirect: 'manual' })
      if (res.status >= 200 && res.status < 500) return base
    } catch {
      // try next
    }
  }
  throw new Error(`No reachable frontend URL. Checked: ${CANDIDATE_BASES.join(', ')}`)
}

function evaluateResult(expected, status, finalPath, route, pageErrors, requestFailures) {
  const hasRuntimeError = pageErrors.length > 0
  if (status === 0) {
    return { ok: false, note: 'Navigation failed (no HTTP status)' }
  }

  const redirectedToLogin = /\/login(?:$|\?)/.test(finalPath)
  const isAdminRootRedirect = route === '/admin' && finalPath === '/admin/dashboard'

  if (expected === 'protected') {
    const redirectedWithinProtectedArea = finalPath.startsWith('/admin') || finalPath.startsWith('/teacher') || finalPath.startsWith('/userdb')
    if (status === 200 && (finalPath === route || redirectedToLogin || redirectedWithinProtectedArea || isAdminRootRedirect)) {
      if (hasRuntimeError) {
        return { ok: false, note: 'Loaded but runtime errors detected' }
      }
      return {
        ok: true,
        note: redirectedToLogin
          ? 'Auth guard redirect OK'
          : finalPath === route
            ? 'Protected page loaded'
            : `Protected route redirected to ${finalPath}`,
      }
    }
    return { ok: false, note: `Unexpected protected route result (status=${status}, final=${finalPath})` }
  }

  if (status === 200) {
    if (hasRuntimeError) {
      return { ok: false, note: 'Loaded but runtime errors detected' }
    }
    if (/\/404|\/not-found/.test(finalPath)) {
      return { ok: false, note: 'Landed on not-found page' }
    }
    return { ok: true, note: finalPath === route ? 'Public page loaded' : `Public route redirected to ${finalPath}` }
  }

  return { ok: false, note: `HTTP ${status}` }
}

function getRouteTimeoutMs(row, attempt) {
  let timeout = NAV_TIMEOUT_MS

  // Dynamic routes and protected routes tend to do more client work before navigation settles.
  if (row.dynamic) timeout = Math.round(timeout * 1.35)
  if (row.expected === 'protected') timeout = Math.round(timeout * 1.15)

  // Heavier route families can legitimately need a bit more time on low-end machines.
  if (/\/(courses|course|player|exams|assignments|certificates|teachers)(?:\/|$)/.test(row.route)) {
    timeout = Math.round(timeout * 1.2)
  }

  // Gradually back off timeout on retries instead of using one static timeout.
  timeout += attempt * 5000

  return Math.min(timeout, NAV_TIMEOUT_MAX_MS)
}

function toRows() {
  const rows = []
  for (const group of GROUP_ORDER) {
    const info = ROUTE_GROUPS[group]
    if (!info) continue
    for (const route of info.routes) {
      rows.push({ group, route, expected: info.expected, dynamic: false })
    }
  }
  for (const item of DYNAMIC_ROUTES) {
    rows.push({ ...item, dynamic: true })
  }
  return rows
}

function buildMarkdownReport(base, results) {
  const header = [
    `# Route Group Smoke Report`,
    ``,
    `- Base URL: ${base}`,
    `- Locales: ${LOCALES.join(', ')}`,
    ``,
    `| Group | Route | Dynamic | Locale | HTTP | Final Path | Result | Note |`,
    `|---|---|---:|---|---:|---|---|---|`,
  ]

  const body = results.map((r) => {
    const result = r.ok ? 'PASS' : 'FAIL'
    return `| ${r.group} | ${r.route} | ${r.dynamic ? 'yes' : 'no'} | ${r.locale} | ${r.status} | ${r.finalPath} | ${result} | ${r.note} |`
  })

  const summaryByGroup = Object.keys(ROUTE_GROUPS).map((group) => {
    const rows = results.filter((r) => r.group === group)
    const pass = rows.filter((r) => r.ok).length
    const fail = rows.length - pass
    return `- ${group}: PASS=${pass} FAIL=${fail} TOTAL=${rows.length}`
  })

  return [...header, ...body, '', '## Summary By Group', ...summaryByGroup, ''].join('\n')
}

async function run() {
  if (LOCALES.length === 0) {
    throw new Error('SMOKE_LOCALES produced an empty locale list')
  }
  if (GROUP_ORDER.length === 0) {
    throw new Error('SMOKE_GROUPS produced an empty/invalid group list')
  }

  const base = await pickBaseUrl()
  const routes = toRows()
  const browser = await chromium.launch({ headless: true })
  const results = []

  for (const locale of LOCALES) {
    for (const group of GROUP_ORDER) {
      const groupRows = routes.filter((r) => r.group === group)
      if (groupRows.length === 0) continue

      console.log(`RUN locale=${locale} group=${group} total=${groupRows.length}`)

      const context = await browser.newContext()
      await context.addInitScript((lang) => {
        localStorage.setItem('ics_lang', lang)
      }, locale)

      for (const row of groupRows) {
        const page = await context.newPage()
        const pageErrors = []
        const requestFailures = []

        const onPageError = (err) => pageErrors.push(err?.message || String(err))
        const onReqFail = (req) => requestFailures.push(`${req.method()} ${req.url()} -> ${req.failure()?.errorText || 'failed'}`)

        page.on('pageerror', onPageError)
        page.on('requestfailed', onReqFail)

        const url = `${base}${row.route}`
        let status = 0
        let finalPath = ''

        try {
          let resp
          for (let attempt = 0; attempt < NAV_RETRIES; attempt += 1) {
            try {
              const routeTimeout = getRouteTimeoutMs(row, attempt)
              if (VERBOSE_ROUTE_LOG) {
                console.log(
                  `ROUTE locale=${locale} group=${row.group} route=${row.route} attempt=${attempt + 1}/${NAV_RETRIES} timeout=${routeTimeout} waitUntil=${WAIT_UNTIL}`,
                )
              }
              resp = await page.goto(url, { waitUntil: WAIT_UNTIL, timeout: routeTimeout })
              break
            } catch (err) {
              if (attempt === NAV_RETRIES - 1) throw err
              await sleep(Math.min(300 * (attempt + 1), 1200))
            }
          }
          status = resp?.status() || 0
          finalPath = new URL(page.url()).pathname
        } catch (error) {
          results.push({
            ...row,
            locale,
            status,
            finalPath,
            ok: false,
            note: error instanceof Error ? error.message : String(error),
            pageErrors,
            requestFailures,
          })
          page.off('pageerror', onPageError)
          page.off('requestfailed', onReqFail)
          await page.close()
          if (INTER_ROUTE_DELAY_MS > 0) {
            await sleep(INTER_ROUTE_DELAY_MS)
          }
          continue
        }

        const verdict = evaluateResult(row.expected, status, finalPath, row.route, pageErrors, requestFailures)

        results.push({
          ...row,
          locale,
          status,
          finalPath,
          ok: verdict.ok,
          note: verdict.note,
          pageErrors,
          requestFailures,
        })

        page.off('pageerror', onPageError)
        page.off('requestfailed', onReqFail)
        await page.close()

        if (INTER_ROUTE_DELAY_MS > 0) {
          await sleep(INTER_ROUTE_DELAY_MS)
        }
      }

      await context.close()
    }
  }

  await browser.close()

  const pass = results.filter((x) => x.ok).length
  const fail = results.length - pass
  const byGroup = Object.keys(ROUTE_GROUPS).reduce((acc, group) => {
    const rows = results.filter((r) => r.group === group)
    const p = rows.filter((r) => r.ok).length
    acc[group] = { pass: p, fail: rows.length - p, total: rows.length }
    return acc
  }, {})

  const reportDir = join(__dirname, '..', 'artifacts', 'reports')
  mkdirSync(reportDir, { recursive: true })

  const reportBaseName = REPORT_TAG ? `route-groups-smoke-report-${REPORT_TAG}` : 'route-groups-smoke-report'
  const jsonPath = join(reportDir, `${reportBaseName}.json`)
  const mdPath = join(reportDir, `${reportBaseName}.md`)

  writeFileSync(
    jsonPath,
    JSON.stringify({ base, summary: { pass, fail, total: results.length }, byGroup, results }, null, 2),
    'utf-8',
  )

  writeFileSync(mdPath, buildMarkdownReport(base, results), 'utf-8')

  console.log(`ROUTE_GROUP_SMOKE PASS=${pass} FAIL=${fail} TOTAL=${results.length}`)
  console.log(`REPORT_JSON=${jsonPath}`)
  console.log(`REPORT_MD=${mdPath}`)

  for (const [group, s] of Object.entries(byGroup)) {
    console.log(`GROUP ${group} PASS=${s.pass} FAIL=${s.fail} TOTAL=${s.total}`)
  }

  if (fail > 0) {
    const failed = results.filter((x) => !x.ok).slice(0, 20)
    for (const f of failed) {
      console.log(`FAIL ${f.locale} ${f.group} ${f.route} status=${f.status} final=${f.finalPath} note=${f.note}`)
    }
    process.exitCode = 1
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
