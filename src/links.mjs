// Extract markdown links and resolve them against the brain root.

import path from 'node:path';

const LINK = /!?\[[^\]]*\]\(\s*(<[^>]*>|[^)\s]*)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;

// bodyLines: [{ line, text }]. Returns [{ target, line }].
// Links inside fenced code blocks and inline code spans are ignored.
export function extractLinks(bodyLines) {
  const links = [];
  let fence = null;
  for (const { line, text } of bodyLines) {
    const f = /^\s*(```+|~~~+)/.exec(text);
    if (f) {
      const mark = f[1][0];
      if (!fence) fence = mark;
      else if (fence === mark) fence = null;
      continue;
    }
    if (fence) continue;
    const visible = text.replace(/(`+)[\s\S]*?\1/g, (m) => ' '.repeat(m.length));
    for (const m of visible.matchAll(LINK)) {
      let target = m[1];
      if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
      links.push({ target, line });
    }
  }
  return links;
}

// Resolve a link found in the file `fromRel` (posix path relative to the root).
// Returns one of:
//   { kind: 'external' }          scheme links such as https: and mailto:
//   { kind: 'skip' }              empty target or a pure #anchor
//   { kind: 'outside' }           resolves outside the brain root
//   { kind: 'local', path }       posix path relative to the root
export function resolveLink(target, fromRel) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return { kind: 'external' };
  const noAnchor = target.split('#')[0];
  if (noAnchor === '') return { kind: 'skip' };

  let p = noAnchor;
  try {
    p = decodeURIComponent(p);
  } catch {
    // Keep the raw text when it is not valid percent-encoding.
  }
  const joined = p.startsWith('/') ? p.slice(1) : path.posix.join(path.posix.dirname(fromRel), p);
  const norm = path.posix.normalize(joined);
  if (norm === '..' || norm.startsWith('../')) return { kind: 'outside' };
  return { kind: 'local', path: norm === '.' ? '' : norm.replace(/\/$/, '') };
}
