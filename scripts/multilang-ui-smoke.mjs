import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const base = process.env.SMOKE_BASE_URL || 'http://localhost:3001'

const locales = ['vi', 'en', 'ja', 'ko', 'zh-CN']
const routes = [
  '/login',
  '/admin',
  '/admin/settings',
  '/admin/subscriptions',
  '/admin/payments',
  '/admin/users',
]

const badPatterns = [
  /Ch\?n ng\uFFFDn ng\?/i,
  /gói\s*강사/i,
  /관리\s*gói/i,
  /Theo dõi\s*와\s*quản lý\s*các\s*거래\s*결제/i,
  /거래\s*thành công/i,
  /관리\s*모두\s*사용자\s*안\s*hệ thống/i,
  /Số\s*계정/i,
  /Chủ\s*계정/i,
  /Mã\s*QR\s*결제/i,
  /Create\s*gói/i,
  /Created\s*gói\s*new/i,
  /作成\s*gói/i,
  /생성\s*gói/i,
]

const localeHints = {
  vi: [/Cài đặt hệ thống|Đăng nhập|Quản lý/],
  en: [/System Settings|Login|Manage/],
  ja: [/システム設定|ログイン|管理/],
  ko: [/시스템 설정|로그인|관리/],
  'zh-CN': [/系统设置|登录|管理/],
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const results = []

  for (const locale of locales) {
    const context = await browser.newContext()
    await context.addInitScript((lang) => {
      localStorage.setItem('ics_lang', lang)
    }, locale)

    const page = await context.newPage()

    for (const route of routes) {
      const url = `${base}${route}`
      const row = {
        locale,
        route,
        status: 0,
        ok: false,
        badMatches: [],
        hasLocaleHint: false,
        note: '',
      }

      try {
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 })
        row.status = response?.status() || 0

        const bodyText = await page.locator('body').innerText()
        const compact = bodyText.replace(/\s+/g, ' ').trim()

        row.badMatches = badPatterns.filter((re) => re.test(compact)).map((re) => re.source)
        row.hasLocaleHint = (localeHints[locale] || []).some((re) => re.test(compact))

        if (row.status !== 200) {
          row.note = `HTTP ${row.status}`
        } else if (row.badMatches.length > 0) {
          row.note = 'Found mixed-language pattern(s)'
        } else {
          row.note = row.hasLocaleHint ? 'OK' : 'No hint phrase detected but page loaded'
        }

        row.ok = row.status === 200 && row.badMatches.length === 0
      } catch (error) {
        row.note = error instanceof Error ? error.message : String(error)
        row.ok = false
      }

      results.push(row)
    }

    await context.close()
  }

  await browser.close()

  const pass = results.filter((x) => x.ok).length
  const fail = results.length - pass

  const reportDir = join(__dirname, '..', 'artifacts', 'reports')
  mkdirSync(reportDir, { recursive: true })
  const reportPath = join(reportDir, 'multilang-ui-smoke-report.json')
  writeFileSync(reportPath, JSON.stringify({ base, summary: { pass, fail, total: results.length }, results }, null, 2), 'utf-8')

  console.log(`MULTILANG_UI_SMOKE PASS=${pass} FAIL=${fail} TOTAL=${results.length}`)
  console.log(`REPORT=${reportPath}`)

  if (fail > 0) {
    const samples = results.filter((x) => !x.ok).slice(0, 10)
    for (const s of samples) {
      console.log(`FAIL ${s.locale} ${s.route} status=${s.status} note=${s.note}`)
    }
    process.exitCode = 1
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
