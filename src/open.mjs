// List open items across projects, ranked (spec section 12). Never writes files.

import { loadBrain } from './notes.mjs';
import { parseOpenItem, openItemLines, PRIOS } from './items.mjs';
import { addDays, localDate } from './dates.mjs';

const LISTED_PHASES = ['active', 'paused'];

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const rank = (prio) => (prio === null ? PRIOS.length : PRIOS.indexOf(prio));

export function openItems(root, options = {}) {
  const today = options.today || localDate();
  const limit = options.dueWithin === undefined ? null : addDays(today, options.dueWithin);
  const items = [];
  for (const f of loadBrain(root).files) {
    if (f.folder !== 'projects' || f.isReserved) continue;
    if (!LISTED_PHASES.includes(str(f.fm.data.phase))) continue;
    const org = str(f.fm.data.org) || null;
    if (options.org !== undefined && org !== options.org) continue;
    if (options.project !== undefined && f.slug !== options.project) continue;
    for (const { line, text } of openItemLines(f.fm.bodyLines)) {
      const item = parseOpenItem(text);
      if (limit !== null && (item.due === null || item.due > limit)) continue;
      items.push({
        project: f.slug,
        org,
        text: item.text,
        prio: item.prio,
        owner: item.owner,
        due: item.due,
        blocked: item.blocked,
        line,
      });
    }
  }
  items.sort((a, b) => {
    if (rank(a.prio) !== rank(b.prio)) return rank(a.prio) - rank(b.prio);
    if (a.due !== b.due) {
      if (a.due === null) return 1;
      if (b.due === null) return -1;
      return a.due < b.due ? -1 : 1;
    }
    return a.project < b.project ? -1 : a.project > b.project ? 1 : 0;
  });
  const count = (p) => items.filter((i) => i.prio === p).length;
  const summary = {
    total: items.length,
    p0: count('p0'),
    p1: count('p1'),
    p2: count('p2'),
    unranked: count(null),
    withoutDue: items.filter((i) => i.due === null).length,
  };
  return { items, summary };
}

export function formatOpen(result) {
  const lines = result.items.map((i) => {
    const extra = [i.owner && `owner: ${i.owner}`, i.blocked && `blocked: ${i.blocked}`].filter(Boolean);
    const text = extra.length ? `${i.text} (${extra.join(', ')})` : i.text;
    return [i.prio ?? '-', i.due ?? '-', i.project, text].join('  ');
  });
  const s = result.summary;
  lines.push(`${s.total} items: ${s.p0} p0, ${s.p1} p1, ${s.p2} p2, ${s.unranked} unranked; ${s.withoutDue} without due date`);
  return lines.join('\n');
}
