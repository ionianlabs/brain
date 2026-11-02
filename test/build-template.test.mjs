import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildTemplateRepo } from '../scripts/build-template-repo.mjs';
import { makeTemplate, tmpDir } from './helpers.mjs';

test('builds the template repo: .gitignore, ~/brain, .gitkeep, nothing else', () => {
  const root = tmpDir();
  const templateDir = makeTemplate(path.join(root, 'template'));
  const outDir = path.join(root, 'out');
  buildTemplateRepo({ templateDir, outDir });

  assert.equal(fs.readFileSync(path.join(outDir, '.gitignore'), 'utf8'), '.confidential/\n');
  assert.ok(!fs.existsSync(path.join(outDir, 'gitignore')));
  assert.ok(fs.readFileSync(path.join(outDir, 'skills/handover/SKILL.md'), 'utf8').includes('Run in ~/brain with `node bin/brain.mjs` in a clone of `https://github.com/ionianlabs/brain`.'));
  for (const d of ['projects', 'logs', 'inbox', 'knowledge']) {
    assert.deepEqual(fs.readdirSync(path.join(outDir, d)), ['.gitkeep']);
  }
  assert.ok(!fs.existsSync(path.join(outDir, '.confidential')));
});
