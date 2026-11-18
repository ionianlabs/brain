// The status fixture brain (docs/designs/outbox-status.md, "Fixture seed"): entries, bullets, packages and RUN.md sections.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { BIN, FIXTURES } from './helpers.mjs';
import { parseFrontmatter } from '../src/frontmatter.mjs';

const DIR = path.join(FIXTURES, 'outbox-status-brain');
const run = (...args) => spawnSync('node', [BIN, ...args], { encoding: 'utf8' });
const read = (rel) => fs.readFileSync(path.join(DIR, rel), 'utf8');
const fm = (rel) => parseFrontmatter(read(rel)).data;

function filesUnder(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...filesUnder(p));
    else out.push(p);
  }
  return out;
}

const STATUS_IDS = [
  ...Array.from({ length: 20 }, (_, i) => `F1.${i + 1}`),
  ...Array.from({ length: 13 }, (_, i) => `F2.${i + 1}`),
  ...Array.from({ length: 11 }, (_, i) => `F3.${i + 1}`),
  ...Array.from({ length: 6 }, (_, i) => `F4.${i + 1}`),
];

test('status fixture lints clean and its index is current', () => {
  assert.ok(fs.existsSync(path.join(DIR, 'index.md')));
  const l = run('lint', DIR, '--today', '2026-11-18');
  assert.equal(l.status, 0, l.stdout + l.stderr);
  const r = run('index', '--check', DIR);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('status RUN.md has a section for every scenario, asks for results first, resets first', () => {
  const runmd = read('RUN.md');
  assert.match(runmd, /Produce each result before reading its expected result\./);
  for (const id of STATUS_IDS) {
    assert.ok(new RegExp(`^## status ${id.replace('.', '\\.')}\\b`, 'm').test(runmd), `status ${id} section`);
  }
  assert.ok(runmd.indexOf('git clean') > 0 && runmd.indexOf('git clean') < runmd.indexOf('## status F1.1'), 'reset at the top');
  const head = '## Reference results (read only after your own run)';
  if (runmd.includes(head)) assert.ok(!runmd.slice(runmd.indexOf(head) + head.length).includes('\n## '), 'it is the last section');
});

test('status RUN.md lists the scenario ids of the spec file', () => {
  const spec = fs.readFileSync(path.join(DIR, '../../../docs/designs/outbox-status.md'), 'utf8');
  const ids = [...spec.matchAll(/^- (F\d\.\d+) /gm)].map((m) => m[1]);
  assert.deepEqual(ids.sort(), [...STATUS_IDS].sort());
});

const manifestRows = () => read('outbox/team/manifest.md').split('\n')
  .filter((l) => /^\| \d+ /.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));

test('status the manifest holds entries 1 to 5 of the existing fixture and the seeded entries 6 to 13', () => {
  const want = [
    ['1', 'Book rehearsal room', '2026-11-10-launch-update.md', 'approved', '2026-11-10', ''],
    ['2', 'Kickoff on 2026-01-12', '2026-11-10-launch-update.md', 'published', '2026-11-10', 'ref-0002'],
    ['3', 'Training starts 2026-01-19', '2026-11-10-launch-update.md', 'published', '2026-11-10', 'ref-0003'],
    ['4', 'Retro date', '2026-11-10-launch-update.md', 'withdrawn', '2026-11-10', ''],
    ['5', 'Dry run planned for 2026-02-20', '2026-11-10-launch-update.md', 'draft', '2026-11-10', ''],
    ['6', 'Send test plan', '2026-11-12-launch-followup.md', 'published', '2026-11-12', 'ref-0006'],
    ['7', 'Update rollout checklist', '2026-11-12-launch-followup.md', 'published', '2026-11-12', 'ref-0007'],
    ['8', 'Go-live 2026-03-10', '2026-11-12-launch-followup.md', 'published', '2026-11-12', 'ref-0008'],
    ['9', 'Who signs off the test plan', '2026-11-12-launch-followup.md', 'published', '2026-11-12', 'ref-0009'],
    ['10', 'Scope frozen from 2026-02-01', '2026-11-12-launch-followup.md', 'published', '2026-11-12', 'ref-0010'],
    ['11', 'Cycle length is 2 weeks', '2026-11-12-launch-followup.md', 'published', '2026-11-12', 'ref-0011'],
    ['12', 'Status: #2 done', '2026-11-15-launch-status.md', 'published', '2026-11-15', 'ref-0012'],
    ['13', 'Share demo script', '2026-11-12-launch-followup.md', 'approved', '2026-11-12', ''],
  ];
  assert.deepEqual(manifestRows(), want);
});

test('status every published row has a shared-with bullet, #3 has none', () => {
  const log = read('logs/launch.md');
  const covered = new Set();
  for (const m of log.matchAll(/^- Done: shared with team: ([^()]+) \(/gm)) {
    for (const part of m[1].split(',')) {
      const [a, b] = part.trim().split('-').map((x) => Number(x.replace('#', '')));
      for (let i = a; i <= (b ?? a); i++) covered.add(i);
    }
  }
  for (const r of manifestRows()) {
    const id = Number(r[0]);
    if (r[3] !== 'published') continue;
    assert.equal(covered.has(id), id !== 3, `row ${id}`);
  }
  assert.ok(covered.has(13), 'approved #13 is named too');
  assert.match(log, /^## 2026-11-15\n\n- Done: shared with team: #12 \(2026-11-15-launch-status\.md\) from \/projects\/launch\.md$/m);
  assert.match(log, /^## 2026-11-12\n\n- Done: shared with team: #6-#11, #13 \(2026-11-12-launch-followup\.md\) from \/projects\/launch\.md$/m);
  for (const b of ['Done: Sam sent the test plan (Launch sync 2026-11-17)', 'Done: Sam shared the demo script (Launch sync 2026-11-17)', 'Done: kickoff held (Launch sync 2026-11-14)']) {
    assert.ok(log.includes(`- ${b}`), b);
  }
  const heads = [...log.matchAll(/^## (\d{4}-\d{2}-\d{2})$/gm)].map((m) => m[1]);
  assert.deepEqual(heads, [...heads].sort().reverse(), 'newest first');
});

test('status the seeded packages hold the lines of the spec, Status in its place', () => {
  const pkg = read('outbox/team/2026-11-12-launch-followup.md');
  assert.equal(fm('outbox/team/2026-11-12-launch-followup.md').audience, 'team');
  assert.match(pkg, /^approved: 2026-11-12$/m);
  assert.match(pkg, /^source_refs: \[Launch sync 2026-11-12\]$/m);
  for (const l of [
    '#10 Scope frozen from 2026-02-01 (Launch sync 2026-11-12)',
    '#6 Send test plan | Sam Lee | 2026-11-20 | Launch sync 2026-11-12',
    '#7 Update rollout checklist | Lea Park | 2026-11-20 | Launch sync 2026-11-12',
    '#13 Share demo script | Sam Lee | 2026-11-27 | Launch sync 2026-11-12',
    '#8 Go-live 2026-03-10 (Launch sync 2026-11-12)',
    '#11 Cycle length is 2 weeks (Launch sync 2026-11-12)',
    '#9 Who signs off the test plan (Launch sync 2026-11-12)',
  ]) assert.ok(pkg.includes(`- ${l}\n`), l);
  assert.deepEqual([...pkg.matchAll(/^## (.+)$/gm)].map((m) => m[1]), ['Decisions', 'Actions', 'Dates', 'Context', 'Open questions']);
  const st = read('outbox/team/2026-11-15-launch-status.md');
  assert.match(st, /^approved: 2026-11-15$/m);
  assert.deepEqual([...st.matchAll(/^## (.+)$/gm)].map((m) => m[1]), ['Status']);
  assert.ok(st.includes('- #12 Status: #2 Kickoff on 2026-01-12 | done | Launch sync 2026-11-14'));
  const first = read('outbox/team/2026-11-10-launch-update.md');
  for (const t of ['#1 Book rehearsal room', '#2 Kickoff on 2026-01-12', '#3 Training starts 2026-01-19', '#5 Dry run planned for 2026-02-20']) assert.ok(first.includes(t), t);
});

test('status the outbox holds no brain file path and no blocked term; AGENTS.md blocks Zeta Corp', () => {
  const files = filesUnder(path.join(DIR, 'outbox')).filter((f) => f.endsWith('.md'));
  assert.ok(files.length >= 5, 'outbox has files to scan');
  const paths = /(^|[^\w])(projects|logs|knowledge|people|inbox)\/|\.confidential\//;
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    assert.ok(!paths.test(text), `${f} holds a brain path`);
    assert.ok(!/zeta corp/i.test(text), `${f} holds the blocked term`);
  }
  assert.match(read('AGENTS.md'), /^## Outbox rules$[\s\S]*Blocked terms[^\n]*`Zeta Corp`/m);
});

test('status team receives the five classes and has Sam Lee and Lea Park as members', () => {
  const team = fm('outbox/team/audience.md');
  assert.deepEqual(team.brain.receives, ['decisions', 'dates', 'actions', 'open-questions', 'cadence']);
  assert.deepEqual(team.brain.members, ['sam-lee', 'lea-park']);
  assert.equal(team.brain.org, 'acme');
  for (const p of ['sam-lee', 'lea-park']) assert.ok(fm(`people/${p}.md`).role, `${p} has a role`);
  assert.match(read('projects/launch.md'), /^History: \[log\]\(\/logs\/launch\.md\)$/m);
});
