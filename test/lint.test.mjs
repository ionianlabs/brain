import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { lint } from '../src/lint.mjs';
import fs from 'node:fs';
import { FIXTURES, TODAY, copyDir, tmpDir, writeTree } from './helpers.mjs';

const run = (name, options = {}) => lint(path.join(FIXTURES, name), { today: TODAY, ...options });

test('clean fixture has zero findings', () => {
  const r = run('clean');
  assert.deepEqual(r.findings, []);
  assert.equal(r.errors, 0);
  assert.equal(r.warnings, 0);
});

// One fixture per rule. Each triggers its rule exactly once and nothing else.
const RULES = [
  ['okf-type-missing', 'okf/type-missing', 'error', 'AGENTS.md'],
  ['frontmatter-missing-key', 'frontmatter/missing-key', 'error', 'knowledge/notes.md'],
  ['frontmatter-bad-value', 'frontmatter/bad-value', 'error', 'knowledge/notes.md'],
  ['links-broken', 'links/broken', 'warning', 'knowledge/notes.md'],
  ['tags-near-duplicate', 'tags/near-duplicate', 'warning', 'knowledge/notes.md'],
  ['state-over-budget', 'state/over-budget', 'warning', 'projects/alpha.md'],
  ['state-stale', 'state/stale', 'warning', 'projects/alpha.md'],
  ['org-cross-link', 'org/cross-link', 'error', 'projects/alpha.md'],
  ['confidential-linked', 'confidential/linked', 'warning', 'knowledge/notes.md'],
  ['index-out-of-date', 'index/out-of-date', 'warning', 'index.md'],
];

for (const [fixture, rule, severity, file] of RULES) {
  test(`${rule} fires exactly once on ${fixture}`, () => {
    const r = run(fixture);
    assert.equal(r.findings.length, 1, JSON.stringify(r.findings));
    assert.equal(r.findings[0].rule, rule);
    assert.equal(r.findings[0].severity, severity);
    assert.equal(r.findings[0].path, file);
    assert.equal(r.errors, severity === 'error' ? 1 : 0);
    assert.equal(r.warnings, severity === 'warning' ? 1 : 0);
  });
}

test('findings carry line numbers of the offending line', () => {
  assert.equal(run('links-broken').findings[0].line, 20);
  assert.equal(run('frontmatter-bad-value').findings[0].line, 6);
});

test('--stale-days changes the stale threshold', () => {
  assert.equal(run('state-stale', { staleDays: 60 }).findings.length, 0);
  assert.equal(run('clean', { staleDays: 0 }).findings.length, 1);
});

test('a project exactly 14 days old is not stale', () => {
  // alpha is updated 2026-11-01, so 2026-11-15 is exactly 14 days later.
  assert.equal(run('clean', { today: '2026-11-15' }).findings.length, 0);
  assert.equal(run('clean', { today: '2026-11-16' }).findings[0].rule, 'state/stale');
});

test('messages say how to fix the problem and use root-relative paths', () => {
  const cross = run('org-cross-link').findings[0];
  assert.match(cross.message, /^link to \/\S+\.md crosses from org \S+ to org \S+\. Remove the link, or put the shared fact in a personal note and link that\.$/);
  const broken = run('links-broken').findings[0];
  assert.match(broken.message, /^link target \/knowledge\/nope\.md does not exist\. Fix the path or remove the link\.$/);
  const index = run('index-out-of-date').findings[0];
  assert.match(index.message, /Run `brain index` to update it\.$/);
});

test('links/broken suggests the log template for a missing log of an existing project', () => {
  const root = tmpDir();
  writeTree(root, {
    'AGENTS.md': '---\ntype: guide\n---\n\n# Rules\n',
    'projects/site.md': '---\ntype: project\ndescription: Site\ntags: [web]\norg: client-a\nupdated: 2026-11-02\nphase: active\nfocus: launch\n---\n\n# Site\n\nHistory: [log](/logs/site.md)\n\nSee [other](/logs/ghost.md).\n',
  });
  const found = lint(root, { today: TODAY }).findings.filter((x) => x.rule === 'links/broken');
  assert.equal(found.length, 2);
  assert.match(found[1].message, /^link target \/logs\/ghost\.md does not exist\. Fix the path or remove the link\.$/);
  assert.match(found[0].message, /^link target \/logs\/site\.md does not exist\. Create it from templates\/log\.md\.$/);
});

