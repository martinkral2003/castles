// Builds the single-file game: src/* -> www/index.html (Android app) and docs/index.html (GitHub Pages)
//   node build.mjs                 build into www/ and docs/
//   node build.mjs --out <dir>     build only into <dir> (used for scratch builds while developing)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const r = f => readFileSync(new URL('./src/' + f, import.meta.url), 'utf8');
const html = r('shell.html')
  .replace('/*GAME_CSS*/', () => r('game.css'))
  .replace('<!--GAME_HTML-->', () => r('game.html'))
  .replace('/*CORE*/', () => r('core.js') + '\n' + r('art.js') + '\n' + r('units.js'))
  .replace('/*UI*/', () => r('head.js') + '\n' + r('panel.js') + '\n' + r('tail.js'));
const oi = process.argv.indexOf('--out');
const dirs = oi > 0 ? [process.argv[oi + 1]] : ['www', 'docs'];
for (const dir of dirs) { mkdirSync(dir, { recursive: true }); writeFileSync(`${dir}/index.html`, html); }
console.log(`Built ${dirs.map(d => d + '/index.html').join(' and ')} (${Math.round(html.length / 1024)} KB)`);
