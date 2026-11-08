import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOpenItem, parsePrefix } from '../src/items.mjs';

test('parseOpenItem reads all four fields and strips the group from the text', () => {
  const line = '- [ ] Ship beta (prio: p0, owner: Sam, due: 2026-12-01, blocked: waiting for review)';
  assert.deepEqual(parseOpenItem(line), {
    text: 'Ship beta', prio: 'p0', owner: 'Sam', due: '2026-12-01', blocked: 'waiting for review', raw: line,
  });
});

test('parseOpenItem keeps other parentheses and extends values without a key', () => {
  const a = parseOpenItem('- [ ] Draft the page (see note)');
  assert.equal(a.text, 'Draft the page (see note)');
  assert.equal(a.prio, null);
  assert.equal(parseOpenItem('- [ ] Call (owner: Sam, with Ada)').owner, 'Sam, with Ada');
  assert.equal(parseOpenItem('- [ ] Wait (blocked: waiting for review, then deploy)').blocked, 'waiting for review, then deploy');
  assert.equal(parseOpenItem('- [ ] Plan (see note) (prio: p2)').text, 'Plan (see note)');
});

test('parseOpenItem nulls invalid prio and due, and the last duplicate wins', () => {
  const i = parseOpenItem('- [ ] X (prio: P1, due: 2026-13-40)');
  assert.equal(i.prio, null);
  assert.equal(i.due, null);
  assert.equal(parseOpenItem('- [ ] X (prio: p0, prio: p2)').prio, 'p2');
  assert.equal(parseOpenItem('- [ ] X (Prio: p0)').text, 'X (Prio: p0)');
  assert.equal(parseOpenItem('not an item'), null);
});

test('parsePrefix maps each prefix and a prose line', () => {
  assert.deepEqual(parsePrefix('- Decision: ship weekly'), { prefix: 'Decision', author: null });
  assert.deepEqual(parsePrefix('- Decision(Sam): ship weekly'), { prefix: 'Decision', author: 'Sam' });
  assert.deepEqual(parsePrefix('- Done: x'), { prefix: 'Done', author: null });
  assert.deepEqual(parsePrefix('- Done(Ada): x'), { prefix: 'Done', author: 'Ada' });
  assert.deepEqual(parsePrefix('- Said(Sam): x'), { prefix: 'Said', author: 'Sam' });
  assert.deepEqual(parsePrefix('- Inferred(rover-agent): x'), { prefix: 'Inferred', author: 'rover-agent' });
  assert.deepEqual(parsePrefix('- Inferred: x'), { prefix: 'Inferred', author: null });
  for (const prose of ['- Said (Sam): x', '- decision: x', '- Noted: x', '- The team met']) {
    assert.deepEqual(parsePrefix(prose), { prefix: null, author: null }, prose);
  }
});
