import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { buildPlugin, pluginFiles } from '../scripts/build-plugin.mjs';
import { cliCommand, FROM_CLONE } from '../src/init.mjs';
import { HERE, tmpDir, writeTree } from './helpers.mjs';

const ROOT = path.join(HERE, '..');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const body = (text) => text.replace(/^---\n[\s\S]*?\n---\n/, '');

test('plugin/ is in sync with template/skills and package.json', () => {
  assert.deepEqual(buildPlugin({ rootDir: ROOT, check: true }), [], 'run npm run build:plugin');
});

test('builds plugin skills with ~/Ionian/brain and without the type key, and removes everything else', () => {
  const root = tmpDir();
  writeTree(root, {
    'package.json': '{"version":"9.9.9","license":"MIT"}',
    'template/skills/demo/SKILL.md': '---\nname: demo\ntype: skill\ndescription: Demo.\n---\n\nRead {{BRAIN_DIR}}/index.md. type: stays in the body.\n',
    'bin/brain.mjs': '// cli\n',
    'plugin/skills/gone/SKILL.md': 'stale\n',
    'plugin/cli/src/old.mjs': 'stale\n',
    'plugin/agents/reader.md': 'stale\n',
    'plugin/hooks/hooks.json': 'stale\n',
  });
  assert.deepEqual(buildPlugin({ rootDir: root, check: true }).sort(), [
    '.claude-plugin/plugin.json', 'agents/reader.md', 'cli/src/old.mjs', 'hooks/hooks.json', 'skills/demo/SKILL.md', 'skills/gone/SKILL.md',
  ]);
  buildPlugin({ rootDir: root });
  const skill = fs.readFileSync(path.join(root, 'plugin/skills/demo/SKILL.md'), 'utf8');
  assert.equal(skill, '---\nname: demo\ndescription: Demo.\n---\n\nRead ~/Ionian/brain/index.md. type: stays in the body.\n');
  for (const d of ['cli', 'agents', 'hooks', 'skills/gone']) assert.ok(!fs.existsSync(path.join(root, 'plugin', d)), d);
  assert.equal(readJson(path.join(root, 'plugin/.claude-plugin/plugin.json')).version, '9.9.9');
  assert.deepEqual(buildPlugin({ rootDir: root, check: true }), []);
});

test('Copilot prompt files say the same as the skills', () => {
  for (const name of ['agenda', 'drop', 'triage', 'sync', 'aware', 'outbox', 'nucleus', 'blind-spots']) {
    const skill = fs.readFileSync(path.join(ROOT, 'template/skills', name, 'SKILL.md'), 'utf8');
    const prompt = fs.readFileSync(path.join(ROOT, 'template/.github/prompts', `${name}.prompt.md`), 'utf8');
    assert.equal(body(prompt), body(skill), name);
  }
});

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const SKILLS = ['agenda', 'aware', 'blind-spots', 'drop', 'nucleus', 'outbox', 'sync', 'triage'];

test('the plugin holds plugin.json and the eight SKILL.md files, nothing else', () => {
  const files = walk(path.join(ROOT, 'plugin')).map((f) => path.relative(path.join(ROOT, 'plugin'), f)).sort();
  assert.deepEqual(files, ['.claude-plugin/plugin.json', ...SKILLS.map((n) => `skills/${n}/SKILL.md`)]);
  assert.deepEqual(Object.keys(pluginFiles({ rootDir: ROOT })).sort(), files);
});

test('no skill, built or template, mentions the CLI placeholder, brain.mjs, scribe or reader', () => {
  for (const rel of [...SKILLS.map((n) => `plugin/skills/${n}/SKILL.md`), ...SKILLS.map((n) => `template/skills/${n}/SKILL.md`), ...SKILLS.map((n) => `template/.github/prompts/${n}.prompt.md`)]) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.ok(!/<cli>|\{\{BRAIN_CLI\}\}|brain\.mjs|\bscribe\b|\breader\b/i.test(text), rel);
  }
});

test('every skill finds the brain with the same paragraph and stops without an AGENTS.md', () => {
  const para = (n) => fs.readFileSync(path.join(ROOT, 'plugin/skills', n, 'SKILL.md'), 'utf8').split('\n').find((l) => l.startsWith('Find the brain first.'));
  assert.ok(para('agenda').includes('https://github.com/ionianlabs/brain'));
  assert.ok(para('agenda').includes('the folder the user shared or named in this conversation'));
  for (const n of SKILLS) assert.equal(para(n), para('agenda'), n);
});

