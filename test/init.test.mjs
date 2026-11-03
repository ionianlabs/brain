import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { init } from '../src/init.mjs';
import { lint } from '../src/lint.mjs';
import { HERE, makeTemplate, makeExample, tmpDir } from './helpers.mjs';

function setup() {
  const root = tmpDir();
  return {
    templateDir: makeTemplate(path.join(root, 'template')),
    exampleDir: makeExample(path.join(root, 'example')),
    dir: path.join(root, 'brain'),
    home: path.join(root, 'home'),
  };
}
const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');

test('copies the template files', () => {
  const s = setup();
  const r = init(s);
  for (const f of ['AGENTS.md', 'index.md', 'skills/handover/SKILL.md', '.github/prompts/brief.prompt.md']) {
    assert.ok(fs.existsSync(path.join(s.dir, f)), f);
    assert.ok(r.created.includes(f), f);
  }
  assert.equal(r.skipped.length, 0);
});

test('never overwrites an existing file and reports it as skipped', () => {
  const s = setup();
  fs.mkdirSync(s.dir, { recursive: true });
  fs.writeFileSync(path.join(s.dir, 'AGENTS.md'), 'mine\n');
  const r = init(s);
  assert.equal(read(s.dir, 'AGENTS.md'), 'mine\n');
  assert.deepEqual(r.skipped, ['AGENTS.md']);
  assert.ok(!r.created.includes('AGENTS.md'));
});

test('substitutes {{BRAIN_DIR}} only in skills/ and .github/prompts/', () => {
  const s = setup();
  init(s);
  assert.ok(read(s.dir, 'skills/handover/SKILL.md').includes(`Run in ${s.dir} with \`node "${path.join(HERE, '..', 'bin', 'brain.mjs')}"\`.`));
  assert.ok(read(s.dir, '.github/prompts/brief.prompt.md').includes(`Read ${s.dir}/index.md.`));
  assert.ok(read(s.dir, 'AGENTS.md').includes('{{BRAIN_DIR}}'));
});

test('stores gitignore as .gitignore', () => {
  const s = setup();
  init(s);
  assert.equal(read(s.dir, '.gitignore'), '.confidential/\n');
  assert.ok(!fs.existsSync(path.join(s.dir, 'gitignore')));
});

test('creates the empty note folders', () => {
  const s = setup();
  init(s);
  for (const d of ['projects', 'logs', 'inbox', 'knowledge', '.confidential']) {
    assert.ok(fs.statSync(path.join(s.dir, d)).isDirectory(), d);
  }
});

test('runs index at the end', () => {
  const s = setup();
  const r = init({ ...s, example: true, today: '2026-11-02' });
  assert.equal(r.index, 'differs');
  assert.ok(read(s.dir, 'index.md').includes('- [Demo](/projects/demo.md)'));
});

test('example: dates are unchanged when today is the base date', () => {
  const s = setup();
  init({ ...s, example: true, today: '2026-11-02' });
  assert.ok(read(s.dir, 'projects/demo.md').includes('(due: 2026-10-30)'));
  assert.ok(!fs.existsSync(path.join(s.dir, 'index.md.orig')));
});

test('example: dates shift with a fixed today, in contents and inbox file names', () => {
  const s = setup();
  init({ ...s, example: true, today: '2026-12-02' });
  const project = read(s.dir, 'projects/demo.md');
  assert.ok(project.includes('updated: 2026-12-01'));
  assert.ok(project.includes('(due: 2026-11-29)'));
  assert.ok(project.includes('(due: 2026-12-06)'));
  assert.ok(read(s.dir, 'logs/demo.md').includes('## 2026-12-01'));
  assert.ok(fs.existsSync(path.join(s.dir, 'inbox/2026-12-01-idea.md')));
  assert.ok(read(s.dir, 'knowledge/guide.md').includes('updated: 2026-11-19'));
});

test('example: only the four note folders are copied, and nothing is overwritten', () => {
  const s = setup();
  fs.mkdirSync(path.join(s.dir, 'projects'), { recursive: true });
  fs.writeFileSync(path.join(s.dir, 'projects/demo.md'), 'mine\n');
  const r = init({ ...s, example: true, today: '2026-11-02' });
  assert.equal(read(s.dir, 'projects/demo.md'), 'mine\n');
  assert.ok(r.skipped.includes('projects/demo.md'));
  assert.ok(!read(s.dir, 'index.md').includes('not copied'));
});

test('example brain lints without errors after init', () => {
  const s = setup();
  init({ ...s, example: true, today: '2026-11-02' });
  assert.equal(lint(s.dir, { today: '2026-11-02' }).errors, 0);
});

test('link-skills symlinks into a fake home and skips existing names', () => {
  const s = setup();
  const r = init({ ...s, linkSkills: true });
  const link = path.join(s.home, '.claude', 'skills', 'handover');
  assert.deepEqual(r.linked, [link]);
  assert.equal(fs.realpathSync(link), fs.realpathSync(path.join(s.dir, 'skills', 'handover')));

  const again = init({ ...s, linkSkills: true });
  assert.deepEqual(again.linked, []);
  assert.deepEqual(again.linkSkipped, [link]);
});

test('default dir is <home>/Ionian/brain', () => {
  const s = setup();
  const r = init({ templateDir: s.templateDir, home: s.home, env: {} });
  assert.equal(r.dir, path.join(s.home, 'Ionian', 'brain'));
});

test('default dir order: BRAIN_DIR, $IONIAN_HOME/brain, <home>/Ionian/brain, never <home>/brain', () => {
  const s = setup();
  fs.mkdirSync(path.join(s.home, 'brain'), { recursive: true });
  const at = (env) => init({ templateDir: s.templateDir, home: s.home, env }).dir;
  assert.equal(at({ BRAIN_DIR: path.join(s.home, 'b1'), IONIAN_HOME: path.join(s.home, 'ih') }), path.join(s.home, 'b1'));
  assert.equal(at({ IONIAN_HOME: path.join(s.home, 'ih') }), path.join(s.home, 'ih', 'brain'));
  assert.notEqual(at({}), path.join(s.home, 'brain'));
});

test('fails clearly when the template folder is missing', () => {
  const s = setup();
  assert.throws(() => init({ ...s, templateDir: path.join(s.dir, 'nope') }), /template folder not found/);
});
