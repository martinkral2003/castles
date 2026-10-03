// Two-page peer-to-peer test: host invites, friend replies, battle starts, the friend's command reaches the host.
//   node tools/p2p-test.cjs <built index.html> [outdir]      (needs Playwright, see tools/shot.cjs)
const fs = require('fs'), path = require('path');
let pw = null;
for (const c of [process.env.PLAYWRIGHT_DIR, '/home/martin/getsociableapp/node_modules/playwright', 'playwright'].filter(Boolean)) { try { pw = require(c); break; } catch (e) { /* next */ } }
if (!pw) { console.error('Playwright not found; set PLAYWRIGHT_DIR'); process.exit(2); }
const file = process.argv[2], out = process.argv[3];
if (!file) { console.error('usage: node tools/p2p-test.cjs <index.html> [outdir]'); process.exit(1); }
const fails = [], errors = [];
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) fails.push(msg); };
(async () => {
  const browser = await pw.chromium.launch();
  const mk = async (name) => { const ctx = await browser.newContext({ viewport: { width: 420, height: 900 } }); const page = await ctx.newPage();
    page.on('pageerror', e => { errors.push(name + ': ' + e.message); console.log('[pageerror ' + name + ']', e.message); });
    page.on('console', m => { if (m.type() === 'error') { errors.push(name + ': ' + m.text()); console.log('[console.error ' + name + ']', m.text()); } });
    await page.goto('file://' + path.resolve(file)); await page.waitForTimeout(400); return page; };
  const A = await mk('host'), B = await mk('guest');
  await B.evaluate(() => { document.getElementById('name').value = 'Guest'; document.getElementById('name').dispatchEvent(new Event('input')); });
  check(await A.evaluate(() => !document.getElementById('b-host').disabled), 'host button is enabled without a room API');
  await A.click('#b-host'); await A.waitForTimeout(300);
  await A.click('#b-invite'); await A.waitForSelector('#p2p-list textarea', { timeout: 15000 });
  const invite = await A.inputValue('#p2p-list textarea');
  check(invite.length > 100 && invite.length < 6000, 'invite code made (' + invite.length + ' chars)');
  await B.click('#b-join'); await B.waitForTimeout(200);
  await B.fill('#p2p-in', invite); await B.click('#b-p2p-join');
  await B.waitForFunction(() => document.getElementById('p2p-out').value.length > 50, null, { timeout: 15000 });
  const reply = await B.inputValue('#p2p-out');
  check(reply.length > 100, 'reply code made (' + reply.length + ' chars)');
  await A.fill('#p2p-list [data-reply]', reply); await A.click('#p2p-list [data-go]');
  await A.waitForFunction(() => /Connected/.test(document.querySelector('#p2p-list [data-st]').textContent), null, { timeout: 20000 });
  check(true, 'host sees the connection');
  await B.waitForFunction(() => document.getElementById('s-wait').classList.contains('on'), null, { timeout: 15000 });
  check(true, 'guest reaches the lobby');
  await A.waitForFunction(() => CFG.slots.some((s, i) => i > 0 && s.k === 'h'), null, { timeout: 10000 });
  check(await A.evaluate(() => CFG.slots.find((s, i) => i > 0 && s.k === 'h').n === 'Guest'), 'guest takes a slot with their name');
  await A.click('#b-start'); await A.waitForTimeout(2500);
  await B.waitForFunction(() => !!G && Array.isArray(G.castles) && G.castles.length > 3, null, { timeout: 15000 });
  const my = await B.evaluate(() => mySlot);
  check(my > 0, 'guest got a player slot (' + my + ')');
  await B.waitForTimeout(1500);
  check(await B.evaluate(() => G.castles.some(c => c.owner === mySlot) && G.sol.length + (G.csol ? G.csol.length : 0) >= 0), 'guest sees the host\'s world');
  // the guest's command reaches the host simulation
  const ci = await B.evaluate(() => G.home[mySlot]);
  await B.evaluate(ci => { issue(4, ci, 1); }, ci);
  await A.waitForFunction(ci => G.castles[ci].mode === 1, ci, { timeout: 8000 }).then(() => check(true, 'a guest command (Souls mode) runs on the host'), () => check(false, 'a guest command (Souls mode) runs on the host'));
  await B.waitForTimeout(1500);
  check(await B.evaluate(ci => G.castles[ci].mode === 1, ci), 'the change comes back to the guest in a snapshot');
  await A.evaluate(() => { for (let i = 0; i < 100; i++) { } }); await B.waitForTimeout(3000);
  check(await B.evaluate(() => G.time > 3), 'guest clock advances');
  if (out) { fs.mkdirSync(out, { recursive: true }); await A.screenshot({ path: path.join(out, 'p2p-host.png') }); await B.screenshot({ path: path.join(out, 'p2p-guest.png') }); }
  await browser.close();
  check(errors.length === 0, 'no console/page errors (' + errors.length + ')');
  console.log(fails.length ? 'P2P TEST FAILED' : 'P2P TEST PASSED'); process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
