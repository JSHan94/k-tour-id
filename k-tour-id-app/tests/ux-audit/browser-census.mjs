import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import path from 'node:path'

// Interactive black-box inventory. No source-derived state seeding. All browser
// mutations must come from UI actions; remote mutations/provider requests stop.
const origin = 'https://ktour-id.vercel.app'
const runName = process.argv[2] || 'browser-census'
if (!/^[a-z0-9-]+$/.test(runName)) throw new Error('Use a simple distinct audit run name')
const artifacts = path.resolve('artifacts/qa/ux-audit', runName)
await mkdir(artifacts, { recursive: true })
const browser = await chromium.launch({ headless: true })
let context, page
const records = [], errors = [], blocked = []
async function fresh(width = 390) {
  if (context) await context.close()
  context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, locale: 'en-US', colorScheme: 'light' })
  await context.route('**/*', route => {
    const req = route.request(), url = new URL(req.url())
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method()) || /sumsub|mobileid|opendid/i.test(url.hostname)) {
      blocked.push({ method: req.method(), origin: url.origin, pathname: url.pathname })
      return route.abort('blockedbyclient')
    }
    return route.continue()
  })
  page = await context.newPage()
  page.setDefaultTimeout(5000)
  page.on('pageerror', e => errors.push(e.message))
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  await page.locator('[data-hydrated="true"]').first().waitFor({ timeout: 45000 })
}
async function snapshot(label, action = 'inspect') {
  await page.waitForTimeout(650)
  const state = await page.evaluate(() => {
    const visible = e => { const s = getComputedStyle(e); return !!e.getClientRects().length && s.visibility !== 'hidden' && s.display !== 'none' }
    return {
      url: location.href, title: document.title,
      text: document.body.innerText,
      controls: [...document.querySelectorAll('button,a,input,select,textarea,summary,[role="button"]')].filter(visible).map(e => ({ tag: e.tagName, text: e.innerText || '', name: e.getAttribute('aria-label') || '', testId: e.getAttribute('data-testid'), type: e.getAttribute('type'), disabled: !!e.disabled, placeholder: e.getAttribute('placeholder'), href: e.tagName === 'A' ? e.getAttribute('href') : null })),
      dialogs: [...document.querySelectorAll('[role="dialog"]')].filter(visible).map(e => ({ label: e.getAttribute('aria-label'), testId: e.getAttribute('data-testid') })),
      viewport: { width: innerWidth, height: innerHeight, overflow: document.documentElement.scrollWidth > innerWidth },
    }
  })
  const n = String(records.length + 1).padStart(3, '0'), file = `${n}-${label.replace(/[^a-z0-9-]/gi, '-')}.png`
  await page.screenshot({ path: path.join(artifacts, file) })
  const record = { id: `B${n}`, label, action, capturedAt: new Date().toISOString(), screenshot: file, ...state }
  records.push(record)
  await writeFile(path.join(artifacts, 'observations.json'), JSON.stringify({ origin, records, errors, blocked }, null, 2))
  console.log(JSON.stringify({ id: record.id, label, url: state.url, text: state.text.slice(-16000), controls: state.controls, dialogs: state.dialogs, viewport: state.viewport }))
}
await fresh()
console.log('CENSUS_READY')
await snapshot('fresh-landing')
const rl = createInterface({ input: process.stdin, crlfDelay: Infinity })
for await (const line of rl) {
  if (!line.trim()) continue
  try {
    const command = JSON.parse(line)
    if (command.finish) break
    if (command.fresh) await fresh(command.width || 390)
    if (command.url) await page.goto(new URL(command.url, origin).href, { waitUntil: 'domcontentloaded' })
    if (command.code) await new Function('page', 'context', `return (async()=>{${command.code}})()`)(page, context)
    await snapshot(command.label || 'inspection', command.code || command.url || 'new context')
  } catch (e) { console.log(JSON.stringify({ commandError: e.message })) }
}
await context.close()
await browser.close()