test('skills that create notes keep the index by hand and never rewrite the block', () => {
  for (const n of ['aware', 'sync', 'triage']) {
    const text = fs.readFileSync(path.join(ROOT, 'plugin/skills', n, 'SKILL.md'), 'utf8');
    assert.match(text, /## Index bookkeeping/, n);
    assert.match(text, /Never rewrite the whole generated block/, n);
    assert.match(text, /brain:notes start/, n);
  }
  for (const n of ['sync', 'triage']) {
    assert.match(fs.readFileSync(path.join(ROOT, 'plugin/skills', n, 'SKILL.md'), 'utf8'), /If the `brain` CLI is available in a terminal, `brain index` and `brain lint` can tidy up afterwards; never required\./, n);
  }
});

test('F1.4 the built drop skill has no placeholders and matches its prompt', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'plugin/skills/drop/SKILL.md'), 'utf8');
  assert.ok(!skill.includes('{{'));
  const prompt = fs.readFileSync(path.join(ROOT, 'template/.github/prompts/drop.prompt.md'), 'utf8');
  assert.equal(body(prompt), body(fs.readFileSync(path.join(ROOT, 'template/skills/drop/SKILL.md'), 'utf8')));
});

test('marketplace lists the plugin, with no manifest that would take precedence', () => {
  const market = readJson(path.join(ROOT, '.claude-plugin/marketplace.json'));
  assert.equal(market.name, 'ionianlabs');
  assert.ok(market.owner?.name);
  const entry = market.plugins.find((p) => p.name === 'brain');
  assert.ok(entry, 'a brain entry');
  assert.equal(entry.source, './plugin');
  assert.deepEqual(market.plugins.filter((p) => p.source === './plugin').map((p) => p.name), ['brain']);
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

test('cliCommand points at this copy, or at a clone when run from a copy that sits in a plugin', () => {
  const root = tmpDir();
  writeTree(root, { 'plugin/.claude-plugin/plugin.json': '{}', 'plugin/cli/bin/brain.mjs': '' });
  assert.equal(cliCommand(path.join(root, 'plugin', 'cli')), FROM_CLONE);
  assert.equal(cliCommand(path.join(root, 'clone')), `\`node "${path.join(root, 'clone', 'bin', 'brain.mjs')}"\``);
});

test('no em or en dashes under template/ and plugin/', () => {
  const files = [...walk(path.join(ROOT, 'template')), ...walk(path.join(ROOT, 'plugin'))];
  assert.ok(files.length > 0);
  const bad = files.filter((f) => /[\u2013\u2014]/.test(fs.readFileSync(f, 'utf8')));
  assert.deepEqual(bad, []);
});

test('the agenda skill is built as tables, with the p0 overflow line and no CLI or lint', () => {
  for (const rel of ['plugin/skills/agenda/SKILL.md', 'template/skills/agenda/SKILL.md', 'template/.github/prompts/agenda.prompt.md']) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.ok(text.includes('| Prio | What | Project | Due | Talk to |'), rel);
    assert.ok(text.includes('| What | Project | Waiting for | Talk to |'), rel);
    assert.match(text, /\*\*12 items are p0\.\*\* p0 means today or blocking others, so most need re-ranking\./, rel);
    assert.match(text, /\*12 more need you\. Say "agenda everything" to see them\.\*/, rel);
    assert.match(text, /\*\*Next:\*\*/, rel);
    assert.match(text, /LAST parenthesis group/, rel);
    assert.ok(!/hygiene|lint/i.test(text), rel);
  }
});

test('nothing tells the user or an agent to use npx', () => {
  const r = spawnSync('git', ['grep', '-n', '-i', '-I', '-E', '\\bnpx\\b', '--', '.'], { cwd: ROOT, encoding: 'utf8' });
  const hits = r.stdout.split('\n').filter((l) => l && !l.startsWith('test/plugin.test.mjs'));
  assert.deepEqual(hits, []);
});

test('no skill or prompt description contains the characters < or > (the hosted Claude app rejects them as XML tags)', () => {
  const files = [
    ...walk(path.join(ROOT, 'template/skills')),
    ...walk(path.join(ROOT, 'plugin/skills')),
    ...walk(path.join(ROOT, 'template/.github/prompts')),
  ].filter((f) => f.endsWith('.md'));
  assert.ok(files.length >= 24, `found ${files.length} files`);
  for (const f of files) {
    const m = fs.readFileSync(f, 'utf8').match(/^description: (.*)$/m);
    assert.ok(m, `${f} has a description`);
    assert.ok(!/[<>]/.test(m[1]), `${path.relative(ROOT, f)}: ${m[1]}`);
  }
});

test('F2.24 and F2.25: the outbox skill and its prompt exist, with the trigger phrases and the shared brain lookup', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'template/skills/outbox/SKILL.md'), 'utf8');
  const prompt = fs.readFileSync(path.join(ROOT, 'template/.github/prompts/outbox.prompt.md'), 'utf8');
  assert.equal(body(prompt), body(skill));
  const descr = skill.match(/^description: (.*)$/m)[1];
  for (const phrase of ['"outbox"', '"stage for"', '"what can I share with"', '"prepare an audience update"', 'stage for steering']) assert.ok(descr.includes(phrase), phrase);
  const para = (t) => t.split('\n').find((l) => l.startsWith('Find the brain first.'));
  const agenda = fs.readFileSync(path.join(ROOT, 'template/skills/agenda/SKILL.md'), 'utf8');
  assert.equal(para(skill), para(agenda));
});

