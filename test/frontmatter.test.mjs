import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter } from '../src/frontmatter.mjs';

test('scalars: bare, single-quoted, double-quoted', () => {
  const r = parseFrontmatter('---\na: one\nb: \'two words\'\nc: "it\'s #fine"\n---\nBody\n');
  assert.deepEqual(r.data, { a: 'one', b: 'two words', c: "it's #fine" });
  assert.equal(r.hasFrontmatter, true);
});

test('quotes keep a doubled single quote and escaped double quote', () => {
  const r = parseFrontmatter('---\na: \'it\'\'s\'\nb: "say \\"hi\\""\n---\n');
  assert.equal(r.data.a, "it's");
  assert.equal(r.data.b, 'say "hi"');
});

test('inline lists, including quoted items and an empty list', () => {
  const r = parseFrontmatter('---\ntags: [a, "b, c", \'d\']\nnone: []\n---\n');
  assert.deepEqual(r.data.tags, ['a', 'b, c', 'd']);
  assert.deepEqual(r.data.none, []);
});

test('block lists, indented and flush', () => {
  const r = parseFrontmatter('---\ntags:\n  - a\n  - "b"\nmore:\n- x\n- y\nafter: ok\n---\n');
  assert.deepEqual(r.data.tags, ['a', 'b']);
  assert.deepEqual(r.data.more, ['x', 'y']);
  assert.equal(r.data.after, 'ok');
});

test('nested mapping, inline and indented', () => {
  const r = parseFrontmatter('---\ngenerated: {by: agent, at: 2026-11-02T09:00:00Z}\nverified:\n  by: sam\n  at: 2026-11-01\nnext: 1\n---\n');
  assert.deepEqual(r.data.generated, { by: 'agent', at: '2026-11-02T09:00:00Z' });
  assert.deepEqual(r.data.verified, { by: 'sam', at: '2026-11-01' });
  assert.equal(r.data.next, '1');
});

test('comments: full-line and trailing', () => {
  const r = parseFrontmatter('---\n# a comment\na: value # trailing\nb: [x, y] # list\nc: "keep # this"\n---\n');
  assert.equal(r.data.a, 'value');
  assert.deepEqual(r.data.b, ['x', 'y']);
  assert.equal(r.data.c, 'keep # this');
});

test('missing frontmatter returns the whole text as body', () => {
  const r = parseFrontmatter('# Title\n\ntext\n');
  assert.equal(r.hasFrontmatter, false);
  assert.deepEqual(r.data, {});
  assert.equal(r.bodyStartLine, 1);
  assert.equal(r.bodyLines[0].text, '# Title');
});

test('an unclosed frontmatter block counts as missing', () => {
  assert.equal(parseFrontmatter('---\ntype: note\n# Title\n').hasFrontmatter, false);
});

test('line numbers: keys and body lines', () => {
  const r = parseFrontmatter('---\ntype: note\ntags: [a]\n---\n# Title\n\ntext');
  assert.equal(r.keyLines.type, 2);
  assert.equal(r.keyLines.tags, 3);
  assert.equal(r.bodyStartLine, 5);
  assert.deepEqual(r.bodyLines.map((l) => l.line), [5, 6, 7]);
  assert.equal(r.body, '# Title\n\ntext');
});

test('CRLF line endings are accepted', () => {
  const r = parseFrontmatter('---\r\ntype: note\r\n---\r\nBody\r\n');
  assert.equal(r.data.type, 'note');
});

test('unknown keys are preserved', () => {
  assert.equal(parseFrontmatter('---\nweird_key: yes\n---\n').data.weird_key, 'yes');
});
