// Shared helpers for the tests.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const FIXTURES = path.join(HERE, 'fixtures');
export const BIN = path.join(HERE, '..', 'bin', 'brain.mjs');
export const TODAY = '2026-11-02';

export function tmpDir(prefix = 'brain-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function writeTree(root, files) {
  for (const [rel, text] of Object.entries(files)) {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  }
}

export function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

// A small template used by the init tests, independent of the real template/.
export function makeTemplate(root) {
  writeTree(root, {
    'AGENTS.md': '---\ntype: guide\n---\n\n# Rules\n\nBrain lives at {{BRAIN_DIR}}.\n',
    'gitignore': '.confidential/\n',
    'index.md': '---\nokf_version: "0.2"\n---\n\n# Index\n\n<!-- brain:index start -->\n<!-- brain:index end -->\n',
    'skills/handover/SKILL.md': '---\ntype: skill\n---\n\nRun in {{BRAIN_DIR}} with {{BRAIN_CLI}}.\n',
    '.github/prompts/brief.prompt.md': '---\ntype: prompt\n---\n\nRead {{BRAIN_DIR}}/index.md.\n',
  });
  return root;
}

// A small example used by the init tests. The dates are relative to 2026-11-02.
export function makeExample(root) {
  writeTree(root, {
    'index.md': 'not copied\n',
    'projects/demo.md':
      '---\ntype: project\ndescription: Demo.\ntags: [demo]\norg: client-a\nupdated: 2026-11-01\nphase: active\nfocus: Demo.\n---\n\n# Demo\n\nHistory: [log](/logs/demo.md)\n\n## Open\n\n- [ ] Overdue (due: 2026-10-30)\n- [ ] Soon (due: 2026-11-06)\n',
    'logs/demo.md':
      '---\ntype: log\ndescription: Demo log.\ntags: [demo]\norg: client-a\nupdated: 2026-11-01\nproject: demo\n---\n\n# Demo log\n\n## 2026-11-01\n\n- Done: Started.\n',
    'inbox/2026-11-01-idea.md':
      '---\ntype: capture\ndescription: Idea.\ntags: [idea]\norg: unknown\nupdated: 2026-11-01\n---\n\nAn idea.\n',
    'knowledge/guide.md':
      '---\ntype: note\ndescription: Guide.\ntags: [guide]\norg: personal\nupdated: 2026-10-20\n---\n\n# Guide\n',
  });
  return root;
}
