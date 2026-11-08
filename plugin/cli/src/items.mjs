// Parse open items and provenance prefixes (spec sections 4 and 5).

import { isValidDate } from './dates.mjs';
import { NOTES_START, NOTES_END } from './index.mjs';

export const PRIOS = ['p0', 'p1', 'p2'];
export const ITEM_KEYS = ['prio', 'owner', 'due', 'blocked'];
export const PREFIXES = ['Done', 'Decision', 'Said', 'Inferred'];

const ITEM_RE = /^\s*- \[ \] ?(.*)$/;
const GROUP_RE = /\(([^()]*)\)\s*$/;
const PREFIX_RE = /^(Done|Decision|Said|Inferred)(?:\(([^)]*)\))?:/;

// The text of an open item and its raw key: value fields in order, or null for a non-item line.
export function splitOpenItem(line) {
  const m = ITEM_RE.exec(line);
  if (!m) return null;
  const rest = m[1];
  const g = GROUP_RE.exec(rest);
  if (!g || !/^[a-z]+:/.test(g[1])) return { text: rest.trim(), fields: [] };
  const fields = g[1]
    .split(/, (?=[a-z]+:)/)
    .map((seg) => {
      const f = /^([a-z]+):\s*(.*)$/s.exec(seg);
      return { key: f[1], value: f[2].trim() };
    });
  return { text: rest.slice(0, g.index).trim(), fields };
}

// Effective value per key: the last one wins.
export function fieldMap(fields) {
  const map = new Map();
  for (const { key, value } of fields) map.set(key, value);
  return map;
}

export function parseOpenItem(line) {
  const split = splitOpenItem(line);
  if (!split) return null;
  const map = fieldMap(split.fields);
  const prio = map.get('prio');
  const due = map.get('due');
  return {
    text: split.text,
    prio: PRIOS.includes(prio) ? prio : null,
    owner: map.get('owner') || null,
    due: isValidDate(due) ? due : null,
    blocked: map.get('blocked') || null,
    raw: line,
  };
}

// The open item lines under ## Open, outside code fences and the notes map.
export function openItemLines(bodyLines) {
  const found = [];
  let section = null;
  let fence = false;
  let inMap = false;
  for (const { line, text } of bodyLines) {
    const t = text.trim();
    if (t === NOTES_START) { inMap = true; continue; }
    if (t === NOTES_END) { inMap = false; continue; }
    if (inMap) continue;
    if (/^\s*(```|~~~)/.test(text)) fence = !fence;
    else if (!fence && /^## /.test(text)) section = text.slice(3).trim();
    if (section === 'Open' && !fence && /^\s*- \[ \]/.test(text)) found.push({ line, text });
  }
  return found;
}

export function parsePrefix(line) {
  const m = PREFIX_RE.exec(line.replace(/^\s*-\s+/, ''));
  if (!m) return { prefix: null, author: null };
  const author = m[2] === undefined || m[2].trim() === '' ? null : m[2].trim();
  return { prefix: m[1], author };
}

// A problem with a prefix token (a name missing or empty parentheses), or null.
export function prefixProblem(line) {
  const m = PREFIX_RE.exec(line.replace(/^\s*-\s+/, ''));
  if (!m) return null;
  const blank = m[2] !== undefined && m[2].trim() === '';
  if (blank) return { kind: 'empty', prefix: m[1] };
  if (m[1] === 'Said' && m[2] === undefined) return { kind: 'name', prefix: 'Said' };
  return null;
}