test('F2.8: the outbox skill names the skip categories for draft, deprecated and personal notes', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'template/skills/outbox/SKILL.md'), 'utf8');
  for (const c of ['draft, skipped', 'deprecated, skipped', 'personal, skipped']) assert.ok(skill.includes(c), c);
});

test('F4.3 the spec and template Layout tables have an outbox row', () => {
  for (const f of ['docs/spec.md', 'template/AGENTS.md']) {
    assert.match(fs.readFileSync(path.join(ROOT, f), 'utf8'), /^\| `outbox\//m, f);
  }
});

test('F4.3 every doc that lists the skills names all eight', () => {
  const six = ['agenda', 'drop', 'triage', 'sync', 'aware', 'outbox', 'nucleus', 'blind-spots'];
  for (const f of ['README.md', 'docs/copilot.md', 'docs/plugin.md', 'docs/spec.md', 'template/AGENTS.md']) {
    const lines = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n');
    const listing = lines.filter((l) => /`agenda`/.test(l) && /`triage`/.test(l));
    assert.ok(listing.length > 0, f);
    for (const l of listing) for (const n of six) assert.ok(l.includes('`' + n + '`'), `${f}: ${n} missing in: ${l}`);
  }
});

test('F4.3 every manifest and the README say eight skills and name outbox, nucleus and blind-spots', () => {
  const texts = {
    'README.md': fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8'),
    'package.json': readJson(path.join(ROOT, 'package.json')).description,
    'plugin.json': readJson(path.join(ROOT, 'plugin/.claude-plugin/plugin.json')).description,
    'marketplace.json': readJson(path.join(ROOT, '.claude-plugin/marketplace.json')).plugins.find((p) => p.name === 'brain').description,
  };
  for (const [name, text] of Object.entries(texts)) {
    assert.match(text, /\beight skills\b/i, name);
    assert.match(text, /blind-spots/, name);
    assert.match(text, /outbox/, name);
    assert.match(text, /nucleus/, name);
    assert.ok(!/\b(five|six|seven) skills\b/i.test(text), name);
  }
});

const OUTBOX_COPIES = ['template/skills/outbox/SKILL.md', 'plugin/skills/outbox/SKILL.md', 'template/.github/prompts/outbox.prompt.md'];

test('the outbox skill puts Handback before Scope, and rule 13 names the Self-check step', () => {
  for (const rel of OUTBOX_COPIES) {
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const stepOf = (re) => Number(text.match(re)?.[1]);
  const handback = stepOf(/^(\d+)\. Handback\b/m);
  const scope = stepOf(/^(\d+)\. Scope\b/m);
  const selfCheck = stepOf(/^(\d+)\. Self-check\b/m);
  assert.ok(![handback, scope, selfCheck].some(Number.isNaN), 'step headings found');
  assert.ok(handback < scope, 'Handback before Scope');
  assert.match(text, new RegExp(`^13\\. Self-check, step ${selfCheck}\\.`, 'm'));
  assert.match(text, /^\s+- Two lines: "not relevant to <audience>: N" and "already shared: N"\./m);
  assert.match(text, /already shared: 0\n/);
  assert.match(text, /^12\. Summary:.*confidential.*inbox.*other org.*draft.*deprecated.*personal.*already shared/m);
  }
});

test('the outbox skill: title line is part of a person header, withdraw drops empty sections, handback goes under the date heading, multi-project slug', () => {
  for (const rel of OUTBOX_COPIES) {
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  assert.match(text, /frontmatter plus its title line/);
  assert.match(text, /never anything below the title line/);
  assert.match(text, /no items[^.\n]*remove (that|the) section'?s? heading/i);
  assert.match(text, /`Done: published to <audience>: #4-#6`[^.\n]*under[^.\n]*`## YYYY-MM-DD`/);
  assert.match(text, /joined with `-`/);
  }
  assert.match(fs.readFileSync(path.join(ROOT, 'template/AGENTS.md'), 'utf8'), /frontmatter and title line are shareable; the body below is private/);
});

const NUCLEUS_COPIES = ['template/skills/nucleus/SKILL.md', 'plugin/skills/nucleus/SKILL.md', 'template/.github/prompts/nucleus.prompt.md'];

test('nucleus: the skill and its prompt exist, with the trigger phrases and the shared brain lookup', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'template/skills/nucleus/SKILL.md'), 'utf8');
  const prompt = fs.readFileSync(path.join(ROOT, 'template/.github/prompts/nucleus.prompt.md'), 'utf8');
  assert.equal(body(prompt), body(skill));
  const descr = skill.match(/^description: (.*)$/m)[1];
  for (const phrase of ['"nucleus"', '"what is the nucleus here"', '"what do I need to get moving"', '"what do I need from this meeting"', '"prep the questions for"', '"close the nucleus"']) assert.ok(descr.includes(phrase), phrase);
  const para = (t) => t.split('\n').find((l) => l.startsWith('Find the brain first.'));
  assert.equal(para(skill), para(fs.readFileSync(path.join(ROOT, 'template/skills/agenda/SKILL.md'), 'utf8')));
});

