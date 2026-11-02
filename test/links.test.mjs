import test from 'node:test';
import assert from 'node:assert/strict';
import { extractLinks, resolveLink } from '../src/links.mjs';

const lines = (text, start = 1) => text.split('\n').map((t, i) => ({ line: start + i, text: t }));

test('extracts links with their line numbers', () => {
  const links = extractLinks(lines('one [a](/x.md)\n\ntwo [b](y.md "title") and ![img](<z w.png>)', 10));
  assert.deepEqual(links, [
    { target: '/x.md', line: 10 },
    { target: 'y.md', line: 12 },
    { target: 'z w.png', line: 12 },
  ]);
});

test('ignores links in code spans and fences', () => {
  const text = 'a `[x](/no.md)` b [yes](/yes.md)\n```\n[f](/no2.md)\n```\n~~~\n[g](/no3.md)\n~~~\n[after](/after.md)';
  assert.deepEqual(extractLinks(lines(text)).map((l) => l.target), ['/yes.md', '/after.md']);
});

test('root-relative links resolve from the root', () => {
  assert.deepEqual(resolveLink('/projects/x.md', 'knowledge/n.md'), { kind: 'local', path: 'projects/x.md' });
});

test('relative links resolve from the file folder', () => {
  assert.deepEqual(resolveLink('../projects/x.md', 'knowledge/n.md'), { kind: 'local', path: 'projects/x.md' });
  assert.deepEqual(resolveLink('sibling.md', 'knowledge/n.md'), { kind: 'local', path: 'knowledge/sibling.md' });
  assert.deepEqual(resolveLink('./a/../b.md', 'x.md'), { kind: 'local', path: 'b.md' });
});

test('anchors are stripped', () => {
  assert.deepEqual(resolveLink('/projects/x.md#now', 'a.md'), { kind: 'local', path: 'projects/x.md' });
  assert.deepEqual(resolveLink('#now', 'a.md'), { kind: 'skip' });
});

test('external links are ignored', () => {
  for (const t of ['https://example.com', 'http://example.com/a', 'mailto:a@example.com']) {
    assert.deepEqual(resolveLink(t, 'a.md'), { kind: 'external' });
  }
});

test('links that leave the brain root are outside', () => {
  assert.deepEqual(resolveLink('../../etc/x.md', 'knowledge/n.md'), { kind: 'outside' });
  assert.deepEqual(resolveLink('/../x.md', 'a.md'), { kind: 'outside' });
});

test('percent-encoded paths are decoded', () => {
  assert.deepEqual(resolveLink('/knowledge/a%20b.md', 'x.md'), { kind: 'local', path: 'knowledge/a b.md' });
});
