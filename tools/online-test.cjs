// Two-page online test through the public MQTT relay (needs internet): host opens a game, the guest joins by code and from the public list, a battle starts, the guest's command reaches the host.
//   node tools/online-test.cjs <built index.html> [outdir]      (needs Playwright, see tools/shot.cjs)
const fs = require('fs'), path = require('path');
let pw = null;
for (const c of [process.env.PLAYWRIGHT_DIR, '/home/martin/getsociableapp/node_modules/playwright', 'playwright'].filter(Boolean)) { try { pw = require(c); break; } catch (e) { /* next */ } }
if (!pw) { console.error('Playwright not found; set PLAYWRIGHT_DIR'); process.exit(2); }
const file = process.argv[2], out = process.argv[3];
if (!file) { console.error('usage: node tools/online-test.cjs <index.html> [outdir]'); process.exit(1); }
const fails = [], errors = [];
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) fails.push(msg); };
(async () => {
  const browser = await pw.chromium.launch();
  const mk = async (name) => { const ctx = await browser.newContext({ viewport: { width: 420, height: 900 } }); const page = await ctx.newPage();
    page.on('pageerror', e => { errors.push(name + ': ' + e.message); console.log('[pageerror ' + name + ']', e.message); });
    page.on('console', m => { if (m.type() === 'error' && !/WebSocket|ERR_/.test(m.text())) { errors.push(name + ': ' + m.text()); console.log('[console.error ' + name + ']', m.text()); } });
    await page.goto('file://' + path.resolve(file)); await page.waitForTimeout(500); return page; };
  const A = await mk('host'), B = await mk('guest');
  check(await A.evaluate(() => !document.getElementById('b-host').disabled), 'online buttons are enabled with the relay');
  await A.click('#b-host'); await A.waitForSelector('#s-setup.on', { timeout: 20000 });
  const code = (await A.textContent('#code')).trim();
  check(/^[A-Z]{4}$/.test(code), 'host got a four-letter code (' + code + ')');
  await A.waitForTimeout(1500);
  // the game shows up in the public list, and the guest can join by code
  await B.click('#b-join'); await B.waitForTimeout(200);
  await B.waitForFunction(c => [...document.querySelectorAll('#games .game-item b')].some(b => b.textContent === c), code, { timeout: 15000 }).then(() => check(true, 'the game is listed publicly'), () => check(false, 'the game is listed publicly'));
  await B.fill('#code-in', code); await B.click('#b-code');
  await B.waitForFunction(() => document.getElementById('s-wait').classList.contains('on'), null, { timeout: 15000 });
  await B.waitForFunction(() => document.querySelectorAll('#wait-slots .slot').length > 0, null, { timeout: 15000 }).then(() => check(true, 'guest sees the lobby'), () => check(false, 'guest sees the lobby'));
  await A.waitForFunction(() => CFG.slots.some((s, i) => i > 0 && s.k === 'h'), null, { timeout: 15000 });
  check(true, 'guest takes a slot on the host');
  await A.click('#b-start'); await A.waitForTimeout(2500);
  await B.waitForFunction(() => !!G && Array.isArray(G.castles) && G.castles.length > 3, null, { timeout: 20000 });
  const my = await B.evaluate(() => mySlot);
  check(my > 0, 'guest got a player slot (' + my + ')');
  const ci = await B.evaluate(() => G.home[mySlot]);
  await B.evaluate(ci => { issue(4, ci, 1); }, ci);
  await A.waitForFunction(ci => G.castles[ci].mode === 1, ci, { timeout: 10000 }).then(() => check(true, 'a guest command (Souls mode) runs on the host'), () => check(false, 'a guest command (Souls mode) runs on the host'));
  await B.waitForFunction(ci => G.castles[ci].mode === 1, ci, { timeout: 10000 }).then(() => check(true, 'the change comes back to the guest in a snapshot'), () => check(false, 'the change comes back to the guest in a snapshot'));
  const t0 = await B.evaluate(() => G.time); await B.waitForTimeout(3000);
  check(await B.evaluate(t0 => G.time > t0 + 1.5, t0), 'guest clock advances with the host');
  const [ht, gt] = [await A.evaluate(() => G.time), await B.evaluate(() => G.time)];
  check(Math.abs(ht - gt) < 3, 'guest is within 3 s of the host (' + (ht - gt).toFixed(1) + ' s behind)');
  if (out) { fs.mkdirSync(out, { recursive: true }); await A.screenshot({ path: path.join(out, 'online-host.png') }); await B.screenshot({ path: path.join(out, 'online-guest.png') }); }
  // the host leaving removes the public ad
  await A.evaluate(() => { leaveNet(); }); await B.waitForTimeout(1500);
  await browser.close();
  check(errors.length === 0, 'no console/page errors (' + errors.length + ')');
  console.log(fails.length ? 'ONLINE TEST FAILED' : 'ONLINE TEST PASSED'); process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
