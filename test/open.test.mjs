import test from 'node:test';
import assert from 'node:assert/strict';
import { openItems, formatOpen } from '../src/open.mjs';
import { tmpDir, writeTree } from './helpers.mjs';

const TODAY_ = '2026-11-08';

function project(org, phase, items) {
  return `---\ntype: project\ndescription: Demo.\ntags: [demo]\norg: ${org}\nupdated: 2026-11-08\nphase: ${phase}\nfocus: Demo.\n---\n\n# Demo\n\n## Now\n\n- Going.\n\n## Open\n\n${items.join('\n')}\n`;
}

function brainWith(files) {
  const root = tmpDir();
  writeTree(root, Object.fromEntries(Object.entries(files).map(([slug, text]) => [`projects/${slug}.md`, text])));
  return root;
}

const twoProjects = () => brainWith({
  rover: project('client-a', 'active', ['- [ ] Ship beta (prio: p0, due: 2026-12-01)']),
  atlas: project('client-b', 'active', ['- [ ] Call Sam (prio: p1)']),
});

test('F3.1 ranks across projects and summarises', () => {
  const r = openItems(twoProjects(), { today: TODAY_ });
  assert.equal(formatOpen(r), [
    'p0  2026-12-01  rover  Ship beta',
    'p1  -  atlas  Call Sam',
    '2 items: 1 p0, 1 p1, 0 p2, 0 unranked; 1 without due date',
  ].join('\n'));
});

test('F3.2 --project filters to one project', () => {
  const r = openItems(twoProjects(), { project: 'atlas', today: TODAY_ });
  assert.equal(formatOpen(r), 'p1  -  atlas  Call Sam\n1 items: 0 p0, 1 p1, 0 p2, 0 unranked; 1 without due date');
});

test('org filter matches the org key and an unknown value yields zero items', () => {
  assert.equal(openItems(twoProjects(), { org: 'client-b' }).items.length, 1);
  assert.equal(openItems(twoProjects(), { org: 'nope' }).summary.total, 0);
  assert.equal(openItems(twoProjects(), { project: 'nope' }).summary.total, 0);
});

test('F3.3 --due-within keeps near and overdue items', () => {
  const root = brainWith({
    rover: project('client-a', 'active', [
      '- [ ] Near (due: 2026-11-11)',
      '- [ ] Far (due: 2026-11-20)',
      '- [ ] Late (due: 2026-11-06)',
      '- [ ] Edge (due: 2026-11-15)',
      '- [ ] Open ended',
      '- [ ] Broken (due: 2026-13-40)',
    ]),
  });
  const r = openItems(root, { dueWithin: 7, today: TODAY_ });
  assert.deepEqual(r.items.map((i) => i.text), ['Late', 'Near', 'Edge']);
  assert.equal(r.summary.withoutDue, 0);
});

test('F3.4 a brain with no projects prints the full summary', () => {
  const r = openItems(tmpDir(), { today: TODAY_ });
  assert.equal(formatOpen(r), '0 items: 0 p0, 0 p1, 0 p2, 0 unranked; 0 without due date');
});

test('sorts by prio, then due, then project, and treats invalid values as absent', () => {
  const root = brainWith({
    rover: project('client-a', 'active', [
      '- [ ] R1 (due: 2026-11-20)',
      '- [ ] R2 (prio: p2, due: 2026-11-09)',
      '- [ ] R3 (prio: high, due: 2026-11-01)',
      '- [ ] R4 (prio: p1, due: 2026-13-40)',
    ]),
    atlas: project('client-a', 'paused', ['- [ ] A1 (prio: p1)', '- [ ] A2 (due: 2026-11-20)']),
  });
  const r = openItems(root, { today: TODAY_ });
  assert.deepEqual(r.items.map((i) => i.text), ['A1', 'R4', 'R2', 'R3', 'A2', 'R1']);
  assert.deepEqual(r.items.find((i) => i.text === 'R4'), {
    project: 'rover', org: 'client-a', text: 'R4', prio: 'p1', owner: null, due: null, blocked: null, line: 22,
  });
  assert.deepEqual(r.summary, { total: 6, p0: 0, p1: 2, p2: 1, unranked: 3, withoutDue: 2 });
});

test('skips done and phase-less projects and shows owner and blocked', () => {
  const root = brainWith({
    rover: project('client-a', 'done', ['- [ ] Old']),
    atlas: project('client-a', 'active', ['- [ ] Wait (owner: Ada, blocked: waiting for review, then deploy)', '- [ ] Draft (see note)']),
    ghost: '# No frontmatter\n\n## Open\n\n- [ ] Hidden\n',
  });
  const r = openItems(root, { today: TODAY_ });
  assert.equal(formatOpen(r), [
    '-  -  atlas  Wait (owner: Ada, blocked: waiting for review, then deploy)',
    '-  -  atlas  Draft (see note)',
    '2 items: 0 p0, 0 p1, 0 p2, 2 unranked; 2 without due date',
  ].join('\n'));
});
