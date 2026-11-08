import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildPlugin, pluginFiles } from '../scripts/build-plugin.mjs';
import { cliCommand, FROM_CLONE } from '../src/init.mjs';
import { brainDir, context, output, CLI } from '../plugin/hooks/session-start.mjs';
import { HERE, tmpDir, writeTree } from './helpers.mjs';

const ROOT = path.join(HERE, '..');
const HOOK = path.join(ROOT, 'plugin', 'hooks', 'session-start.mjs');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const body = (text) => text.replace(/^---\n[\s\S]*?\n---\n/, '');

test('plugin/ is in sync with template/skills and package.json', () => {
  assert.deepEqual(buildPlugin({ rootDir: ROOT, check: true }), [], 'run npm run build:plugin');
});

test('builds plugin skills with ~/Ionian/brain and without the type key', () => {
  const root = tmpDir();
  writeTree(root, {
    'package.json': '{"version":"9.9.9","license":"MIT"}',
    'template/skills/demo/SKILL.md': '---\nname: demo\ntype: skill\ndescription: Demo.\n---\n\nRead {{BRAIN_DIR}}/index.md with {{BRAIN_CLI}}. type: stays in the body.\n',
    'bin/brain.mjs': '// cli\n',
    'plugin/skills/gone/SKILL.md': 'stale\n',
    'plugin/cli/src/old.mjs': 'stale\n',
  });
  assert.deepEqual(buildPlugin({ rootDir: root, check: true }).sort(), [
    '.claude-plugin/plugin.json', 'cli/bin/brain.mjs', 'cli/package.json', 'cli/src/old.mjs', 'cli/template/skills/demo/SKILL.md', 'skills/demo/SKILL.md', 'skills/gone/SKILL.md',
  ]);
  buildPlugin({ rootDir: root });
  const skill = fs.readFileSync(path.join(root, 'plugin/skills/demo/SKILL.md'), 'utf8');
  assert.equal(skill, '---\nname: demo\ndescription: Demo.\n---\n\nRead ~/Ionian/brain/index.md with `node "<skill>/../../cli/bin/brain.mjs"`, where `<skill>` is the folder that holds this SKILL.md. type: stays in the body.\n');
  assert.ok(!fs.existsSync(path.join(root, 'plugin/skills/gone/SKILL.md')));
  assert.ok(!fs.existsSync(path.join(root, 'plugin/cli/src/old.mjs')));
  assert.equal(readJson(path.join(root, 'plugin/cli/package.json')).dependencies, undefined);
  assert.equal(readJson(path.join(root, 'plugin/.claude-plugin/plugin.json')).version, '9.9.9');
  assert.deepEqual(buildPlugin({ rootDir: root, check: true }), []);
});

test('Copilot prompt files say the same as the skills', () => {
  for (const name of ['agenda', 'drop', 'triage', 'sync', 'aware']) {
    const skill = fs.readFileSync(path.join(ROOT, 'template/skills', name, 'SKILL.md'), 'utf8');
    const prompt = fs.readFileSync(path.join(ROOT, 'template/.github/prompts', `${name}.prompt.md`), 'utf8');
    assert.equal(body(prompt), body(skill), name);
  }
});

test('F6.2 plugin/skills holds agenda, drop, triage, sync and aware, and the build leaves plugin/agents alone', () => {
  assert.deepEqual(fs.readdirSync(path.join(ROOT, 'plugin/skills')).sort(), ['agenda', 'aware', 'drop', 'sync', 'triage']);
  const files = Object.keys(pluginFiles({ rootDir: ROOT }));
  assert.ok(!files.some((f) => f.startsWith('agents/')));
  assert.ok(files.some((f) => f.startsWith('skills/')) && files.some((f) => f.startsWith('cli/')));
});

test('F1.4 the built drop skill has no placeholders and matches its prompt', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'plugin/skills/drop/SKILL.md'), 'utf8');
  assert.ok(!skill.includes('{{'));
  const prompt = fs.readFileSync(path.join(ROOT, 'template/.github/prompts/drop.prompt.md'), 'utf8');
  assert.equal(body(prompt), body(fs.readFileSync(path.join(ROOT, 'template/skills/drop/SKILL.md'), 'utf8')));
});

