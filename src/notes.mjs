// Walk a brain folder and classify its markdown files.

import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from './frontmatter.mjs';

// Note folders and the frontmatter type each one expects.
export const NOTE_FOLDERS = {
  projects: 'project',
  logs: 'log',
  inbox: 'capture',
  knowledge: 'note',
};

const SKIP_DIRS = new Set(['.git', 'node_modules', '.confidential']);

// All .md files under root as sorted posix paths relative to root.
export function walkMarkdown(root) {
  const found = [];
  const visit = (dirRel) => {
    const entries = fs.readdirSync(path.join(root, dirRel), { withFileTypes: true });
    for (const e of entries) {
      const rel = dirRel ? `${dirRel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) visit(rel);
      } else if (e.isFile() && e.name.endsWith('.md')) {
        found.push(rel);
      }
    }
  };
  visit('');
  return found.sort();
}

export function classify(rel) {
  const parts = rel.split('/');
  const folder = parts.length > 1 ? parts[0] : null;
  const isNote = folder !== null && Object.hasOwn(NOTE_FOLDERS, folder);
  return {
    folder,
    isNote,
    expectedType: isNote ? NOTE_FOLDERS[folder] : null,
    isReserved: parts[parts.length - 1] === 'index.md',
    slug: parts[parts.length - 1].replace(/\.md$/, ''),
  };
}

// Read and parse every markdown file in scope.
export function loadBrain(root) {
  const files = walkMarkdown(root).map((rel) => {
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    return { rel, text, fm: parseFrontmatter(text), ...classify(rel) };
  });
  return { root, files };
}

// First "# Title" line outside code fences, or null.
export function firstHeading(bodyLines) {
  let fence = false;
  for (const { text } of bodyLines) {
    if (/^\s*(```|~~~)/.test(text)) fence = !fence;
    else if (!fence) {
      const m = /^# +(.+?)\s*$/.exec(text);
      if (m) return m[1];
    }
  }
  return null;
}
