// Project notes: knowledge notes tied to a project with `project: <slug>`,
// the generated notes map in the project file, and the split state budget.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { computeIndex, writeIndex } from '../src/index.mjs';
import { lint } from '../src/lint.mjs';
import { BIN, TODAY, tmpDir, writeTree } from './helpers.mjs';

const project = (slug, org, body = '') =>
  `---\ntype: project\ndescription: ${slug} project\ntags: [demo]\norg: ${org}\nupdated: 2026-11-01\nphase: active\nfocus: Move on.\n---\n\n# ${slug}\n\nHistory: [log](/logs/${slug}.md)\n\n## Now\n\n- Under way.\n${body}\n## Open\n\n- [ ] Review (owner: Sam)\n\n## People\n\n- Sam, reviewer\n\n## Links\n\n- https://example.com\n`;

const log = (slug, org, proj = slug) =>
  `---\ntype: log\ndescription: ${slug} log\ntags: [demo]\norg: ${org}\nupdated: 2026-11-01\nproject: ${proj}\n---\n\n# ${slug} log\n\n## 2026-11-01\n\n- Done: Started.\n`;

const note = (slug, org, proj, extra = '') =>
  `---\ntype: note\ndescription: ${slug} reference\ntags: [demo]\norg: ${org}\nupdated: 2026-10-20\n${proj ? `project: ${proj}\n` : ''}${extra}---\n\n# ${slug}\n\nText.\n`;

function brain(files) {
  const root = tmpDir();
  writeTree(root, { 'AGENTS.md': '---\ntype: guide\n---\n\n# Rules\n', ...files });
  return root;
}

const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const MAP = `<!-- brain:notes start -->
Notes (open one only when the task needs it):

- [pods](/knowledge/alpha-pods.md): alpha-pods reference
- [setup](/knowledge/alpha-setup.md): alpha-setup reference
<!-- brain:notes end -->`;

test('brain index writes a notes map into the project file, before ## Now', () => {
  const root = brain({
    'projects/alpha.md': project('alpha', 'client-a'),
    'logs/alpha.md': log('alpha', 'client-a'),
    'knowledge/alpha-setup.md': note('setup', 'client-a', 'alpha').replace('setup reference', 'alpha-setup reference'),
    'knowledge/alpha-pods.md': note('pods', 'client-a', 'alpha').replace('pods reference', 'alpha-pods reference'),
  });
  writeIndex(root);
  const text = read(root, 'projects/alpha.md');
  assert.ok(text.includes(`History: [log](/logs/alpha.md)\n\n${MAP}\n\n## Now\n`), text);
  // Idempotent.
  const again = writeIndex(root);
  assert.equal(again.status, 'ok');
  assert.deepEqual(again.projects, []);
  assert.equal(read(root, 'projects/alpha.md'), text);
});

test('the notes map is replaced in place when notes change, and other text is kept', () => {
  const root = brain({
    'projects/alpha.md': project('alpha', 'client-a').replace('## Now', '<!-- brain:notes start -->\nold\n<!-- brain:notes end -->\n\n## Now'),
    'knowledge/alpha-pods.md': note('pods', 'client-a', 'alpha'),
  });
  assert.equal(computeIndex(root).projects.length, 1);
  writeIndex(root);
  const text = read(root, 'projects/alpha.md');
  assert.ok(!text.includes('old'));
  assert.ok(text.includes('- [pods](/knowledge/alpha-pods.md): pods reference\n<!-- brain:notes end -->\n\n## Now'));
  assert.ok(text.includes('- Under way.'));
});

test('a project without notes and without markers is left alone; existing markers empty out', () => {
  const plain = project('beta', 'client-a');
  const root = brain({
    'projects/beta.md': plain,
    'projects/gamma.md': project('gamma', 'client-a').replace('## Now', '<!-- brain:notes start -->\n- stale\n<!-- brain:notes end -->\n\n## Now'),
  });
  writeIndex(root);
  assert.equal(read(root, 'projects/beta.md'), plain);
  assert.ok(read(root, 'projects/gamma.md').includes('<!-- brain:notes start -->\n<!-- brain:notes end -->\n\n## Now'));
});

test('the index lists project notes as a count, and only unscoped notes under Knowledge', () => {
  const root = brain({
    'projects/alpha.md': project('alpha', 'client-a'),
    'knowledge/alpha-pods.md': note('pods', 'client-a', 'alpha'),
    'knowledge/alpha-setup.md': note('setup', 'client-a', 'alpha'),
    'knowledge/general.md': note('general', 'personal', null),
    'knowledge/orphan.md': note('orphan', 'client-a', 'nope'),
  });
  const { text } = computeIndex(root);
  assert.ok(text.includes('- [alpha](/projects/alpha.md): alpha project (client-a, updated 2026-11-01, 2 notes)'), text);
  assert.ok(text.includes('## Knowledge\n\n- [general](/knowledge/general.md)'));
  assert.ok(text.includes('/knowledge/orphan.md'), 'a note whose project does not exist stays visible');
  assert.ok(!text.includes('/knowledge/alpha-pods.md'));
});

