#!/usr/bin/env node
// Render the README banners (light and dark) with headless Chromium, from the brand repo's own
// tokens, fonts, chrome stills and the Brain sign. Same layout as the Flow banner.
//
//   IONIAN_BRAND=../brand PLAYWRIGHT_DIR=/path/to/folder node scripts/make-banner.mjs
//
// IONIAN_BRAND defaults to ../brand. PLAYWRIGHT_DIR is a folder that has playwright installed
// (`npm i playwright`, plus `npx playwright install chromium` if no browser is cached). It
// defaults to the current folder. This is a maintainer tool: the CLI and the plugin never need it.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRAND = path.resolve(process.env.IONIAN_BRAND || path.join(HERE, '..', '..', 'brand'));
const OUT = path.join(HERE, '..', 'docs', 'images');
const { chromium } = createRequire(path.join(path.resolve(process.env.PLAYWRIGHT_DIR || '.'), 'x.js'))('playwright');
const url = (p) => pathToFileURL(path.join(BRAND, p)).href;
const sign = fs.readFileSync(path.join(BRAND, 'assets', 'signs', 'brain.svg'), 'utf8').replace(/ width="300" height="300"/, '');

const TITLE = 'One memory. Every agent.';
const LINE = 'A markdown folder your agents read at the start and write at the end.';

const html = (dark) => `<!doctype html>
<html data-theme="${dark ? 'dark' : 'light'}"><head><meta charset="utf-8">
<link rel="stylesheet" href="${url('dist/tokens.css')}">
<link rel="stylesheet" href="${url('assets/fonts/fonts.css')}">
<style>
  *{box-sizing:border-box;margin:0}
  html,body{width:2000px;height:625px;overflow:hidden}
  body{position:relative;background:var(--bg) url(${url(dark ? 'assets/chrome/night.jpg' : 'assets/chrome/breeze.jpg')}) center 60%/cover no-repeat;color:var(--ink);font-family:var(--font-sans)}
  /* CHR-05: solid for the top 40%, clear by about 78% */
  body::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgb(var(--fade)) 0%,rgb(var(--fade)) 40%,rgba(var(--fade),.86) 52%,rgba(var(--fade),.3) 66%,rgba(var(--fade),0) 78%)}
  .appicon{--s:132px;position:absolute;left:120px;top:104px;width:var(--s);height:var(--s);display:grid;place-items:center;border-radius:calc(var(--s)*.234);background:var(--night) url(${url('assets/chrome/tile-brain.jpg')}) center/cover no-repeat;box-shadow:var(--shadow-icon)}
  .appicon svg{width:72.6%;height:72.6%;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.55))}
  .text{position:absolute;left:300px;top:92px}
  h1{font-family:var(--font-display);font-weight:600;font-size:112px;line-height:.96;letter-spacing:-.045em}
  p{margin-top:24px;font-size:30px;line-height:1.55;color:var(--muted)}
  .brand{position:absolute;right:120px;top:104px;display:flex;align-items:center;gap:11px;font-family:var(--t-wordmark-family);font-weight:600;font-size:var(--t-wordmark-size);letter-spacing:var(--t-wordmark-tracking)}
  .brand .appicon{position:static;--s:38px;box-shadow:var(--shadow-icon)}
  .brand i{font-style:normal;font-weight:500;color:var(--faint)}
</style></head><body>
  <div class="appicon">${sign}</div>
  <div class="text"><h1>${TITLE}</h1><p>${LINE}</p></div>
  <div class="brand"><span class="appicon">${sign}</span><span>ionian <i>/ brain</i></span></div>
</body></html>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'banner-'));
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2000, height: 625 } });
for (const dark of [false, true]) {
  const file = path.join(dir, dark ? 'dark.html' : 'light.html');
  fs.writeFileSync(file, html(dark));
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, dark ? 'banner-dark.png' : 'banner.png') });
}
await browser.close();
process.stdout.write(`Wrote ${path.join('docs', 'images', 'banner.png')} and banner-dark.png\n`);
