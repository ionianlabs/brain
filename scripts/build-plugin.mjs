#!/usr/bin/env node
// Generate the agent plugin in plugin/ from the repo.
// One plugin folder in Claude Code format serves Claude Code, GitHub Copilot CLI
// and Copilot in VS Code. It gets:
// - skills/: template/skills/ with the brain-only `type` key removed and the
//   {{BRAIN_DIR}} and {{BRAIN_CLI}} placeholders filled in;
// - cli/: a copy of the CLI (bin, src, template, examples), so the skills can
//   run index, lint and init without npm;
// - .claude-plugin/plugin.json, from package.json.
// plugin/hooks/ and plugin/agents/ are written by hand and left alone.
// --check writes nothing and exits 1 if plugin/ is out of date.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI_DIRS = ['bin', 'src', 'template', 'examples'];
const GENERATED = ['skills', 'cli'];
const PLUGIN_CLI = 'node "<skill>/../../cli/bin/brain.mjs"`, where `<skill>` is the folder that holds this SKILL.md';

function pluginSkill(text) {
  const filled = text.split('{{BRAIN_DIR}}').join('~/Ionian/brain').split('{{BRAIN_CLI}}').join(`\`${PLUGIN_CLI}`);
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
    description: 'One memory for all agents, in plain markdown. Agenda, drop, triage, sync and aware skills, reader and scribe agents, plus a session-start pointer to your brain folder.',
    author: { name: 'Ionian Labs', url: 'https://ionian.dev' },
    homepage: 'https://github.com/ionianlabs/brain',
    repository: 'https://github.com/ionianlabs/brain',
    license: pkg.license,
    keywords: ['memory', 'markdown', 'agents', 'agenda', 'drop', 'triage', 'sync', 'aware'],
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
  for (const d of CLI_DIRS) {
    for (const rel of listFiles(path.join(rootDir, d))) files[`cli/${d}/${rel}`] = fs.readFileSync(path.join(rootDir, d, rel));
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  // Only what the CLI reads. No dependencies and no lockfile, so no host runs npm.
  files['cli/package.json'] = `${JSON.stringify({ name: pkg.name, version: pkg.version, private: true, license: pkg.license }, null, 2)}\n`;
  if (fs.existsSync(path.join(rootDir, 'LICENSE'))) files['cli/LICENSE'] = fs.readFileSync(path.join(rootDir, 'LICENSE'));
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
  // Files left over in the generated folders from an earlier build.
  for (const d of GENERATED) {
    for (const rel of listFiles(pluginDir, d).filter((f) => !(f in files))) {
      changed.push(rel);
      if (!check) {
        fs.rmSync(path.join(pluginDir, rel));
        // Drop the folder too when that was its last file, so a renamed skill leaves nothing behind.
        const dir = path.dirname(path.join(pluginDir, rel));
        if (path.relative(pluginDir, dir) !== d && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
      }
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
