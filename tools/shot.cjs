// Headless screenshot helper for looking at the game (dev only, not part of the build).
//
//   node tools/shot.cjs <page.html> <out.png> [--w 390] [--h 844] [--dpr 2] [--wait 500] [--eval "js"] [--script file.cjs]
//
// --eval runs a JS snippet inside the page (it may `await`); --script loads a CommonJS module exporting
// `async ({page, browser, errors}) => {}` for multi-step flows (several screenshots, clicks, ...).
// Page console errors and uncaught exceptions are printed, so a broken build is obvious.
// Playwright is not a dependency of this repo: set PLAYWRIGHT_DIR or the sibling-project path below is used.
const fs = require('fs'), path = require('path');
const cands = [process.env.PLAYWRIGHT_DIR, '/home/martin/getsociableapp/node_modules/playwright', 'playwright'].filter(Boolean);
let pw = null;
for (const c of cands) { try { pw = require(c); break; } catch (e) { /* try next */ } }
if (!pw) { console.error('Playwright not found. Set PLAYWRIGHT_DIR to a playwright package directory.'); process.exit(2); }

const args = process.argv.slice(2), pos = [], opt = {};
for (let i = 0; i < args.length; i++) { if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i]; else pos.push(args[i]); }
const [page_, out] = pos;
if (!page_) { console.error('usage: node tools/shot.cjs <page.html> <out.png> [--w --h --dpr --wait --eval --script]'); process.exit(1); }

(async () => {
  const browser = await pw.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: +(opt.w || 390), height: +(opt.h || 844) }, deviceScaleFactor: +(opt.dpr || 2), isMobile: +(opt.w || 390) < 700, hasTouch: +(opt.w || 390) < 700 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') { errors.push(m.type() + ': ' + m.text()); console.log('[console.' + m.type() + ']', m.text()); } });
  page.on('pageerror', e => { errors.push('pageerror: ' + e.message); console.log('[pageerror]', e.stack || e.message); });
  await page.goto('file://' + path.resolve(page_));
  await page.waitForTimeout(+(opt.wait || 400));
  if (opt.eval) { const r = await page.evaluate(`(async()=>{${opt.eval}})()`); if (r !== undefined) console.log('[eval]', typeof r === 'string' ? r : JSON.stringify(r)); await page.waitForTimeout(+(opt.wait || 400)); }
  if (opt.script) { await require(path.resolve(opt.script))({ page, browser, errors }); }
  if (out) { fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); await page.screenshot({ path: out }); console.log('wrote', out); }
  await browser.close();
  process.exit(errors.some(e => e.startsWith('pageerror')) ? 3 : 0);
})().catch(e => { console.error(e); process.exit(1); });
