// Integration smoke test: drives a built game through the main flows and screenshots each step.
//   node tools/smoke.cjs <built index.html> <out dir> [--quick]
// Exits non-zero on any page error, NaN in the simulation or a failed check. Dev tool, not part of the build.
const fs = require('fs'), path = require('path');
let pw = null;
for (const c of [process.env.PLAYWRIGHT_DIR, '/home/martin/getsociableapp/node_modules/playwright', 'playwright'].filter(Boolean)) { try { pw = require(c); break; } catch (e) { /* next */ } }
if (!pw) { console.error('Playwright not found; set PLAYWRIGHT_DIR'); process.exit(2); }
const [file, out] = process.argv.slice(2);
if (!file || !out) { console.error('usage: node tools/smoke.cjs <index.html> <outdir>'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const fails = [], errors = [];
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) fails.push(msg); };

(async () => {
  const browser = await pw.chromium.launch();
  const mk = async (w, h, mobile) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error') { errors.push(m.text()); console.log('[console.error]', m.text()); } });
    page.on('pageerror', e => { errors.push(e.message); console.log('[pageerror]', e.stack || e.message); });
    await page.goto('file://' + path.resolve(file));
    await page.waitForTimeout(500);
    return page;
  };
  const shot = (page, name) => page.screenshot({ path: path.join(out, name + '.png') });
  const ev = (page, fn) => page.evaluate(fn);

  // ---- phone portrait ----
  let page = await mk(390, 844, true);
  await shot(page, '01-menu');
  await page.click('#b-local'); await page.waitForTimeout(300); await shot(page, '02-setup');
  await page.click('#b-start'); await page.waitForTimeout(2500);
  check(await ev(page, () => !!G && !G.over), 'local game starts');
  await shot(page, '03-game-start');
  // fast-forward the simulation two minutes and check sanity
  const sane = await ev(page, () => { for (let i = 0; i < 2400; i++) step(G, 0.05); G.events.length = 0;
    const bad = G.castles.filter(c => !isFinite(c.size) || c.size < -0.01 || c.u.some(v => !isFinite(v) || v < -0.01)).length;
    const pbad = G.pl.filter(p => !isFinite(p.souls)).length; return { bad, pbad, souls: Math.floor(G.pl[0].souls), t: Math.round(G.time), sol: G.sol.length }; });
  check(sane.bad === 0 && sane.pbad === 0, 'no NaN castles/players after 2 min ' + JSON.stringify(sane));
  await page.waitForTimeout(600); await shot(page, '04-game-2min');
  // castle panel on the Throne
  await ev(page, () => { sel = G.home[mySlot]; panelKey = ''; updatePanel(); });
  await page.waitForTimeout(700); await shot(page, '05-panel-throne');
  // research overlay: give souls, draw cards
  await ev(page, () => { sel = -1; updatePanel(); G.pl[mySlot].souls = 600; });
  await page.click('#b-res').catch(() => {}); await page.waitForTimeout(500); await shot(page, '06-research-closed');
  await ev(page, () => { issue(5, 0); }); await page.waitForTimeout(900); await shot(page, '07-research-cards');
  check(await ev(page, () => Array.isArray(G.pl[mySlot].offer) && G.pl[mySlot].offer.length === 2), 'research draw offers two cards');
  await ev(page, () => { issue(13, 0); }); await page.waitForTimeout(500);
  check(await ev(page, () => G.pl[mySlot].rn === 1 && !G.pl[mySlot].offer), 'picking a card applies it');
  await ev(page, () => { closeOv(); resOpen = false; });
  // Souls mode, towers and spells on the Throne
  const flow = await ev(page, () => { const me = mySlot, ci = G.home[me], c = G.castles[ci]; G.pl[me].souls = 900; c.u[0] = Math.max(c.u[0], 20); c.size = c.u[0] + c.u[1] + c.u[2];
    const m = setMode(G, me, ci, 1), s0 = G.pl[me].souls; for (let i = 0; i < 400; i++) step(G, 0.05); G.events.length = 0; const gained = Math.round(G.pl[me].souls - s0);
    setMode(G, me, ci, 0); const f = fortify(G, me, ci); for (let i = 0; i < 200; i++) step(G, 0.05); G.events.length = 0;
    const h = useSpell(G, me, 0), sp = useSpell(G, me, 1, 400, 600), fi = useSpell(G, me, 2, 500, 800); return { m, gained, f, tl: c.tl, h, sp, fi }; });
  check(flow.m && flow.gained > 0, 'Souls mode yields souls ' + JSON.stringify(flow));
  check(flow.f && flow.tl === 1, 'fortify raises a tower ring ' + flow.tl);
  check(flow.h && flow.sp && flow.fi, 'all three spells can be cast from the start');
  await ev(page, () => { sel = G.home[mySlot]; panelKey = ''; updatePanel(); });
  await page.waitForTimeout(700); await shot(page, '08-panel-after');
  await ev(page, () => { sel = -1; updatePanel(); for (let i = 0; i < 60; i++) step(G, 0.05); });
  await page.waitForTimeout(500); await shot(page, '08b-spells-active');
  await page.close();

  // ---- campaign mission 1 with tutorial ----
  page = await mk(390, 844, true);
  await page.click('#b-camp'); await page.waitForTimeout(300); await shot(page, '09-campaign');
  await page.click('#missions .mission:first-child'); await page.waitForTimeout(600);
  await shot(page, '10-mission-intro');
  await page.click('#ov-card [data-a="go"]').catch(() => {}); await page.waitForTimeout(1500); await shot(page, '11-tutorial');
  await page.close();

  // ---- desktop landscape ----
  page = await mk(1280, 800, false);
  await page.click('#b-local'); await page.waitForTimeout(200);
  await page.evaluate(() => { CFG.mt = 6; });
  await page.click('#b-start'); await page.waitForTimeout(2500);
  await ev(page, () => { for (let i = 0; i < 4000; i++) step(G, 0.05); G.events.length = 0; });
  await page.waitForTimeout(800); await shot(page, '12-desktop-game-frost');
  await page.close();

  await browser.close();
  check(errors.length === 0, 'no console/page errors (' + errors.length + ')');
  console.log(fails.length ? 'SMOKE FAILED: ' + fails.length + ' check(s)' : 'SMOKE PASSED');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