test('every finding message ends with a fix hint sentence', () => {
  for (const name of ['frontmatter-bad-value', 'frontmatter-missing-key', 'okf-type-missing', 'state-stale', 'state-over-budget', 'tags-near-duplicate', 'confidential-linked']) {
    for (const f of run(name).findings) assert.match(f.message, /\. [A-Z][^.]*\.$/, `${name}: ${f.message}`);
  }
});

test('dependency and tool folders are not scanned', async () => {
  const { walkMarkdown } = await import('../src/notes.mjs');
  const { computeIndex } = await import('../src/index.mjs');
  const { copyDir } = await import('./helpers.mjs');
  const root = tmpDir();
  copyDir(path.join(FIXTURES, 'clean'), root);
  const note = '---\ntype: note\ntitle: Ghost\ndescription: Ghost.\nupdated: 2026-10-20\norg: personal\ntags: [x]\n---\n\n# Ghost\n';
  writeTree(root, {
    'assets/.venv/lib/python3.12/site-packages/pw/SKILL.md': '# Bundled docs, no frontmatter\n',
    'assets/venv/README.md': '# no frontmatter\n',
    'assets/tool/__pycache__/x.md': '# no frontmatter\n',
    'assets/.tox/x.md': '# no frontmatter\n',
    'assets/.mypy_cache/x.md': '# no frontmatter\n',
    'assets/.pytest_cache/x.md': '# no frontmatter\n',
    'assets/.cache/x.md': '# no frontmatter\n',
    'assets/myenv/pyvenv.cfg': 'home = /usr/bin\n',
    'assets/myenv/lib/x.md': '# no frontmatter\n',
    'knowledge/.venv/ghost.md': note,
  });
  const files = walkMarkdown(root);
  assert.ok(files.includes('knowledge/notes.md'), 'real notes are still found');
  assert.deepEqual(files.filter((f) => /venv|__pycache__|\.tox|_cache|\.cache|myenv/.test(f)), []);
  const r = lint(root, { today: TODAY });
  assert.deepEqual(r.findings, []);
  assert.ok(!JSON.stringify(computeIndex(root)).includes('Ghost'));
});

function editedClean(rel, from, to) {
  const root = tmpDir();
  copyDir(path.join(FIXTURES, 'clean'), root);
  const file = path.join(root, rel);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const at = lines.findIndex((l) => l.startsWith(from));
  assert.ok(at >= 0, `${from} not found in ${rel}`);
  lines[at] = to;
  fs.writeFileSync(file, lines.join('\n'));
  return { root, line: at + 1 };
}

const logBullet = (bullet) => editedClean('logs/alpha.md', '- Done: Started', bullet);
const openItem = (item) => editedClean('projects/alpha.md', '- [ ] Review', item);

test('F1.1 a bare Decision bullet has no finding', () => {
  assert.deepEqual(lint(logBullet('- Decision: ship weekly').root, { today: TODAY }).findings, []);
});

test('F1.2 an attributed Said bullet has no finding', () => {
  assert.deepEqual(lint(logBullet('- Said(Sam): the API freeze moves to March').root, { today: TODAY }).findings, []);
});

test('F1.3 Said without a name warns once', () => {
  const { root, line } = logBullet('- Said: the freeze moves');
  const r = lint(root, { today: TODAY });
  assert.equal(r.findings.length, 1, JSON.stringify(r.findings));
  assert.deepEqual([r.findings[0].path, r.findings[0].line, r.findings[0].severity, r.findings[0].rule], ['logs/alpha.md', line, 'warning', 'provenance/malformed']);
  assert.match(r.findings[0].message, /^prefix Said needs the speaker in parentheses\. Write it as Said\(Name\):\.$/);
});

