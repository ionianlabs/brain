// Lint a brain folder (spec section 11). Never writes files.

import fs from 'node:fs';
import path from 'node:path';
import { loadBrain } from './notes.mjs';
import { extractLinks, resolveLink } from './links.mjs';
import { computeIndex, NOTES_START, NOTES_END } from './index.mjs';
import { isValidDate, isIsoWithOffset, daysBetween, localDate } from './dates.mjs';
import { PRIOS, ITEM_KEYS, splitOpenItem, fieldMap, openItemLines, prefixProblem } from './items.mjs';

const PHASES = ['active', 'paused', 'done'];
const STATUSES = ['draft', 'stable', 'deprecated'];
const BASE_KEYS = ['description', 'tags', 'org', 'updated'];
const EXTRA_KEYS = { project: ['phase', 'focus'], log: ['project'] };
const WORD_TARGET = 300;
const WORD_LIMIT = 400;
const OPEN_LIMIT = 15;

function isEmpty(v) {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return Object.keys(v).length === 0;
}

function text(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function tagList(v) {
  if (Array.isArray(v)) return v.filter((t) => typeof t === 'string' && t !== '');
  return typeof v === 'string' && v !== '' ? [v] : [];
}

function normalizeTag(t) {
  return t.toLowerCase().replace(/[_\s]+/g, '-').replace(/s$/, '');
}

// True when a and b differ by exactly one insertion, deletion or substitution.
function oneEdit(a, b) {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  return short.slice(i) === long.slice(i + 1);
}

function similarTags(a, b) {
  if (a === b) return false;
  if (normalizeTag(a) === normalizeTag(b)) return true;
  return a.length >= 5 && b.length >= 5 && oneEdit(a.toLowerCase(), b.toLowerCase());
}

export function lint(root, options = {}) {
  const staleDays = options.staleDays ?? 14;
  const today = options.today || localDate();
  const nowMs = options.today ? Date.parse(`${today}T00:00:00Z`) : Date.now();
  const brain = loadBrain(root);
  const findings = [];
  const add = (path_, line, severity, rule, message) =>
    findings.push({ path: path_, line, severity, rule, message });

  const orgOf = new Map();
  for (const f of brain.files) {
    const org = text(f.fm.data.org);
    if (org) orgOf.set(f.rel, org);
  }
  const projectSlugs = new Set(brain.files.filter((f) => f.folder === 'projects').map((f) => f.slug));

  for (const f of brain.files) {
    const d = f.fm.data;
    const lineOf = (key) => f.fm.keyLines[key] || 1;
    const type = text(d.type);

    if (!f.isReserved && (!f.fm.hasFrontmatter || type === '')) {
      add(f.rel, 1, 'error', 'okf/type-missing', 'file has no frontmatter or an empty type. Add frontmatter with a type, for example type: note.');
    }
    if (!f.isNote) continue;

    if (f.fm.hasFrontmatter) {
      const required = [...BASE_KEYS, ...(EXTRA_KEYS[f.expectedType] || [])];
      for (const key of required) {
        if (isEmpty(d[key])) {
          add(f.rel, lineOf(key), 'error', 'frontmatter/missing-key', `required key "${key}" is missing or empty. Add it to the frontmatter.`);
        }
      }
      checkValues(f, d, type, lineOf, add);
      checkTags(f, d, lineOf, add);
      checkStale(f, d, lineOf, add, today, staleDays, nowMs);
    }

    if (f.folder === 'projects') checkBudget(f, add);
    if (f.folder === 'projects') checkOpenItems(f, add);
    if (f.folder === 'logs') checkProvenance(f, add);
    if (f.folder === 'knowledge' || f.folder === 'logs') checkProjectKey(f, d, lineOf, add, projectSlugs, orgOf);

    checkLinks(f, text(d.org), root, orgOf, add);
  }

  const index = computeIndex(root);
  if (index.status !== 'ok') {
    add('index.md', 1, 'warning', 'index/out-of-date', 'index.md is missing or differs from `brain index` output. Run `brain index` to update it.');
  }
  for (const p of index.projects) {
    add(p.rel, p.line, 'warning', 'index/out-of-date', 'the notes map is missing or differs from `brain index` output. Run `brain index` to update it.');
  }

  findings.sort((a, b) => {
    if (a.path !== b.path) return a.path < b.path ? -1 : 1;
    if (a.line !== b.line) return a.line - b.line;
    return a.rule < b.rule ? -1 : a.rule > b.rule ? 1 : 0;
  });
  return {
    findings,
    errors: findings.filter((x) => x.severity === 'error').length,
    warnings: findings.filter((x) => x.severity === 'warning').length,
  };
}

function checkValues(f, d, type, lineOf, add) {
  const bad = (key, msg) => add(f.rel, lineOf(key), 'error', 'frontmatter/bad-value', msg);
  if (!isEmpty(d.updated) && !isValidDate(text(d.updated))) {
    bad('updated', `updated "${text(d.updated)}" is not a valid YYYY-MM-DD date. Use a date like 2026-11-02.`);
  }
  if (f.folder === 'projects' && !isEmpty(d.phase) && !PHASES.includes(text(d.phase))) {
    bad('phase', `phase "${text(d.phase)}" must be active, paused or done. Pick one of the three.`);
  }
  if (type !== '' && type !== f.expectedType) {
    bad('type', `type "${type}" does not match folder ${f.folder}/ (expected ${f.expectedType}). Change the type or move the file.`);
  }
  if (!isEmpty(d.stale_after) && !isIsoWithOffset(text(d.stale_after))) {
    bad('stale_after', `stale_after "${text(d.stale_after)}" is not ISO 8601 with a UTC offset. Use a value like 2026-12-01T00:00:00+01:00.`);
  }
  if (!isEmpty(d.status) && !STATUSES.includes(text(d.status))) {
    bad('status', `status "${text(d.status)}" must be draft, stable or deprecated. Pick one of the three.`);
  }
  if (text(d.org) === 'unknown' && f.expectedType !== 'capture') {
    bad('org', 'org "unknown" is allowed only for captures. Set the real org, or personal.');
  }
}

// Split a project body into prose words outside ## Open and the notes map,
// and the number of open items under ## Open.
export function budget(bodyLines) {
  let words = 0;
  let open = 0;
  let section = null;
  let fence = false;
  let inMap = false;
  for (const { text: line } of bodyLines) {
    const t = line.trim();
    if (t === NOTES_START) { inMap = true; continue; }
    if (t === NOTES_END) { inMap = false; continue; }
    if (inMap) continue;
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    else if (!fence && /^## /.test(line)) section = line.slice(3).trim();
    if (section === 'Open') {
      if (!fence && /^\s*- \[ \]/.test(line)) open++;
      continue;
    }
    words += line.split(/\s+/).filter(Boolean).length;
  }
  return { words, open };
}

function checkBudget(f, add) {
  const { words, open } = budget(f.fm.bodyLines);
  if (words > WORD_LIMIT) {
    add(f.rel, 1, 'warning', 'state/over-budget', `body outside ## Open has ${words} words (target ${WORD_TARGET}, limit ${WORD_LIMIT}). Move background to a knowledge note with project: ${f.slug}, and history to the log.`);
  }
  if (open > OPEN_LIMIT) {
    add(f.rel, 1, 'warning', 'state/over-budget', `## Open has ${open} items (limit ${OPEN_LIMIT}). Keep the next two weeks in Open and move later items to a plan note.`);
  }
}

function checkOpenItems(f, add) {
  for (const { line, text: raw } of openItemLines(f.fm.bodyLines)) {
    const split = splitOpenItem(raw);
    const bad = (msg) => add(f.rel, line, 'warning', 'open-item/malformed', msg);
    for (const [key, value] of fieldMap(split.fields)) {
      if (!ITEM_KEYS.includes(key)) {
        bad(`unknown key "${key}" in the item fields. Use prio, owner, due or blocked.`);
      } else if (key === 'prio' && !PRIOS.includes(value)) {
        bad(`prio "${value}" must be ${PRIOS.slice(0, -1).join(', ')} or ${PRIOS[PRIOS.length - 1]}. Use one of the three.`);
      } else if (key === 'due' && !isValidDate(value)) {
        bad(`due "${value}" must be a valid YYYY-MM-DD date. Use a date like 2026-12-01.`);
      }
    }
  }
}

// Top-level log bullets outside code fences must not carry a half-written prefix.
function checkProvenance(f, add) {
  let fence = false;
  for (const { line, text } of f.fm.bodyLines) {
    if (/^\s*(```|~~~)/.test(text)) { fence = !fence; continue; }
    if (fence || !text.startsWith('- ')) continue;
    const p = prefixProblem(text);
    if (!p) continue;
    const msg = p.kind === 'name'
      ? 'prefix Said needs the speaker in parentheses. Write it as Said(Name):.'
      : `prefix ${p.prefix} has empty parentheses. Name someone inside them or drop the parentheses.`;
    add(f.rel, line, 'warning', 'provenance/malformed', msg);
  }
}

// The project key of a knowledge note or log must name an existing project in the same org.
function checkProjectKey(f, d, lineOf, add, projectSlugs, orgOf) {
  const slug = text(d.project);
  if (!slug) return;
  if (!projectSlugs.has(slug)) {
    add(f.rel, lineOf('project'), 'warning', 'project/unknown', `project "${slug}" has no project file /projects/${slug}.md. Fix the slug or remove the key.`);
    return;
  }
  const mine = text(d.org);
  const theirs = orgOf.get(`projects/${slug}.md`);
  const neutral = (o) => !o || o === 'personal' || o === 'unknown';
  if (!neutral(mine) && !neutral(theirs) && mine !== theirs) {
    add(f.rel, lineOf('project'), 'error', 'org/cross-link', `project "${slug}" is in org ${theirs} and this note is in org ${mine}. Move the note to org ${theirs} or remove the project key.`);
  }
}

function checkTags(f, d, lineOf, add) {
  const tags = [...new Set(tagList(d.tags))];
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      if (similarTags(tags[i], tags[j])) {
        add(f.rel, lineOf('tags'), 'warning', 'tags/near-duplicate', `tags "${tags[i]}" and "${tags[j]}" look alike. Use one spelling for both.`);
      }
    }
  }
}

function checkStale(f, d, lineOf, add, today, staleDays, nowMs) {
  const updated = text(d.updated);
  if (f.folder === 'projects' && text(d.phase) === 'active' && isValidDate(updated)) {
    const age = daysBetween(updated, today);
    if (age > staleDays) {
      add(f.rel, lineOf('updated'), 'warning', 'state/stale', `active project last updated ${age} days ago (limit ${staleDays}). Review the project and update it, or set phase to paused or done.`);
    }
  }
  const staleAfter = text(d.stale_after);
  if (isIsoWithOffset(staleAfter) && Date.parse(staleAfter) < nowMs) {
    add(f.rel, lineOf('stale_after'), 'warning', 'state/stale', `stale_after ${staleAfter} has passed. Review the note, then update or remove stale_after.`);
  }
}

function checkLinks(f, org, root, orgOf, add) {
  for (const { target, line } of extractLinks(f.fm.bodyLines)) {
    const r = resolveLink(target, f.rel);
    if (r.kind === 'outside') {
      add(f.rel, line, 'warning', 'links/broken', `link ${target} points outside the brain. Fix the path or remove the link.`);
      continue;
    }
    if (r.kind !== 'local') continue;
    if (r.path === '.confidential' || r.path.startsWith('.confidential/')) {
      add(f.rel, line, 'warning', 'confidential/linked', `link ${target} points into .confidential/. Remove the link.`);
      continue;
    }
    if (!fs.existsSync(path.join(root, r.path))) {
      const logSlug = /^logs\/([a-z0-9-]+)\.md$/.exec(r.path)?.[1];
      const hint = logSlug && fs.existsSync(path.join(root, 'projects', `${logSlug}.md`))
        ? 'Create it from templates/log.md.'
        : 'Fix the path or remove the link.';
      add(f.rel, line, 'warning', 'links/broken', `link target /${r.path} does not exist. ${hint}`);
      continue;
    }
    const other = orgOf.get(r.path);
    const neutral = (o) => o === 'personal' || o === 'unknown';
    if (org && other && org !== other && !neutral(org) && !neutral(other)) {
      add(f.rel, line, 'error', 'org/cross-link', `link to /${r.path} crosses from org ${org} to org ${other}. Remove the link, or put the shared fact in a personal note and link that.`);
    }
  }
}

export function formatText(result) {
  const lines = result.findings.map((x) => `${x.path}:${x.line}  ${x.severity}  ${x.rule}  ${x.message}`);
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  lines.push(`${plural(result.errors, 'error')}, ${plural(result.warnings, 'warning')}`);
  return lines.join('\n');
}
