// ---------------------------------------------------------------------------
// Smoke test (dev-only, run with:  node scripts/smoke.mjs)
// Serves the production build, walks the whole scroll journey in three
// profiles (mobile / desktop / reduced-motion), exercises the easter eggs,
// captures screenshots into _shots/, and fails on ANY console/page error.
// ---------------------------------------------------------------------------
import fs from 'node:fs'
import { preview } from 'vite'
import { chromium, devices } from 'playwright'

const shotsDir = '_shots'
fs.mkdirSync(shotsDir, { recursive: true })

const errors = []
const server = await preview({ preview: { port: 4173, host: '127.0.0.1' } })
const browser = await chromium.launch()

async function journey(name, contextOptions, actions) {
  const context = await browser.newContext(contextOptions)
  const page = await context.newPage()
  page.on('pageerror', (e) => errors.push(`[${name}] pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${name}] console.error: ${m.text()}`)
  })
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'load' })
  try {
    await actions(page, name)
  } catch (e) {
    errors.push(`[${name}] ACTION FAILED: ${e.message}`)
  }
  await context.close()
}

const waitReady = (page) =>
  page.waitForSelector('div.z-50', { state: 'detached', timeout: 45000 })

// ------------------------------------------------------------- mobile phone
await journey('mobile', { ...devices['Pixel 7'], deviceScaleFactor: 2 }, async (page, name) => {
  await waitReady(page)
  await page.waitForTimeout(1900) // loader fade + hero entrance
  await page.screenshot({ path: `${shotsDir}/${name}-1-hero.png` })

  const total = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
  const stops = [
    ['2-scrub-early', 0.18],
    ['3-scrub-late', 0.42],
    ['4-popout', 0.6],
    ['5-drift', 0.72],
  ]
  for (const [label, f] of stops) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * f))
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${shotsDir}/${name}-${label}.png` })
  }

  // easter eggs while parked in the drift zone
  const rabbit = page.locator('button[aria-label*="rabbit"]')
  if (await rabbit.count()) {
    await rabbit.click({ force: true }).catch((e) => errors.push(`[${name}] rabbit click: ${e.message}`))
    await page.waitForTimeout(450)
    await page.screenshot({ path: `${shotsDir}/${name}-6-rabbit-burst.png` })
  }
  const moon = page.locator('button[aria-label*="moon"]')
  if (await moon.count()) {
    await moon.click({ force: true }).catch((e) => errors.push(`[${name}] moon click: ${e.message}`))
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${shotsDir}/${name}-7-change.png` })
  }

  // long-press the cake (hold mouse down 800ms at the cake anchor)
  const vp = page.viewportSize()
  await page.mouse.move(vp.width * 0.47, vp.height * 0.4)
  await page.mouse.down()
  await page.waitForTimeout(850)
  await page.mouse.up()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${shotsDir}/${name}-8-cross-section.png` })

  // product-viewer: orbit drag on the cake, then double-tap reset
  await page.mouse.move(vp.width * 0.47, vp.height * 0.42)
  await page.mouse.down()
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(vp.width * 0.47 + i * 7, vp.height * 0.42 - i * 4, { steps: 2 })
  }
  await page.mouse.up()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${shotsDir}/${name}-8b-orbit.png` })
  await page.mouse.dblclick(vp.width * 0.47, vp.height * 0.42)
  await page.waitForTimeout(600)

  // closing
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(1900)
  await page.screenshot({ path: `${shotsDir}/${name}-9-closing.png` })
})

// ----------------------------------------------------------------- desktop
await journey('desktop', { viewport: { width: 1440, height: 900 } }, async (page, name) => {
  await waitReady(page)
  await page.waitForTimeout(1700)
  await page.screenshot({ path: `${shotsDir}/${name}-1-hero.png` })
  const total = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * 0.3))
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${shotsDir}/${name}-2-scrub.png` })
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * 0.78))
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${shotsDir}/${name}-3-drift.png` })

  // product-viewer: wheel zoom in on the cake, then double-click to reset
  await page.mouse.move(667, 350)
  await page.mouse.wheel(0, -260)
  await page.waitForTimeout(450)
  await page.screenshot({ path: `${shotsDir}/${name}-3b-zoom.png` })
  await page.mouse.dblclick(667, 350)
  await page.waitForTimeout(600)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(1700)
  await page.screenshot({ path: `${shotsDir}/${name}-4-closing.png` })
})

// ---------------------------------------------------- reduced-motion profile
await journey('reduced', { ...devices['Pixel 7'], reducedMotion: 'reduce' }, async (page, name) => {
  await waitReady(page)
  await page.waitForTimeout(1400)
  await page.screenshot({ path: `${shotsDir}/${name}-1-hero.png` })
  const total = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * 0.75))
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${shotsDir}/${name}-2-stage-static.png` })
})

await browser.close()
server.httpServer.close()

if (errors.length) {
  console.log(`ERRORS (${errors.length}):\n${errors.join('\n')}`)
  process.exit(1)
}
console.log('SMOKE OK — no console/page errors')
