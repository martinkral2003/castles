// What is each research card worth? Two identical Balanced bots (no research of their own); one starts with STACKS of the card.
// Win rate of the carded bot over N duels (unfinished games count half). All cards should land in a similar band:
//   node tests/research-value.cjs [core.js]      env: N (duels per card, default 40), STACKS (default 2), ONLY=key,key
const cp = require('child_process'), os = require('os');
const H = require(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '../src/core.js');
const N = +(process.env.N || 40), STACKS = +(process.env.STACKS || 2);
function duel(key) {
  let w = 0, l = 0, u = 0;
  for (let k = 0; k < N; k++) {
    const slots = []; for (let i = 0; i < 8; i++) slots.push({ k: 'x' }); const sw = k % 2;
    const A = { k: 'b', n: 'A', t: 0, d: 2, pe: 0, noRes: true, cards: key ? { [key]: Math.min(STACKS, H.CARDS[H.CARD_ID[key]].max) } : undefined };
    slots[sw] = A; slots[1 - sw] = { k: 'b', n: 'B', t: 0, d: 2, pe: 0, noRes: true };
    const G = H.newGame({ seed: 7700 + k * 41, slots, W: 1000, H: 1600, ms: k % 3, sp: 1, mt: k % 4 });
    let t = 0; while (!G.over && t < 1800) { H.step(G, 0.05); t += 0.05; G.events.length = 0; }
    if (!G.over) u++; else if (G.winner === 'S' + sw) w++; else l++;
  }
  return { w, l, u, rate: (w + u / 2) / N };
}
if (process.argv.includes('--card')) { const key = process.argv[process.argv.indexOf('--card') + 1]; process.send ? process.send(duel(key === 'none' ? null : key)) : console.log(JSON.stringify(duel(key))); process.exit(0); }
const keys = (process.env.ONLY ? process.env.ONLY.split(',') : ['none', ...H.CARDS.map(c => c.key)]);
const res = {}, queue = [...keys]; let running = 0;
function next() {
  while (running < Math.max(1, os.cpus().length - 1) && queue.length) {
    const key = queue.shift(); running++;
    const ch = cp.fork(__filename, [process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '', '--card', key].filter(Boolean), { env: process.env });
    ch.on('message', m => { res[key] = m; }); ch.on('exit', () => { running--; if (!queue.length && !running) report(); else next(); });
  }
}
function report() {
  console.log(`win rate of a bot that starts with ${STACKS} stacks of a card (max where the card has fewer), ${N} duels each, 50% = no effect:`);
  const none = res.none ? res.none.rate : .5;
  for (const k of keys) { const r = res[k]; if (!r) continue; const c = k === 'none' ? { name: '(no card: control)', desc: '' } : H.CARDS[H.CARD_ID[k]];
    console.log((100 * r.rate).toFixed(0).padStart(4) + '%', (r.w + '-' + r.l + (r.u ? ' (' + r.u + ' unf)' : '')).padEnd(14), (k === 'none' ? '' : k.padEnd(7)) + c.name.padEnd(20), c.desc); }
  void none;
}
next();