test('F5.4 the reader and scribe agents declare exactly their tools', () => {
  const tools = (name) => {
    const fm = fs.readFileSync(path.join(ROOT, 'plugin/agents', `${name}.md`), 'utf8').match(/^---\n([\s\S]*?)\n---\n/)[1];
    return fm.split('\n').filter((l) => l.startsWith('tools:'));
  };
  assert.deepEqual(tools('reader'), ['tools: Read, Grep, Glob']);
  assert.deepEqual(tools('scribe'), ['tools: Read, Edit, Write, Bash']);
});

test('marketplace lists the plugin, with no manifest that would take precedence', () => {
  const market = readJson(path.join(ROOT, '.claude-plugin/marketplace.json'));
  assert.equal(market.name, 'ionianlabs');
  assert.ok(market.owner?.name);
  assert.equal(market.plugins.length, 1);
  const [entry] = market.plugins;
  assert.equal(entry.source, './plugin');
  const manifest = readJson(path.join(ROOT, 'plugin/.claude-plugin/plugin.json'));
  assert.equal(manifest.name, entry.name);
  assert.equal(manifest.version, readJson(path.join(ROOT, 'package.json')).version);
  // Copilot and VS Code read these first. A root plugin.json also switches
  // Copilot to Agent Plugins 1.0, which ignores hooks/hooks.json.
  for (const rel of ['marketplace.json', '.plugin/marketplace.json', '.github/plugin/marketplace.json', 'plugin/plugin.json', 'plugin/.plugin/plugin.json']) {
    assert.ok(!fs.existsSync(path.join(ROOT, rel)), `${rel} must not exist`);
  }
  // A bin/ or CLAUDE.md in the plugin root would be picked up by hosts.
  for (const rel of ['plugin/bin', 'plugin/CLAUDE.md', 'plugin/package.json']) {
    assert.ok(!fs.existsSync(path.join(ROOT, rel)), `${rel} must not exist`);
  }
});

test('hooks.json runs the session-start script', () => {
  const hooks = readJson(path.join(ROOT, 'plugin/hooks/hooks.json'));
  const [group] = hooks.hooks.SessionStart;
  const [hook] = group.hooks;
  assert.equal(hook.type, 'command');
  assert.equal(hook.command, 'node "${CLAUDE_PLUGIN_ROOT}/hooks/session-start.mjs"');
  assert.ok(fs.existsSync(HOOK));
});

test('brainDir: BRAIN_DIR, then $IONIAN_HOME/brain, then ~/Ionian/brain', () => {
  assert.equal(brainDir({}, '/h'), path.join('/h', 'Ionian', 'brain'));
  assert.equal(brainDir({ BRAIN_DIR: '  ', IONIAN_HOME: ' ' }, '/h'), path.join('/h', 'Ionian', 'brain'));
  assert.equal(brainDir({ IONIAN_HOME: '/i/home' }, '/h'), path.join(path.resolve('/i/home'), 'brain'));
  assert.equal(brainDir({ IONIAN_HOME: '~/ih' }, '/h'), path.join('/h', 'ih', 'brain'));
  assert.equal(brainDir({ BRAIN_DIR: '/x/y', IONIAN_HOME: '/i/home' }, '/h'), path.resolve('/x/y'));
  assert.equal(brainDir({ BRAIN_DIR: '~' }, '/h'), '/h');
  assert.equal(brainDir({ BRAIN_DIR: '~/notes' }, '/h'), path.join('/h', 'notes'));
  assert.equal(brainDir({ BRAIN_DIR: '/x/y' }, '/h'), path.resolve('/x/y'));
});

test('brainDir never falls back to ~/brain, even if it exists', () => {
  const home = tmpDir();
  fs.mkdirSync(path.join(home, 'brain'), { recursive: true });
  fs.writeFileSync(path.join(home, 'brain', 'AGENTS.md'), 'x\n');
  assert.equal(brainDir({}, home), path.join(home, 'Ionian', 'brain'));
  assert.equal(brainDir({ IONIAN_HOME: path.join(home, 'ih') }, home), path.join(home, 'ih', 'brain'));
});

