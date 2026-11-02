// Build and write the generated block in index.md (spec section 10).

import fs from 'node:fs';
import path from 'node:path';
import { loadBrain, firstHeading } from './notes.mjs';

export const START = '<!-- brain:index start -->';
export const END = '<!-- brain:index end -->';

const PHASES = [
  ['active', 'Active'],
  ['paused', 'Paused'],
  ['done', 'Done'],
];

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function entry(file) {
  const d = file.fm.data;
  const title = firstHeading(file.fm.bodyLines) || file.slug;
  const org = str(d.org) || 'unknown';
  const updated = str(d.updated) || 'unknown';
  const line = `- [${title}](/${file.rel}): ${str(d.description)} (${org}, updated ${updated})`;
  return { line, updated: str(d.updated), slug: file.slug };
}

// Newest first, then slug ascending.
function byUpdated(a, b) {
  if (a.updated !== b.updated) return a.updated < b.updated ? 1 : -1;
  return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
}

// The full block as an array of lines, markers included.
export function buildBlock(brain) {
  const sections = [];
  const projects = brain.files.filter((f) => f.folder === 'projects');
  for (const [phase, heading] of PHASES) {
    const items = projects.filter((f) => str(f.fm.data.phase) === phase).map(entry).sort(byUpdated);
    if (items.length) sections.push([`## ${heading}`, '', ...items.map((i) => i.line)]);
  }
  const notes = brain.files.filter((f) => f.folder === 'knowledge').map(entry).sort(byUpdated);
  if (notes.length) sections.push(['## Knowledge', '', ...notes.map((i) => i.line)]);

  const lines = [START];
  sections.forEach((s, i) => {
    if (i > 0) lines.push('');
    lines.push(...s);
  });
  lines.push(END);
  return lines;
}

function findMarkers(lines) {
  const start = lines.findIndex((l) => l.trim() === START);
  if (start < 0) return null;
  const end = lines.findIndex((l, i) => i > start && l.trim() === END);
  return end < 0 ? null : { start, end };
}

function newIndexText(block) {
  return ['---', 'okf_version: "0.2"', '---', '', '# Index', '', ...block, ''].join('\n');
}

// Work out the index.md text that `brain index` would write.
// Returns { text, status, current } where status is
// 'missing', 'no-markers', 'differs' or 'ok'.
export function computeIndex(root) {
  const block = buildBlock(loadBrain(root));
  const file = path.join(root, 'index.md');
  if (!fs.existsSync(file)) {
    return { text: newIndexText(block), status: 'missing', current: null };
  }
  const current = fs.readFileSync(file, 'utf8');
  const lines = current.replace(/\r\n?/g, '\n').split('\n');
  const found = findMarkers(lines);
  if (!found) {
    const kept = current.replace(/\r\n?/g, '\n').replace(/\s+$/, '');
    const text = `${kept}${kept ? '\n\n' : ''}${block.join('\n')}\n`;
    return { text, status: 'no-markers', current };
  }
  const old = lines.slice(found.start, found.end + 1).map((l) => l.trimEnd());
  const same = old.length === block.length && old.every((l, i) => l === block[i]);
  const out = [...lines.slice(0, found.start), ...block, ...lines.slice(found.end + 1)];
  return { text: out.join('\n'), status: same ? 'ok' : 'differs', current };
}

// Write index.md. Returns { status } using the same values as computeIndex.
export function writeIndex(root) {
  const { text, status } = computeIndex(root);
  if (status !== 'ok') fs.writeFileSync(path.join(root, 'index.md'), text);
  return { status };
}
