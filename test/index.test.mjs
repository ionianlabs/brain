import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { computeIndex, writeIndex } from '../src/index.mjs';
import { FIXTURES, copyDir, tmpDir, writeTree } from './helpers.mjs';

const EXPECTED_BLOCK = `<!-- brain:index start -->
## Active

- [Alpha](/projects/alpha.md): Alpha project for client-a. (client-a, updated 2026-11-01)

## Paused

- [Beta](/projects/beta.md): Beta project for client-b. (client-b, updated 2026-10-25)

## Done

- [Gamma](/projects/gamma.md): Gamma project for personal. (personal, updated 2026-10-10)

## Knowledge

- [B guide](/knowledge/b-guide.md): Guide for client-b. (client-b, updated 2026-10-20)
- [Notes](/knowledge/notes.md): Personal notes. (personal, updated 2026-10-20)
<!-- brain:index end -->`;

function cleanCopy() {
  const dir = tmpDir();
  copyDir(path.join(FIXTURES, 'clean'), dir);
  return dir;
}

test('writes the exact expected block', () => {
  const dir = cleanCopy();
  fs.rmSync(path.join(dir, 'index.md'));
  writeIndex(dir);
  const text = fs.readFileSync(path.join(dir, 'index.md'), 'utf8');
  assert.equal(text, `---\nokf_version: "0.2"\n---\n\n# Index\n\n${EXPECTED_BLOCK}\n`);
});

test('running it twice changes nothing', () => {
  const dir = cleanCopy();
  fs.rmSync(path.join(dir, 'index.md'));
  writeIndex(dir);
  const first = fs.readFileSync(path.join(dir, 'index.md'), 'utf8');
  assert.equal(writeIndex(dir).status, 'ok');
  assert.equal(fs.readFileSync(path.join(dir, 'index.md'), 'utf8'), first);
});

test('text above and below the block is kept', () => {
  const dir = cleanCopy();
  writeTree(dir, { 'index.md': `---\nokf_version: "0.2"\n---\n\nIntro text.\n\n<!-- brain:index start -->\nold\n<!-- brain:index end -->\n\nFooter text.\n` });
  writeIndex(dir);
  const text = fs.readFileSync(path.join(dir, 'index.md'), 'utf8');
  assert.equal(text, `---\nokf_version: "0.2"\n---\n\nIntro text.\n\n${EXPECTED_BLOCK}\n\nFooter text.\n`);
});

test('an index without markers gets the block appended', () => {
  const dir = cleanCopy();
  writeTree(dir, { 'index.md': '# My index\n\nHand written.\n' });
  const { status } = writeIndex(dir);
  assert.equal(status, 'no-markers');
  assert.equal(fs.readFileSync(path.join(dir, 'index.md'), 'utf8'), `# My index\n\nHand written.\n\n${EXPECTED_BLOCK}\n`);
});

test('an empty brain gets an empty block', () => {
  const dir = tmpDir();
  writeIndex(dir);
  const text = fs.readFileSync(path.join(dir, 'index.md'), 'utf8');
  assert.ok(text.endsWith('<!-- brain:index start -->\n<!-- brain:index end -->\n'));
});

test('sorts by updated descending, then slug ascending; inbox and logs are not listed', () => {
  const text = computeIndex(path.join(FIXTURES, 'clean')).text;
  assert.ok(text.indexOf('b-guide') < text.indexOf('/knowledge/notes.md'));
  assert.ok(!text.includes('/logs/'));
  assert.ok(!text.includes('/inbox/'));
});

test('index --check exit codes', async () => {
  const { spawnSync } = await import('node:child_process');
  const { BIN } = await import('./helpers.mjs');
  const ok = spawnSync('node', [BIN, 'index', '--check', path.join(FIXTURES, 'clean')]);
  assert.equal(ok.status, 0);
  const dir = path.join(FIXTURES, 'index-out-of-date');
  const before = fs.readFileSync(path.join(dir, 'index.md'), 'utf8');
  const stale = spawnSync('node', [BIN, 'index', '--check', dir]);
  assert.equal(stale.status, 1);
  assert.equal(fs.readFileSync(path.join(dir, 'index.md'), 'utf8'), before);
});
