// Builds the single-file game: src/* -> www/index.html (Android app) and docs/index.html (GitHub Pages)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const r = f => readFileSync(new URL('./src/' + f, import.meta.url), 'utf8');
const html = r('shell.html')
  .replace('/*CORE*/', () => r('core.js') + '\n' + r('art.js'))
  .replace('/*UI*/', () => r('head.js') + r('tail.js'));
for (const dir of ['www', 'docs']) { mkdirSync(dir, { recursive: true }); writeFileSync(`${dir}/index.html`, html); }
console.log(`Built www/index.html and docs/index.html (${Math.round(html.length / 1024)} KB)`);