test('nucleus F1: the frame has the test, the safety question, four kinds and a five-line output', () => {
  for (const rel of NUCLEUS_COPIES) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.ok(text.includes('"If I had only this, could I start?"'), rel);
    assert.ok(text.includes('"What don\'t I know that I should?"'), rel);
    assert.ok(text.includes('Nucleus: <the unblocker>\nKind: fact | their decision | my decision | first action\nHolder: <who has it, or "me">\nParked: <what waits>\nSituation: <the kind of situation, in general words>\n'), rel);
    assert.match(text, /to verify/, rel);
    assert.match(text, /`Inferred:`[^\n]*`status: draft`[^\n]*`stale_after`/, rel);
  }
});

test('nucleus F2: the toolkit names ten tools, is never started unasked and caps the questions at five', () => {
  for (const rel of NUCLEUS_COPIES) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const tool of ['Shell', 'Walk-through', 'Filters', 'Routing', 'Dependency order', 'Question forms', 'Pre-mortem', 'Catch-all', 'Touch points', 'Meeting fit']) {
      assert.match(text, new RegExp(`^\\| ${tool} \\|`, 'm'), `${rel}: ${tool}`);
    }
    assert.match(text, /Never start layer 2 unasked/, rel);
    assert.match(text, /At most five questions/, rel);
    assert.ok(text.includes('"What do you know about this that I don\'t?"'), rel);
  }
});

test('nucleus F3: one capture on request, statuses for the loop, and no other write', () => {
  for (const rel of NUCLEUS_COPIES) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.ok(text.includes('inbox/YYYY-MM-DD-nucleus-<slug>.md'), rel);
    assert.match(text, /`answered`, `partly` or `open`/, rel);
    assert.match(text, /`Said\(Name\):`/, rel);
    assert.match(text, /Never edit a project file, a log or a knowledge note/, rel);
    assert.match(text, /Never overwrite/, rel);
    assert.match(text, /Never open `\.confidential\/`/, rel);
    assert.match(text, /Never contact anyone/, rel);
    assert.match(text, /no name of a person, org or project/, rel);
  }
});