test('hook context names the path only, and both output shapes carry it', () => {
  const root = tmpDir();
  writeTree(root, { 'b/AGENTS.md': '---\ntype: guide\n---\n\nSECRET-RULE\n', 'b/projects/p.md': 'SECRET-NOTE\n' });
  const found = context(path.join(root, 'b'));
  assert.ok(found.includes(`${path.join(root, 'b')}/AGENTS.md`));
  assert.ok(found.includes(CLI) && CLI.endsWith(`${path.join('plugin', 'cli', 'bin', 'brain.mjs')}"`));
  assert.ok(!/SECRET/.test(found));
  assert.match(context(path.join(root, 'missing')), /no brain folder was found/);
  const out = JSON.parse(output('hello'));
  assert.equal(out.additionalContext, 'hello');
  assert.deepEqual(out.hookSpecificOutput, { hookEventName: 'SessionStart', additionalContext: 'hello' });
});

test('hook script prints one JSON line and exits 0', () => {
  const home = tmpDir();
  const r = spawnSync(process.execPath, [HOOK], { encoding: 'utf8', env: { ...process.env, HOME: home, USERPROFILE: home, BRAIN_DIR: '', IONIAN_HOME: '' } });
  assert.equal(r.status, 0);
  assert.equal(r.stderr, '');
  assert.match(JSON.parse(r.stdout).additionalContext, /no brain folder was found/);
});

test('the bundled CLI runs and creates a brain on its own', () => {
  const cli = path.join(ROOT, 'plugin', 'cli', 'bin', 'brain.mjs');
  const v = spawnSync(process.execPath, [cli, '--version'], { encoding: 'utf8' });
  assert.equal(v.stdout.trim(), readJson(path.join(ROOT, 'package.json')).version);
  const dir = path.join(tmpDir(), 'b');
  const r = spawnSync(process.execPath, [cli, 'init', dir, '--example'], { encoding: 'utf8', env: { ...process.env, BRAIN_HOME: tmpDir() } });
  assert.equal(r.status, 0, r.stderr);
  const skill = fs.readFileSync(path.join(dir, 'skills/agenda/SKILL.md'), 'utf8');
  // The plugin copy moves on every update, so the new brain points at a clone.
  assert.ok(skill.includes(FROM_CLONE));
  assert.ok(!skill.includes(cli));
  assert.ok(!skill.includes('{{'));
  assert.equal(spawnSync(process.execPath, [cli, 'lint', dir], { encoding: 'utf8' }).status, 0);
});

test('nothing tells the user or an agent to use npx or npm', () => {
  const r = spawnSync('git', ['grep', '-n', '-i', '-I', '-E', '\\bnpx\\b', '--', '.'], { cwd: ROOT, encoding: 'utf8' });
  const hits = r.stdout.split('\n').filter((l) => l && !l.startsWith('test/plugin.test.mjs'));
  assert.deepEqual(hits, []);
  for (const rel of ['plugin/skills/agenda/SKILL.md', 'plugin/skills/sync/SKILL.md', 'plugin/skills/drop/SKILL.md', 'plugin/skills/triage/SKILL.md', 'plugin/agents/reader.md', 'plugin/agents/scribe.md', 'plugin/hooks/session-start.mjs', 'docs/plugin.md']) {
    assert.ok(!/\bnpx\b/i.test(fs.readFileSync(path.join(ROOT, rel), 'utf8')), rel);
  }
});

test('cliCommand points at this copy, or at a clone when run from the plugin', () => {
  const root = tmpDir();
  writeTree(root, { 'plugin/.claude-plugin/plugin.json': '{}', 'plugin/cli/bin/brain.mjs': '' });
  assert.equal(cliCommand(path.join(root, 'plugin', 'cli')), FROM_CLONE);
  assert.equal(cliCommand(path.join(root, 'clone')), `\`node "${path.join(root, 'clone', 'bin', 'brain.mjs')}"\``);
});
