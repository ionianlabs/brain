// Build and write the generated block in index.md (spec section 10) and the
// notes map in each project file (spec section 4.1).

import fs from 'node:fs';
import path from 'node:path';
import { loadBrain, firstHeading } from './notes.mjs';

export const START = '<!-- brain:index start -->';
export const END = '<!-- brain:index end -->';
export const NOTES_START = '<!-- brain:notes start -->';
export const NOTES_END = '<!-- brain:notes end -->';
const NOTES_LABEL = 'Notes (open one only when the task needs it):';

const PHASES = [
  ['active', 'Active'],
  ['paused', 'Paused'],
  ['done', 'Done'],
];

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function titleOf(file) {
  return firstHeading(file.fm.bodyLines) || file.slug;
}

function entry(file, noteCount = 0) {
  const d = file.fm.data;
  const org = str(d.org) || 'unknown';
  const updated = str(d.updated) || 'unknown';
  const count = noteCount ? `, ${noteCount} note${noteCount === 1 ? '' : 's'}` : '';
  const line = `- [${titleOf(file)}](/${file.rel}): ${str(d.description)} (${org}, updated ${updated}${count})`;
  return { line, updated: str(d.updated), slug: file.slug };
}

// Knowledge notes per project slug, sorted by slug. A note belongs to a project
// when its `project` key names an existing projects/<slug>.md in the same org,
// or one side is personal. Other notes stay under ## Knowledge in the index.
export function notesByProject(brain) {
  const orgs = new Map(brain.files.filter((f) => f.folder === 'projects').map((f) => [f.slug, str(f.fm.data.org)]));
  const fits = (a, b) => a === b || a === 'personal' || b === 'personal';
  const map = new Map();
  for (const f of brain.files) {
    if (f.folder !== 'knowledge') continue;
    const slug = str(f.fm.data.project);
    if (!orgs.has(slug) || !fits(str(f.fm.data.org), orgs.get(slug))) continue;
    if (!map.has(slug)) map.set(slug, []);
    map.get(slug).push(f);
  }
  for (const list of map.values()) list.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  return map;
}

// Newest first, then slug ascending.
function byUpdated(a, b) {
  if (a.updated !== b.updated) return a.updated < b.updated ? 1 : -1;
  return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
}

// The full block as an array of lines, markers included.
export function buildBlock(brain) {
  const sections = [];
  const byProject = notesByProject(brain);
  const scoped = new Set([...byProject.values()].flat());
  const projects = brain.files.filter((f) => f.folder === 'projects');
  for (const [phase, heading] of PHASES) {
    const items = projects
      .filter((f) => str(f.fm.data.phase) === phase)
      .map((f) => entry(f, byProject.get(f.slug)?.length || 0))
      .sort(byUpdated);
    if (items.length) sections.push([`## ${heading}`, '', ...items.map((i) => i.line)]);
  }
  const notes = brain.files
    .filter((f) => f.folder === 'knowledge' && !scoped.has(f))
    .map((f) => entry(f))
    .sort(byUpdated);
  if (notes.length) sections.push(['## Knowledge', '', ...notes.map((i) => i.line)]);

  const lines = [START];
  sections.forEach((s, i) => {
    if (i > 0) lines.push('');
    lines.push(...s);
  });
  lines.push(END);
  return lines;
}

function findMarkers(lines, open = START, close = END) {
  const start = lines.findIndex((l) => l.trim() === open);
  if (start < 0) return null;
  const end = lines.findIndex((l, i) => i > start && l.trim() === close);
  return end < 0 ? null : { start, end };
}

const sameLines = (a, b) => a.length === b.length && a.every((l, i) => l.trimEnd() === b[i]);

// The notes map of one project as lines, markers included. Empty when it has no notes.
export function buildNotesBlock(notes) {
  if (!notes.length) return [NOTES_START, NOTES_END];
  const lines = notes.map((f) => `- [${titleOf(f)}](/${f.rel}): ${str(f.fm.data.description)}`);
  return [NOTES_START, NOTES_LABEL, '', ...lines, NOTES_END];
}

// The project file text with its notes map up to date. Returns null when the
// file needs no change: the map is current, or there are no notes and no markers.
function projectText(file, notes) {
  const lines = file.text.replace(/\r\n?/g, '\n').split('\n');
  const block = buildNotesBlock(notes);
  const found = findMarkers(lines, NOTES_START, NOTES_END);
  if (found) {
    if (sameLines(lines.slice(found.start, found.end + 1), block)) return null;
    return [...lines.slice(0, found.start), ...block, ...lines.slice(found.end + 1)].join('\n');
  }
  if (!notes.length) return null;
  // Insert before the first ## heading of the body, outside code fences, else at the end.
  let at = lines.length;
  let fence = false;
  for (const { line, text } of file.fm.bodyLines) {
    if (/^\s*(```|~~~)/.test(text)) fence = !fence;
    else if (!fence && /^## /.test(text)) { at = line - 1; break; }
  }
  const before = lines.slice(0, at);
  while (before.length && before[before.length - 1].trim() === '') before.pop();
  const after = lines.slice(at);
  const out = [...before, '', ...block];
  if (after.length) out.push('', ...after);
  else out.push('');
  return out.join('\n');
}

// Project files whose notes map is out of date, as [{ rel, text, line }].
// `line` is the 1-based line of the start marker, or 1 if there is none.
export function computeProjectNotes(brain) {
  const byProject = notesByProject(brain);
  const out = [];
  for (const f of brain.files.filter((x) => x.folder === 'projects')) {
    const text = projectText(f, byProject.get(f.slug) || []);
    if (text === null) continue;
    const idx = f.text.replace(/\r\n?/g, '\n').split('\n').findIndex((l) => l.trim() === NOTES_START);
    out.push({ rel: f.rel, text, line: idx >= 0 ? idx + 1 : 1 });
  }
  return out;
}

function newIndexText(block) {
  return ['---', 'okf_version: "0.2"', '---', '', '# Index', '', ...block, ''].join('\n');
}

// Work out what `brain index` would write.
// Returns { text, status, current, projects } where status is
// 'missing', 'no-markers', 'differs' or 'ok' for index.md, and projects lists
// the project files whose notes map is out of date (see computeProjectNotes).
export function computeIndex(root) {
  const brain = loadBrain(root);
  const projects = computeProjectNotes(brain);
  const block = buildBlock(brain);
  const file = path.join(root, 'index.md');
  if (!fs.existsSync(file)) {
    return { text: newIndexText(block), status: 'missing', current: null, projects };
  }
  const current = fs.readFileSync(file, 'utf8');
  const lines = current.replace(/\r\n?/g, '\n').split('\n');
  const found = findMarkers(lines);
  if (!found) {
    const kept = current.replace(/\r\n?/g, '\n').replace(/\s+$/, '');
    const text = `${kept}${kept ? '\n\n' : ''}${block.join('\n')}\n`;
    return { text, status: 'no-markers', current, projects };
  }
  const same = sameLines(lines.slice(found.start, found.end + 1), block);
  const out = [...lines.slice(0, found.start), ...block, ...lines.slice(found.end + 1)];
  return { text: out.join('\n'), status: same ? 'ok' : 'differs', current, projects };
}

// Write index.md and the notes maps. Returns { status, projects } where status
// uses the same values as computeIndex and projects lists the project files written.
export function writeIndex(root) {
  const { text, status, projects } = computeIndex(root);
  if (status !== 'ok') fs.writeFileSync(path.join(root, 'index.md'), text);
  for (const p of projects) fs.writeFileSync(path.join(root, p.rel), p.text);
  return { status, projects: projects.map((p) => p.rel) };
}