test('nucleus: the Copilot prompt may edit files, for the capture', () => {
  const prompt = fs.readFileSync(path.join(ROOT, 'template/.github/prompts/nucleus.prompt.md'), 'utf8');
  assert.match(prompt, /^tools: \['search\/codebase', 'edit\/editFiles'\]$/m);
  assert.match(prompt, /^type: prompt$/m);
});

test('the spec describes the nucleus skill', () => {
  assert.match(fs.readFileSync(path.join(ROOT, 'docs/spec.md'), 'utf8'), /^### `nucleus`$/m);
});

const BLIND_COPIES = ['template/skills/blind-spots/SKILL.md', 'plugin/skills/blind-spots/SKILL.md', 'template/.github/prompts/blind-spots.prompt.md'];

test('blind-spots: the skill and its prompt exist, with the trigger phrases and the shared brain lookup', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'template/skills/blind-spots/SKILL.md'), 'utf8');
  const prompt = fs.readFileSync(path.join(ROOT, 'template/.github/prompts/blind-spots.prompt.md'), 'utf8');
  assert.equal(body(prompt), body(skill));
  assert.match(prompt, /^tools: \['search\/codebase', 'edit\/editFiles'\]$/m);
  const descr = skill.match(/^description: (.*)$/m)[1];
  for (const phrase of ['"blind spots"', '"gap check"', '"what am I missing"']) assert.ok(descr.includes(phrase), phrase);
  const para = (t) => t.split('\n').find((l) => l.startsWith('Find the brain first.'));
  assert.equal(para(skill), para(fs.readFileSync(path.join(ROOT, 'template/skills/agenda/SKILL.md'), 'utf8')));
});

test('blind-spots: plans back from dated events, drops what is covered, caps at ten and names the project', () => {
  for (const rel of BLIND_COPIES) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const check of ['Decisions', 'Information', 'Inputs', 'People', 'Prep', 'Rhythm', 'Promises']) assert.match(text, new RegExp(`^\\| ${check} \\|`, 'm'), `${rel}: ${check}`);
    assert.match(text, /The newest entry wins/, rel);
    assert.match(text, /At most 10 gaps/, rel);
    assert.match(text, /Every line names its project/, rel);
    assert.match(text, /already an open item/, rel);
    assert.match(text, /`phase: active`/, rel);
    assert.match(text, /`stale_after`/, rel);
  }
});

test('blind-spots: read-only, one capture per org on request, org boundary and no confidential folder', () => {
  for (const rel of BLIND_COPIES) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.ok(text.includes('inbox/YYYY-MM-DD-blind-spots-<org>.md'), rel);
    assert.match(text, /one capture per org/i, rel);
    assert.match(text, /`Inferred:`/, rel);
    assert.match(text, /Never overwrite/, rel);
    assert.match(text, /Never edit a project file, a log or a note/, rel);
    assert.match(text, /Never open `\.confidential\/`/, rel);
    assert.match(text, /Never mix one org's details into another's/, rel);
    assert.match(text, /`nucleus`/, rel);
  }
});

test('the spec describes the blind-spots skill', () => {
  assert.match(fs.readFileSync(path.join(ROOT, 'docs/spec.md'), 'utf8'), /^### `blind-spots`$/m);
});

test('every skill states what it works on and the question it answers, and the README, plugin and Copilot docs carry the same table', () => {
  const defs = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8').split('\n').map((l) => l.match(/^\| `([a-z-]+)` \| ([^|]+) \| ([^|]+\?) \|$/)).filter(Boolean);
  assert.deepEqual(defs.map((r) => r[1]).sort(), SKILLS);
  for (const [row, name, works, question] of defs) {
    for (const rel of [`template/skills/${name}/SKILL.md`, `plugin/skills/${name}/SKILL.md`, `template/.github/prompts/${name}.prompt.md`]) {
      assert.ok(fs.readFileSync(path.join(ROOT, rel), 'utf8').includes(`**Works on:** ${works}. **Question:** ${question}\n`), `${rel}: ${row}`);
    }
    for (const doc of ['docs/plugin.md', 'docs/copilot.md']) assert.ok(fs.readFileSync(path.join(ROOT, doc), 'utf8').includes(row), `${doc}: ${name}`);
  }
  assert.equal(new Set(defs.map((r) => r[3])).size, SKILLS.length, 'no two skills answer the same question');
});
