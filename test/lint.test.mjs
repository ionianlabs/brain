import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { lint } from '../src/lint.mjs';
import { FIXTURES, TODAY, tmpDir, writeTree } from './helpers.mjs';

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
