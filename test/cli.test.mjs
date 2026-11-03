import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { BIN, FIXTURES, TODAY, makeTemplate, tmpDir } from './helpers.mjs';

function brain(args, env = {}) {
  const home = tmpDir('brain-home-');
  const r = spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8',
    env: { ...process.env, BRAIN_HOME: home, ...env },
  });
  return { ...r, home };
}
const fixture = (name) => path.join(FIXTURES, name);

test('lint exits 0 on a clean brain and prints a summary', () => {
  const r = brain(['lint', fixture('clean'), '--today', TODAY]);
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), '0 errors, 0 warnings');
});

test('lint exits 0 with warnings only', () => {
  const r = brain(['lint', fixture('links-broken'), '--today', TODAY]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^knowledge\/notes\.md:20  warning  links\/broken  /m);
  assert.match(r.stdout, /0 errors, 1 warning\n$/);
});

test('lint exits 1 on errors', () => {
  const r = brain(['lint', fixture('org-cross-link'), '--today', TODAY]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /error  org\/cross-link/);
});

test('exit 2: unknown command, missing command, bad option, bad directory', () => {
  for (const args of [['frobnicate'], [], ['lint', '--nope'], ['lint', '/tmp/brain-no-such-dir'], ['lint', '--stale-days', 'x'], ['index', '--json']]) {
    const r = brain(args);
    assert.equal(r.status, 2, args.join(' '));
    assert.match(r.stderr, /^brain: .+\nRun `brain (lint |index )?--help` for usage\.\n$/, args.join(' '));
    assert.doesNotMatch(r.stderr, /Usage:/);
  }
});

test('usage errors in a command point to that command help', () => {
  assert.match(brain(['lint', '--stale-days', 'x']).stderr, /Run `brain lint --help` for usage\./);
  assert.match(brain(['index', '--json']).stderr, /Run `brain index --help` for usage\./);
  assert.match(brain(['init', 'a', 'b']).stderr, /Run `brain init --help` for usage\./);
  assert.match(brain(['frobnicate']).stderr, /Run `brain --help` for usage\./);
});

test('per-command --help prints args, flags and an example, and exits 0', () => {
  const expected = {
    init: [/^Usage: brain init \[dir\]/, /--example/, /--link-skills/],
    index: [/^Usage: brain index \[dir\]/, /--check/],
    lint: [/^Usage: brain lint \[dir\]/, /--json/, /--stale-days N/, /--today DATE/],
  };
  for (const [cmd, patterns] of Object.entries(expected)) {
    for (const args of [[cmd, '--help'], ['--help', cmd], [cmd, '-h']]) {
      const r = brain(args);
      assert.equal(r.status, 0, args.join(' '));
      for (const p of patterns) assert.match(r.stdout, p);
      assert.match(r.stdout, /Arguments:/);
      assert.match(r.stdout, new RegExp(`\\nExample:\\n  brain ${cmd} `));
      assert.doesNotMatch(r.stdout, /Commands:/);
    }
  }
});

test('brain --help stays global', () => {
  const r = brain(['--help']);
  assert.match(r.stdout, /Commands:/);
  assert.match(r.stdout, /init \[dir\]/);
  assert.match(r.stdout, /lint \[dir\]/);
});

test('--json has the documented shape', () => {
  const r = brain(['lint', fixture('state-stale'), '--json', '--today', TODAY]);
  const out = JSON.parse(r.stdout);
  assert.deepEqual(Object.keys(out), ['findings', 'errors', 'warnings']);
  assert.equal(out.errors, 0);
  assert.equal(out.warnings, 1);
  assert.deepEqual(Object.keys(out.findings[0]), ['path', 'line', 'severity', 'rule', 'message']);
  assert.equal(out.findings[0].rule, 'state/stale');
  assert.equal(typeof out.findings[0].line, 'number');
});

test('--stale-days is honored', () => {
  const r = brain(['lint', fixture('state-stale'), '--stale-days', '60', '--today', TODAY]);
  assert.equal(r.stdout.trim(), '0 errors, 0 warnings');
});

test('--help and --version print to stdout and exit 0', () => {
  const h = brain(['--help']);
  assert.equal(h.status, 0);
  assert.match(h.stdout, /Usage: brain/);
  const v = brain(['--version']);
  assert.equal(v.status, 0);
  assert.equal(v.stdout.trim(), JSON.parse(fs.readFileSync(path.join(FIXTURES, '..', '..', 'package.json'), 'utf8')).version);
});

test('lint does not write files', () => {
  const before = fs.readFileSync(path.join(fixture('index-out-of-date'), 'index.md'), 'utf8');
  brain(['lint', fixture('index-out-of-date'), '--today', TODAY]);
  assert.equal(fs.readFileSync(path.join(fixture('index-out-of-date'), 'index.md'), 'utf8'), before);
});

test('init runs end to end inside a temp home', () => {
  const root = tmpDir();
  const templateDir = makeTemplate(path.join(root, 'template'));
  const r = brain(['init', '--link-skills'], { BRAIN_TEMPLATE_DIR: templateDir, BRAIN_HOME: path.join(root, 'home'), BRAIN_DIR: '', IONIAN_HOME: '' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(path.join(root, 'home', 'Ionian', 'brain', 'AGENTS.md')));
  assert.ok(fs.lstatSync(path.join(root, 'home', '.claude', 'skills', 'handover')).isSymbolicLink());
  assert.match(r.stdout, /Next steps:\n  1\. Open the folder in your editor\./);
});
