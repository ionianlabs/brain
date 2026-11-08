#!/usr/bin/env node
// brain: init, index and lint for a markdown memory folder.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { init, formatInit, resolveHome } from '../src/init.mjs';
import { computeIndex, writeIndex } from '../src/index.mjs';
import { lint, formatText } from '../src/lint.mjs';
import { openItems, formatOpen } from '../src/open.mjs';
import { isValidDate } from '../src/dates.mjs';

const USAGE = `Usage: brain <command> [options]

Commands:
  init [dir]    Create a brain from the template (default: ~/Ionian/brain)
  index [dir]   Write the index block and the project notes maps (default: .)
  lint [dir]    Check the brain against the spec (default: .)
  open [dir]    List open items across projects, ranked (default: .)

Options:
  init:   --example        also copy the fictional sample notes
          --link-skills    symlink skills into ~/.claude/skills
  index:  --check          write nothing, exit 1 if the index is out of date
  lint:   --json           print findings as JSON
          --stale-days N   days before an active project is stale (default 14)
          --today DATE     treat DATE (YYYY-MM-DD) as today
  open:   --json           print items and summary as JSON
          --org SLUG       only projects of this org
          --project SLUG   only this project
          --due-within N   only items due within N days, plus overdue ones
          --today DATE     treat DATE (YYYY-MM-DD) as today
  -h, --help               show this help
  -v, --version            show the version

Exit codes: 0 ok, 1 errors found, 2 usage error`;

const HELP = {
  init: `Usage: brain init [dir] [--example] [--link-skills]

Create a brain from the template. Never overwrites an existing file.

Arguments:
  dir              where to create the brain (default: ~/Ionian/brain)

Flags:
  --example        also copy the fictional sample notes
  --link-skills    symlink the skills into ~/.claude/skills

Example:
  brain init ~/Ionian/brain --example --link-skills`,
  index: `Usage: brain index [dir] [--check]

Write the generated block in index.md and the notes map in each project file
that has knowledge notes. Creates index.md if it is missing.

Arguments:
  dir              the brain folder (default: .)

Flags:
  --check          write nothing, exit 1 if the index is out of date

Example:
  brain index ~/Ionian/brain --check`,
  lint: `Usage: brain lint [dir] [--json] [--stale-days N] [--today DATE]

Check the brain against the spec. Never writes files.

Arguments:
  dir              the brain folder (default: .)

Flags:
  --json           print findings as JSON
  --stale-days N   days before an active project is stale (default 14)
  --today DATE     treat DATE (YYYY-MM-DD) as today

Example:
  brain lint ~/Ionian/brain --stale-days 7`,
  open: `Usage: brain open [dir] [--json] [--org SLUG] [--project SLUG] [--due-within N] [--today DATE]

List the open items of active and paused projects, ranked by prio, then due
date, then project. Never writes files.

Arguments:
  dir              the brain folder (default: .)

Flags:
  --json           print items and summary as JSON
  --org SLUG       only projects of this org
  --project SLUG   only this project
  --due-within N   only items due within N days, plus overdue ones
  --today DATE     treat DATE (YYYY-MM-DD) as today

Example:
  brain open ~/Ionian/brain --due-within 7`,
};

const OPTIONS = {
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
  example: { type: 'boolean' },
  'link-skills': { type: 'boolean' },
  check: { type: 'boolean' },
  json: { type: 'boolean' },
  'stale-days': { type: 'string' },
  today: { type: 'string' },
  org: { type: 'string' },
  project: { type: 'string' },
  'due-within': { type: 'string' },
};

const ALLOWED = {
  init: ['example', 'link-skills'],
  index: ['check'],
  lint: ['json', 'stale-days', 'today'],
  open: ['json', 'org', 'project', 'due-within', 'today'],
};

function usageError(message) {
  const help = command && Object.hasOwn(HELP, command) ? `brain ${command} --help` : 'brain --help';
  process.stderr.write(`brain: ${message}\nRun \`${help}\` for usage.\n`);
  process.exit(2);
}

let command;
let parsed;
try {
  parsed = parseArgs({ options: OPTIONS, allowPositionals: true });
} catch (err) {
  usageError(err.message);
}
const { values, positionals } = parsed;

command = positionals[0];
if (values.help) {
  process.stdout.write(`${command && Object.hasOwn(HELP, command) ? HELP[command] : USAGE}\n`);
  process.exit(0);
}
if (values.version) {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  process.stdout.write(`${pkg.version}\n`);
  process.exit(0);
}

const rest = positionals.slice(1);
if (!command) usageError('missing command');
if (!Object.hasOwn(ALLOWED, command)) usageError(`unknown command "${command}"`);
if (rest.length > 1) usageError('too many arguments');
for (const name of Object.keys(values)) {
  if (!ALLOWED[command].includes(name)) usageError(`option --${name} does not apply to ${command}`);
}

function existingDir(arg) {
  const dir = path.resolve(arg || '.');
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) usageError(`not a directory: ${dir}`);
  return dir;
}

if (command === 'init') {
  const home = resolveHome();
  let dir = rest[0];
  if (dir === '~' || dir?.startsWith('~/')) dir = path.join(home, dir.slice(1));
  try {
    const result = init({
      dir,
      home,
      example: values.example,
      linkSkills: values['link-skills'],
      // Internal overrides, used by tests.
      templateDir: process.env.BRAIN_TEMPLATE_DIR || undefined,
      exampleDir: process.env.BRAIN_EXAMPLE_DIR || undefined,
    });
    process.stdout.write(`${formatInit(result)}\n`);
  } catch (err) {
    process.stderr.write(`brain: ${err.message}\n`);
    process.exit(1);
  }
} else if (command === 'index') {
  const dir = existingDir(rest[0]);
  if (values.check) {
    const { status, projects } = computeIndex(dir);
    if (status === 'ok' && projects.length === 0) {
      process.stdout.write('index.md is up to date\n');
    } else {
      if (status !== 'ok') process.stderr.write('index.md is out of date: run brain index\n');
      for (const p of projects) process.stderr.write(`${p.rel} notes map is out of date: run brain index\n`);
      process.exit(1);
    }
  } else {
    const { status, projects } = writeIndex(dir);
    process.stdout.write(status === 'ok' ? 'index.md is already up to date\n' : 'index.md updated\n');
    for (const rel of projects) process.stdout.write(`${rel} notes map updated\n`);
  }
} else if (command === 'open') {
  const dir = existingDir(rest[0]);
  let dueWithin;
  if (values['due-within'] !== undefined) {
    if (!/^\d+$/.test(values['due-within'])) usageError('--due-within needs a whole number');
    dueWithin = Number(values['due-within']);
  }
  if (values.today !== undefined && !isValidDate(values.today)) usageError('--today needs a date as YYYY-MM-DD');
  const result = openItems(dir, { org: values.org, project: values.project, dueWithin, today: values.today });
  process.stdout.write(values.json ? `${JSON.stringify(result)}\n` : `${formatOpen(result)}\n`);
} else {
  const dir = existingDir(rest[0]);
  let staleDays;
  if (values['stale-days'] !== undefined) {
    if (!/^\d+$/.test(values['stale-days'])) usageError('--stale-days needs a whole number');
    staleDays = Number(values['stale-days']);
  }
  if (values.today !== undefined && !isValidDate(values.today)) usageError('--today needs a date as YYYY-MM-DD');
  const result = lint(dir, { staleDays, today: values.today });
  process.stdout.write(values.json ? `${JSON.stringify(result)}\n` : `${formatText(result)}\n`);
  process.exit(result.errors > 0 ? 1 : 0);
}
