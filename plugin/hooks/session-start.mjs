#!/usr/bin/env node
// SessionStart hook: tell the agent where the brain folder is.
// It states the path only. It never reads or prints note contents, so nothing
// from one org reaches a session in another org's repo.
// Output carries both shapes: top-level additionalContext (Copilot CLI) and
// hookSpecificOutput.additionalContext (Claude Code, VS Code). Always exits 0.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function brainDir(env = process.env, home = os.homedir()) {
  const expandHome = (raw) => {
    if (raw === '~') return home;
    if (raw.startsWith('~/') || raw.startsWith('~\\')) return path.join(home, raw.slice(2));
    return path.resolve(raw);
  };
  const explicit = (env.BRAIN_DIR || '').trim();
  if (explicit) return expandHome(explicit);
  const ionian = (env.IONIAN_HOME || '').trim();
  if (ionian) return path.join(expandHome(ionian), 'brain');
  return path.join(home, 'Ionian', 'brain');
}

// The CLI bundled with the plugin, found from this script's own location.
export const CLI = `node "${path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'cli', 'bin', 'brain.mjs')}"`;

export function context(dir, cli = CLI) {
  const run = `The brain CLI command is: ${cli}`;
  if (fs.existsSync(path.join(dir, 'AGENTS.md'))) {
    return (
      `Ionian Brain: the user's brain folder is at ${dir}. It holds their project state, open items and notes as markdown. ` +
      `When the task touches those, or the user asks for a brief or a handover, read ${dir}/AGENTS.md first and follow it. ${run}`
    );
  }
  return (
    `Ionian Brain is installed, but no brain folder was found at ${dir}. ` +
    `If the user asks for a brief or a handover, offer to create one with: ${cli} init "${dir}". ` +
    `The BRAIN_DIR environment variable sets another folder, and IONIAN_HOME moves the shared Ionian home. ${run}`
  );
}

export function output(text) {
  return JSON.stringify({
    additionalContext: text,
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text },
  });
}

// Run only as a script, not on import. Compare real paths: node resolves
// symlinks (such as macOS /tmp) for import.meta.url but not for argv[1].
function isMain() {
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMain()) {
  try {
    process.stdout.write(`${output(context(brainDir()))}\n`);
  } catch {
    // A failing hook must never block a session.
  }
  // Let node exit by itself, so piped stdout is flushed first.
  process.exitCode = 0;
}
