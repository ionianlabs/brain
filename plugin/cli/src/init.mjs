// brain init: copy the template (and optionally the example) into a folder.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeIndex } from './index.mjs';
import { isValidDate, daysBetween, addDays, localDate } from './dates.mjs';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const EXAMPLE_BASE_DATE = '2026-11-02';

const EMPTY_DIRS = ['projects', 'logs', 'inbox', 'knowledge', '.confidential'];
const EXAMPLE_DIRS = ['projects', 'logs', 'inbox', 'knowledge'];
const SUBSTITUTE_IN = ['skills/', '.github/prompts/'];
// How the skills in a new brain run this CLI: the copy init runs from. The copy
// inside the plugin moves with every plugin update, so a brain created from it
// points at a clone instead. Plugin sessions get the current command anyway.
export const FROM_CLONE = '`node bin/brain.mjs` in a clone of `https://github.com/ionianlabs/brain`';

export function cliCommand(packageRoot = PACKAGE_ROOT) {
  const inPlugin = path.basename(packageRoot) === 'cli' && fs.existsSync(path.join(packageRoot, '..', '.claude-plugin', 'plugin.json'));
  return inPlugin ? FROM_CLONE : `\`node "${path.join(packageRoot, 'bin', 'brain.mjs')}"\``;
}

export function resolveHome(options = {}) {
  return options.home || process.env.BRAIN_HOME || os.homedir();
}

function listFiles(dir) {
  const out = [];
  const visit = (rel) => {
    const entries = fs.readdirSync(path.join(dir, rel), { withFileTypes: true });
    for (const e of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const next = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) visit(next);
      else if (e.isFile()) out.push(next);
    }
  };
  visit('');
  return out;
}

// Write a file only if it does not exist yet. Returns true when written.
function writeNew(dest, data) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    fs.writeFileSync(dest, data, { flag: 'wx' });
    return true;
  } catch (err) {
    if (err.code === 'EEXIST') return false;
    throw err;
  }
}

function shiftDates(content, days) {
  return content.replace(/(?<!\d)\d{4}-\d{2}-\d{2}(?!\d)/g, (d) => (isValidDate(d) ? addDays(d, days) : d));
}

export function init(options = {}) {
  const home = resolveHome(options);
  const dir = path.resolve(options.dir || path.join(home, 'brain'));
  const templateDir = options.templateDir || path.join(PACKAGE_ROOT, 'template');
  const exampleDir = options.exampleDir || path.join(PACKAGE_ROOT, 'examples', 'sample-brain');
  const result = { dir, created: [], skipped: [], linked: [], linkSkipped: [] };

  if (!fs.existsSync(templateDir)) throw new Error(`template folder not found: ${templateDir}`);
  fs.mkdirSync(dir, { recursive: true });

  const put = (rel, data) => (writeNew(path.join(dir, rel), data) ? result.created : result.skipped).push(rel);

  // Template. npm drops .gitignore files, so it is stored as "gitignore".
  for (const rel of listFiles(templateDir)) {
    const destRel = rel === 'gitignore' ? '.gitignore' : rel;
    let data = fs.readFileSync(path.join(templateDir, rel));
    if (SUBSTITUTE_IN.some((p) => destRel.startsWith(p))) {
      data = data.toString('utf8').split('{{BRAIN_DIR}}').join(dir).split('{{BRAIN_CLI}}').join(cliCommand());
    }
    put(destRel, data);
  }

  // npm does not pack empty folders, so create them here.
  for (const d of EMPTY_DIRS) fs.mkdirSync(path.join(dir, d), { recursive: true });

  if (options.example) copyExample(exampleDir, options.today || localDate(), put);
  if (options.linkSkills) linkSkills(dir, home, result);

  result.index = writeIndex(dir).status;
  return result;
}

// Copy the sample notes, moving every date so the example looks current.
function copyExample(exampleDir, today, put) {
  if (!fs.existsSync(exampleDir)) throw new Error(`example folder not found: ${exampleDir}`);
  const days = daysBetween(EXAMPLE_BASE_DATE, today);
  for (const rel of listFiles(exampleDir)) {
    if (!EXAMPLE_DIRS.includes(rel.split('/')[0])) continue;
    const raw = fs.readFileSync(path.join(exampleDir, rel));
    if (!rel.endsWith('.md')) {
      put(rel, raw);
      continue;
    }
    put(shiftDates(rel, days), shiftDates(raw.toString('utf8'), days));
  }
}

// Symlink <dir>/skills/<name> into <home>/.claude/skills/<name>.
function linkSkills(dir, home, result) {
  const skillsDir = path.join(dir, 'skills');
  if (!fs.existsSync(skillsDir)) return;
  const target = path.join(home, '.claude', 'skills');
  fs.mkdirSync(target, { recursive: true });
  const names = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  for (const name of names) {
    const link = path.join(target, name);
    let exists = true;
    try {
      fs.lstatSync(link);
    } catch {
      exists = false;
    }
    if (exists) {
      result.linkSkipped.push(link);
    } else {
      fs.symlinkSync(path.join(skillsDir, name), link, 'dir');
      result.linked.push(link);
    }
  }
}

export function formatInit(result) {
  const lines = [`Brain ready at ${result.dir}`, `Created ${result.created.length} files.`];
  if (result.skipped.length) {
    lines.push(`Skipped ${result.skipped.length} existing files (left unchanged):`);
    lines.push(...result.skipped.map((s) => `  ${s}`));
  }
  if (result.linked.length) {
    lines.push('Linked skills:');
    lines.push(...result.linked.map((s) => `  ${s}`));
  }
  if (result.linkSkipped.length) {
    lines.push('Skipped skill links (name already exists):');
    lines.push(...result.linkSkipped.map((s) => `  ${s}`));
  }
  lines.push(
    '',
    'Next steps:',
    '  1. Open the folder in your editor.',
    '  2. Start your agent there and ask for the brief.',
    '  3. At session end, ask for a handover.',
  );
  return lines.join('\n');
}