test('F1.4 empty parentheses warn once', () => {
  const { root, line } = logBullet('- Decision(): ship weekly');
  const r = lint(root, { today: TODAY });
  assert.equal(r.findings.length, 1, JSON.stringify(r.findings));
  assert.deepEqual([r.findings[0].path, r.findings[0].line, r.findings[0].severity, r.findings[0].rule], ['logs/alpha.md', line, 'warning', 'provenance/malformed']);
});

test('provenance/malformed reads log bullets only, outside code fences, one finding per line', () => {
  for (const bullet of ['- Said (Sam): prose', '- said: prose', '- Noted: prose', '  - Said: nested', '- Inferred(agent-x): fine', '- Done(Ada): fine', '- Said( ): blank']) {
    const found = lint(logBullet(bullet).root, { today: TODAY }).findings;
    assert.equal(found.length, bullet.includes('Said( )') ? 1 : 0, bullet);
  }
  const { root } = logBullet('```\n- Said: inside a fence\n```');
  assert.deepEqual(lint(root, { today: TODAY }).findings, []);
  const proj = editedClean('projects/alpha.md', '- Work is', '- Said: not a log');
  assert.deepEqual(lint(proj.root, { today: TODAY }).findings, []);
});

test('F2.1 a valid prio and due have no finding', () => {
  assert.deepEqual(lint(openItem('- [ ] Call Sam (prio: p1, due: 2026-12-01)').root, { today: TODAY }).findings, []);
});

const openCases = [
  ['F2.2', '- [ ] Call Sam (prio: high)', /^prio "high" must be p0, p1 or p2\. Use one of the three\.$/],
  ['F2.3', '- [ ] Call Sam (due: 2026-13-40)', /^due "2026-13-40" must be a valid YYYY-MM-DD date\. Use a date like 2026-12-01\.$/],
  ['F2.4', '- [ ] Call Sam (priority: p0)', /^unknown key "priority" in the item fields\. Use prio, owner, due or blocked\.$/],
];
for (const [id, item, message] of openCases) {
  test(`${id} ${item}`, () => {
    const { root, line } = openItem(item);
    const r = lint(root, { today: TODAY });
    assert.equal(r.findings.length, 1, JSON.stringify(r.findings));
    assert.deepEqual([r.findings[0].path, r.findings[0].line, r.findings[0].severity, r.findings[0].rule], ['projects/alpha.md', line, 'warning', 'open-item/malformed']);
    assert.match(r.findings[0].message, message);
  });
}

test('open-item/malformed warns once per bad field and ignores plain parentheses', () => {
  const two = lint(openItem('- [ ] Call Sam (prio: P1, due: soon, size: l)').root, { today: TODAY }).findings;
  assert.deepEqual(two.map((x) => x.rule), ['open-item/malformed', 'open-item/malformed', 'open-item/malformed']);
  for (const item of ['- [ ] Draft the page (see note)', '- [ ] Draft (Prio: p9)', '- [ ] Wait (blocked: waiting for review, then deploy)', '- [ ] Call (owner: Sam, with Ada, prio: p2)']) {
    assert.deepEqual(lint(openItem(item).root, { today: TODAY }).findings, [], item);
  }
});

test('open-item/malformed checks projects of every phase', () => {
  const { root } = editedClean('projects/gamma.md', '- [ ] Review', '- [ ] Call Sam (prio: high)');
  const r = lint(root, { today: TODAY });
  assert.deepEqual(r.findings.map((x) => [x.path, x.rule]), [['projects/gamma.md', 'open-item/malformed']]);
});

test('a ranked item still counts once toward the open budget', async () => {
  const { budget } = await import('../src/lint.mjs');
  const lines = ['## Open', '- [ ] A (prio: p0, due: 2026-12-01)', '- [ ] B'].map((text, i) => ({ line: i + 1, text }));
  assert.equal(budget(lines).open, 2);
});
