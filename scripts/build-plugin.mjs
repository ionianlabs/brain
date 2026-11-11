#!/usr/bin/env node
// Generate the agent plugin in plugin/ from the repo.
// One plugin folder in Claude Code format serves Claude Code, the Claude desktop
// app, GitHub Copilot CLI and Copilot in VS Code. It holds skills only:
// - skills/: template/skills/ with the brain-only `type` key removed and the
//   {{BRAIN_DIR}} placeholder filled in;
// - .claude-plugin/plugin.json, from package.json.
// No CLI copy, agents or hooks: every other file in plugin/ is removed.
// --check writes nothing and exits 1 if plugin/ is out of date.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function pluginSkill(text) {
  const filled = text.split('{{BRAIN_DIR}}').join('~/Ionian/brain');
  // Drop `type:` from the frontmatter only. Plugin hosts do not know the key.
  return filled.replace(/^---\n([\s\S]*?)\n---\n/, (m, fm) =>
    `---\n${fm.split('\n').filter((l) => !/^type:/.test(l)).join('\n')}\n---\n`,
  );
}

function manifest(pkg) {
  return {
    name: 'brain',
    displayName: 'Ionian Brain',
    version: pkg.version,
    description: 'One memory for all agents, in plain markdown. Six skills (agenda, drop, triage, sync, aware and outbox) that read and write your brain folder directly. No CLI, agents or hooks.',
    author: { name: 'Ionian Labs', url: 'https://ionian.dev' },
    homepage: 'https://github.com/ionianlabs/brain',
    repository: 'https://github.com/ionianlabs/brain',
    license: pkg.license,
    keywords: ['memory', 'markdown', 'agents', 'agenda', 'drop', 'triage', 'sync', 'aware', 'outbox'],
  };
}

function listFiles(dir, rel = '') {
  const out = [];
  if (!fs.existsSync(path.join(dir, rel))) return out;
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const next = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...listFiles(dir, next));
    else if (e.isFile()) out.push(next);
  }
  return out.sort();
}

// The generated files, as { relative path under plugin/: string or Buffer }.
export function pluginFiles({ rootDir = ROOT } = {}) {
  const files = {};
  const skillsDir = path.join(rootDir, 'template', 'skills');
  if (!fs.existsSync(skillsDir)) throw new Error(`skills folder not found: ${skillsDir}`);
  for (const rel of listFiles(skillsDir).filter((f) => f.endsWith('/SKILL.md'))) {
    files[`skills/${rel}`] = pluginSkill(fs.readFileSync(path.join(skillsDir, rel), 'utf8'));
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  files['.claude-plugin/plugin.json'] = `${JSON.stringify(manifest(pkg), null, 2)}\n`;
  return files;
}

const same = (current, data) => current !== null && current.equals(Buffer.from(data));

// Returns the paths that differ from what is on disk (with check, nothing is written).
export function buildPlugin({ rootDir = ROOT, check = false } = {}) {
  const pluginDir = path.join(rootDir, 'plugin');
  const files = pluginFiles({ rootDir });
  const changed = [];
  for (const [rel, data] of Object.entries(files)) {
    const dest = path.join(pluginDir, rel);
    if (same(fs.existsSync(dest) ? fs.readFileSync(dest) : null, data)) continue;
    changed.push(rel);
    if (!check) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, data);
    }
  }
  // Files left over from an earlier build: anything in plugin/ that is not generated.
  for (const rel of listFiles(pluginDir).filter((f) => !(f in files))) {
    changed.push(rel);
    if (!check) {
      fs.rmSync(path.join(pluginDir, rel));
      // Drop the folders too when that was their last file.
      for (let dir = path.dirname(path.join(pluginDir, rel)); dir !== pluginDir && fs.readdirSync(dir).length === 0; dir = path.dirname(dir)) fs.rmdirSync(dir);
    }
  }
  return changed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  try {
    const changed = buildPlugin({ check });
    if (check && changed.length) {
      process.stderr.write(`plugin/ is out of date. Run node scripts/build-plugin.mjs.\n${changed.map((c) => `  ${c}\n`).join('')}`);
      process.exit(1);
    }
    process.stdout.write(check ? 'plugin/ is up to date\n' : `Built plugin/ (${changed.length} files changed)\n`);
  } catch (err) {
    process.stderr.write(`build-plugin: ${err.message}\n`);
    process.exit(1);
  }
}
