import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { BIN, TODAY, tmpDir, writeTree } from './helpers.mjs';

function brain(args) {
  return spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8',
    env: { ...process.env, BRAIN_HOME: tmpDir('brain-home-') },
  });
}

const person = (over = {}) => {
  const d = { type: 'person', description: 'Programme lead at acme', tags: '[people]', org: 'acme', updated: '2026-11-11', role: 'Programme lead', aliases: '[S. Lee]', ...over };
  const fm = Object.entries(d).filter(([, v]) => v !== null).map(([k, v]) => `${k}: ${v}`).join('\n');
  return `---\n${fm}\n---\n\n# Sam Lee\n\nPrivate context.\n`;
};
const knowledge = '---\ntype: note\ndescription: A fact\ntags: [fact]\norg: acme\nupdated: 2026-11-11\n---\n\n# Fact\n';

function makeBrain(files) {
  const dir = tmpDir();
  writeTree(dir, files);
  assert.equal(brain(['index', dir]).status, 0);
  return dir;
}
const lintOf = (dir) => brain(['lint', dir, '--today', '2026-11-11']);

test('F1.1 a valid person note lints clean', () => {
  const dir = makeBrain({ 'people/sam-lee.md': person() });
  const r = lintOf(dir);
  assert.equal(r.status, 0, r.stdout);
  assert.equal(r.stdout.trim(), '0 errors, 0 warnings');
});

test('F1.2 wrong type in people/ is frontmatter/bad-value', () => {
  const dir = makeBrain({ 'people/sam-lee.md': person({ type: 'note' }) });
  const r = lintOf(dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /people\/sam-lee\.md:\d+  error  frontmatter\/bad-value/);
});

test('F1.3 index lists people after Knowledge, none without people', () => {
  const dir = makeBrain({ 'people/sam-lee.md': person(), 'knowledge/fact.md': knowledge });
  const text = fs.readFileSync(path.join(dir, 'index.md'), 'utf8');
  const line = '- [Sam Lee](/people/sam-lee.md): Programme lead at acme (acme, updated 2026-11-11)';
  assert.ok(text.includes(`## Knowledge\n\n- [Fact](/knowledge/fact.md): A fact (acme, updated 2026-11-11)\n\n## People\n\n${line}\n`), text);
  assert.equal(text.split(line).length, 2);

  const none = makeBrain({ 'knowledge/fact.md': knowledge });
  assert.ok(!fs.readFileSync(path.join(none, 'index.md'), 'utf8').includes('## People'));
});

test('F1.4 outbox files are not indexed, not notes, lint only checks type', () => {
  const dir = makeBrain({
    'outbox/team/audience.md': '---\ntype: audience\n---\n\n# Team\n',
    'outbox/team/pack.md': '---\ntype: outbox\n---\n\n# Pack\n',
    'outbox/team/manifest.md': '---\ntype: outbox\n---\n\n# Manifest\n',
  });
  const index = fs.readFileSync(path.join(dir, 'index.md'), 'utf8');
  assert.ok(!index.includes('outbox'));
  const r = lintOf(dir);
  assert.equal(r.status, 0, r.stdout);
  assert.equal(r.stdout.trim(), '0 errors, 0 warnings');
  writeTree(dir, { 'outbox/team/bad.md': '---\ntype:\n---\n\n# Bad\n' });
  const r2 = lintOf(dir);
  assert.equal(r2.status, 1);
  assert.match(r2.stdout, /outbox\/team\/bad\.md:1  error  okf\/type-missing/);
});

test('F1.5 missing or empty role is frontmatter/missing-key', () => {
  for (const role of [null, '""']) {
    const dir = makeBrain({ 'people/sam-lee.md': person({ role }) });
    const r = lintOf(dir);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /people\/sam-lee\.md:\d+  error  frontmatter\/missing-key  required key "role"/);
  }
});

test('F1.7 brain init ships templates/person.md', () => {
  const dir = path.join(tmpDir(), 'brain');
  const r = spawnSync(process.execPath, [BIN, 'init', dir], {
    encoding: 'utf8',
    env: { ...process.env, BRAIN_HOME: tmpDir('brain-home-'), BRAIN_TEMPLATE_DIR: '' },
  });
  assert.equal(r.status, 0, r.stderr);
  const t = fs.readFileSync(path.join(dir, 'templates', 'person.md'), 'utf8');
  for (const needle of ['type: person', 'role:', 'aliases:']) assert.ok(t.includes(needle), needle);
});