test('index --check exits 1 when a notes map is out of date', () => {
  const root = brain({
    'projects/alpha.md': project('alpha', 'client-a'),
    'knowledge/alpha-pods.md': note('pods', 'client-a', 'alpha'),
  });
  fs.writeFileSync(path.join(root, 'index.md'), computeIndex(root).text);
  const r = spawnSync('node', [BIN, 'index', '--check', root], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /projects\/alpha\.md/);
  const w = spawnSync('node', [BIN, 'index', root], { encoding: 'utf8' });
  assert.equal(w.status, 0);
  assert.match(w.stdout, /projects\/alpha\.md notes map updated/);
  assert.equal(spawnSync('node', [BIN, 'index', '--check', root]).status, 0);
});

test('lint: a stale notes map is index/out-of-date on the project file', () => {
  const root = brain({
    'projects/alpha.md': project('alpha', 'client-a'),
    'logs/alpha.md': log('alpha', 'client-a'),
    'knowledge/alpha-pods.md': note('pods', 'client-a', 'alpha'),
  });
  fs.writeFileSync(path.join(root, 'index.md'), computeIndex(root).text);
  const found = lint(root, { today: TODAY }).findings;
  assert.equal(found.length, 1, JSON.stringify(found));
  assert.equal(found[0].rule, 'index/out-of-date');
  assert.equal(found[0].path, 'projects/alpha.md');
  assert.match(found[0].message, /Run `brain index` to update it\.$/);
  writeIndex(root);
  assert.deepEqual(lint(root, { today: TODAY }).findings, []);
});

test('lint: project key pointing to no project is project/unknown, on notes and logs', () => {
  const root = brain({
    'projects/alpha.md': project('alpha', 'client-a'),
    'logs/alpha.md': log('alpha', 'client-a'),
    'logs/ghost.md': log('ghost', 'client-a'),
    'knowledge/orphan.md': note('orphan', 'client-a', 'nope'),
  });
  writeIndex(root);
  const found = lint(root, { today: TODAY }).findings;
  assert.deepEqual(found.map((f) => [f.path, f.rule, f.severity, f.line]), [
    ['knowledge/orphan.md', 'project/unknown', 'warning', 7],
    ['logs/ghost.md', 'project/unknown', 'warning', 7],
  ]);
  assert.match(found[0].message, /^project "nope" has no project file \/projects\/nope\.md\. Fix the slug or remove the key\.$/);
});

test('lint: a note tied to a project in another org is org/cross-link; personal is neutral', () => {
  const root = brain({
    'projects/alpha.md': project('alpha', 'client-a'),
    'logs/alpha.md': log('alpha', 'client-a'),
    'knowledge/leak.md': note('leak', 'client-b', 'alpha'),
    'knowledge/mine.md': note('mine', 'personal', 'alpha'),
  });
  writeIndex(root);
  const found = lint(root, { today: TODAY }).findings;
  assert.equal(found.length, 1, JSON.stringify(found));
  assert.equal(found[0].rule, 'org/cross-link');
  assert.equal(found[0].severity, 'error');
  assert.equal(found[0].path, 'knowledge/leak.md');
  assert.match(found[0].message, /^project "alpha" is in org client-a and this note is in org client-b\. Move the note to org client-a or remove the project key\.$/);
});

test('lint: the state budget counts words outside Open and the notes map', () => {
  const many = Array.from({ length: 60 }, (_, i) => `- [ ] Item number ${i} with some words in it to make it long`).join('\n');
  const root = brain({
    'projects/alpha.md': project('alpha', 'client-a').replace('- [ ] Review (owner: Sam)', many.split('\n').slice(0, 15).join('\n')),
    'logs/alpha.md': log('alpha', 'client-a'),
  });
  writeIndex(root);
  // 15 long items and a short Now: within budget although the body is over 400 words.
  assert.deepEqual(lint(root, { today: TODAY }).findings, []);

  const words = Array.from({ length: 401 }, () => 'word').join(' ');
  writeTree(root, { 'projects/alpha.md': project('alpha', 'client-a', `- ${words}\n`) });
  const prose = lint(root, { today: TODAY }).findings;
  assert.equal(prose.length, 1);
  assert.equal(prose[0].rule, 'state/over-budget');
  assert.match(prose[0].message, /^body outside ## Open has \d+ words \(target 300, limit 400\)\. Move background to a knowledge note with project: alpha, and history to the log\.$/);
});

test('lint: more than 15 open items is state/over-budget', () => {
  const items = Array.from({ length: 16 }, (_, i) => `- [ ] Item ${i}`).join('\n');
  const root = brain({
    'projects/alpha.md': project('alpha', 'client-a').replace('- [ ] Review (owner: Sam)', items),
    'logs/alpha.md': log('alpha', 'client-a'),
  });
  writeIndex(root);
  const found = lint(root, { today: TODAY }).findings;
  assert.equal(found.length, 1, JSON.stringify(found));
  assert.equal(found[0].rule, 'state/over-budget');
  assert.match(found[0].message, /^## Open has 16 items \(limit 15\)\. Keep the next two weeks in Open and move later items to a plan note\.$/);
});
