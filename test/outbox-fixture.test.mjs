// The fixture brain used for the manual outbox runs (docs/designs/outbox.md, F2 and F3 Testability).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { BIN, FIXTURES } from './helpers.mjs';
import { parseFrontmatter } from '../src/frontmatter.mjs';

const DIR = path.join(FIXTURES, 'outbox-brain');
const run = (...args) => spawnSync('node', [BIN, ...args], { encoding: 'utf8' });

function filesUnder(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...filesUnder(p));
    else out.push(p);
  }
  return out;
}

test('SC5 brain lint exits 0 on the outbox fixture, with people and outbox files in it', () => {
  assert.ok(fs.existsSync(path.join(DIR, 'people/sam-lee.md')));
  assert.ok(fs.existsSync(path.join(DIR, 'outbox/team/audience.md')));
  const r = run('lint', DIR, '--today', '2026-11-11');
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('the outbox fixture index is current', () => {
  assert.ok(fs.existsSync(path.join(DIR, 'index.md')));
  const r = run('index', '--check', DIR);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('F2.21 the fixture outbox holds no brain file path and no blocked term', () => {
  const files = filesUnder(path.join(DIR, 'outbox')).filter((f) => f.endsWith('.md'));
  assert.ok(files.length >= 10, 'outbox has files to scan');
  const paths = /(^|[^\w])(projects|logs|knowledge|people|inbox)\/|\.confidential\//;
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    assert.ok(!paths.test(text), `${f} holds a brain path`);
    assert.ok(!/zeta corp/i.test(text), `${f} holds the blocked term`);
  }
  assert.match(fs.readFileSync(path.join(DIR, 'AGENTS.md'), 'utf8'), /Zeta Corp/);
});

test('the fixture seeds the manifest entries and log bullets the F3 runs need', () => {
  const manifest = fs.readFileSync(path.join(DIR, 'outbox/team/manifest.md'), 'utf8');
  const status = (s) => new RegExp(`\\|\\s*${s}\\s*\\|`).test(manifest);
  for (const s of ['approved', 'published', 'withdrawn', 'draft']) assert.ok(status(s), s);
  const log = fs.readFileSync(path.join(DIR, 'logs/launch.md'), 'utf8');
  assert.match(log, /Done: shared with team: #2 /);
  assert.ok(!/shared with team: #3\b/.test(log), 'id 3 has no bullet');
});

const read = (rel) => fs.readFileSync(path.join(DIR, rel), 'utf8');
const fm = (rel) => parseFrontmatter(read(rel)).data;
const section = (text, head) => {
  const m = text.match(new RegExp(`^## ${head}\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm'));
  const lines = m ? m[1].split('\n').filter((l) => l.startsWith('- ')) : [];
  assert.ok(lines.length > 0, `section "${head}" is empty or missing`);
  return lines;
};

test('the key seeds exist: other-org supplier, ranks, provenance bullets, roles, binaries', () => {
  assert.equal(fm('projects/supplier.md').org, 'other');
  const steering = fm('outbox/steering/audience.md');
  const team = fm('outbox/team/audience.md');
  assert.equal(steering.space, team.space);
  assert.ok(Number(steering.rank) > Number(team.rank), 'steering outranks team');
  const log = read('logs/launch.md');
  assert.match(log, /^- Inferred: /m);
  assert.match(log, /^- Said\(/m);
  assert.match(log, /^- .*Zeta Corp.*zeta corp/m);
  for (const p of ['sam-lee', 'lea-park']) assert.ok(fm(`people/${p}.md`).role, `${p} has a role`);
  assert.ok(fs.existsSync(path.join(DIR, 'knowledge/diagram.png')));
  assert.ok(fs.existsSync(path.join(DIR, '.confidential/budget.pdf')));
});

test('the launch project seeds the unsourced line, the private marker and the inferred owner', () => {
  const launch = read('projects/launch.md');
  const lines = [...section(launch, 'Now'), ...section(launch, 'Open')];
  const ref = /\([^()]+ \d{4}-\d{2}-\d{2}(; [^()]+ \d{4}-\d{2}-\d{2})*\)\.?$/;
  const unsourced = lines.filter((l) => !ref.test(l));
  assert.equal(unsourced.length, 1, `exactly one line lacks a source ref: ${unsourced.join(' / ')}`);
  assert.match(unsourced[0], /\d{4}-\d{2}-\d{2}/, 'the unsourced line would otherwise be allowed');
  assert.match(unsourced[0], /architecture review/);
  assert.ok(lines.some((l) => /between us/i.test(l)), 'private marker line');
  assert.ok(lines.some((l) => /probably Sam/.test(l)), 'inferred owner action');
  assert.ok(lines.some((l) => /Alex Moor/.test(l)), 'name without person note');
});

test('F2.3 each defect has its own audience folder in space broken', () => {
  const dir = (n) => fm(`outbox/${n}/audience.md`);
  const person = (slug) => fm(`people/${slug}.md`);
  for (const n of ['bad-slug', 'bad-org', 'bad-receives', 'bad-member', 'bad-rank', 'bad-space', 'bad-roles', 'bad-member-org', 'empty-receives']) {
    const d = dir(n);
    if (n !== 'bad-space') assert.equal(d.space, 'broken', n);
  }
  assert.ok(!(Number.isInteger(Number(dir('bad-rank').rank)) && Number(dir('bad-rank').rank) > 0), 'bad-rank');
  assert.equal(dir('bad-space').space, undefined);
  assert.ok(!Array.isArray(dir('bad-roles').roles), 'bad-roles is not a list');
  const bmo = dir('bad-member-org');
  assert.notEqual(person(bmo.brain.members[0]).org, bmo.brain.org);
  assert.equal(person('vic-ora').org, 'other');
  assert.ok(person('vic-ora').role);
  assert.deepEqual(dir('empty-receives').brain.receives, []);
  assert.notEqual(dir('bad-slug').audience, 'bad-slug');
  assert.equal(dir('bad-org').brain.org, 'personal');
  const classes = ['decisions', 'dates', 'actions', 'definitions', 'roles', 'metrics', 'cadence', 'open-questions', 'links', 'files'];
  assert.ok(dir('bad-receives').brain.receives.some((c) => !classes.includes(c)), 'bad-receives has an unknown class');
  const bm = dir('bad-member').brain.members;
  assert.ok(bm.length > 0 && bm.some((m) => !fs.existsSync(path.join(DIR, `people/${m}.md`))), 'bad-member names a missing person');
  assert.equal(bmo.brain.members[0], 'vic-ora');
  assert.equal(dir('bad-roles').roles, 'Programme lead');
  assert.ok(!fs.existsSync(path.join(DIR, 'outbox/no-audience/audience.md')));
  assert.ok(fs.existsSync(path.join(DIR, 'outbox/no-audience')));
});

test('F2.14 the pilot project has the dated, sourced Lea Park line', () => {
  const lines = section(read('projects/pilot.md'), 'Now');
  assert.ok(lines.some((l) => /Lea Park/.test(l) && /\d{4}-\d{2}-\d{2}/.test(l) && /\(Pilot sync \d{4}-\d{2}-\d{2}\)/.test(l)));
});

test('the knowledge notes: plan is stable with a long sentence, the three lines differ', () => {
  const plan = parseFrontmatter(read('knowledge/plan.md'));
  assert.equal(plan.data.status, 'stable');
  const sentences = plan.body.split(/(?<=[.)])\s+/);
  assert.ok(sentences.some((x) => x.split(/\s+/).length >= 12), 'a sentence of 12 or more words');
  const lastLine = (rel) => parseFrontmatter(read(rel)).body.split('\n').filter((l) => l.trim() && !l.startsWith('#')).pop();
  const three = ['draft', 'old', 'plan'].map((n) => lastLine(`knowledge/${n}.md`));
  assert.equal(new Set(three).size, 3);
});

test('the already-shared count relies on Kickoff and Training in the team package and manifest, restated in launch', () => {
  const pkg = read('outbox/team/2026-11-10-launch-update.md');
  const manifest = read('outbox/team/manifest.md');
  for (const t of [/Kickoff on 2026-01-12/, /Training starts 2026-01-19/]) {
    assert.match(pkg, t);
    assert.match(manifest, t);
  }
  assert.match(read('projects/launch.md'), /Kickoff is on 2026-01-12/);
  assert.match(read('logs/launch.md'), /training start confirmed for 2026-01-19/);
});

test('the fixture ships the audience and person templates, as in the template', () => {
  for (const f of ['audience.md', 'person.md']) {
    assert.equal(read(`templates/${f}`), fs.readFileSync(path.join(DIR, '../../../template/templates', f), 'utf8'), f);
  }
});

test('RUN.md asks to produce each result first and keeps the reference results at the very end', () => {
  const run = read('RUN.md');
  assert.match(run, /Produce each result before reading its expected result\./);
  const head = '## Reference results (read only after your own run)';
  assert.ok(run.includes(head));
  assert.ok(!run.slice(run.indexOf(head) + head.length).includes('\n## '), 'it is the last section');
  assert.ok(!/## The reference proposal/.test(run));
});

test('RUN.md has a section for every F2 and F3 scenario and starts with a reset step', () => {
  const run = read('RUN.md');
  const ids = [];
  for (let i = 1; i <= 29; i++) ids.push(`F2.${i}`);
  for (let i = 1; i <= 7; i++) ids.push(`F3.${i}`);
  for (const id of ids) assert.ok(new RegExp(`\\|\\s*${id.replace('.', '\\.')}\\s*\\|`).test(run), `${id} row`);
  assert.ok(run.indexOf('git clean') > 0 && run.indexOf('git clean') < run.indexOf('## F2 Inputs'), 'reset at the top');
});

test('the fixture AGENTS.md equals the template AGENTS.md except the blocked-term line', () => {
  const norm = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => !l.startsWith('- Blocked terms (')).join('\n');
  assert.equal(norm(path.join(DIR, 'AGENTS.md')), norm(path.join(FIXTURES, '..', '..', 'template', 'AGENTS.md')));
});
