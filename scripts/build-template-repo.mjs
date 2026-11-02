#!/usr/bin/env node
// Build dist/template-repo/ from template/, for a GitHub "Use this template" repo.
// Renames gitignore to .gitignore, replaces {{BRAIN_DIR}} with ~/brain and
// adds a .gitkeep to each empty note folder. Nothing else is added.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOTE_DIRS = ['projects', 'logs', 'inbox', 'knowledge'];

function copyTree(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, e.name);
    if (e.isDirectory()) {
      copyTree(from, path.join(dest, e.name));
    } else if (e.isFile()) {
      const name = e.name === 'gitignore' && src === ROOT_TEMPLATE ? '.gitignore' : e.name;
      const data = fs.readFileSync(from).toString('utf8').split('{{BRAIN_DIR}}').join('~/brain');
      fs.writeFileSync(path.join(dest, name), data);
    }
  }
}

let ROOT_TEMPLATE = '';

export function buildTemplateRepo({ templateDir, outDir }) {
  if (!fs.existsSync(templateDir)) throw new Error(`template folder not found: ${templateDir}`);
  ROOT_TEMPLATE = templateDir;
  fs.rmSync(outDir, { recursive: true, force: true });
  copyTree(templateDir, outDir);
  for (const d of NOTE_DIRS) {
    const dir = path.join(outDir, d);
    fs.mkdirSync(dir, { recursive: true });
    if (fs.readdirSync(dir).length === 0) fs.writeFileSync(path.join(dir, '.gitkeep'), '');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outDir = path.join(ROOT, 'dist', 'template-repo');
  try {
    buildTemplateRepo({ templateDir: path.join(ROOT, 'template'), outDir });
    process.stdout.write(`Built ${outDir}\n`);
  } catch (err) {
    process.stderr.write(`build-template-repo: ${err.message}\n`);
    process.exit(1);
  }
}
