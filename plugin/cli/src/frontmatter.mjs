// Parser for the documented frontmatter subset (spec section 3.1):
// scalars, inline lists, block lists, one level of nested mapping, comments.
// All scalar values are returned as strings.

const KEY_LINE = /^([A-Za-z0-9_-]+):(?:\s+(.*))?$/;

export function parseFrontmatter(text) {
  const src = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = src.split('\n');
  const none = {
    hasFrontmatter: false,
    data: {},
    keyLines: {},
    body: src,
    bodyStartLine: 1,
    bodyLines: lines.map((t, i) => ({ line: i + 1, text: t })),
  };
  if (lines[0].trimEnd() !== '---') return none;

  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trimEnd() === '---') {
      end = i;
      break;
    }
  }
  if (end < 0) return none;

  const { data, keyLines } = parseBlock(lines.slice(1, end));
  const bodyArr = lines.slice(end + 1);
  return {
    hasFrontmatter: true,
    data,
    keyLines,
    body: bodyArr.join('\n'),
    bodyStartLine: end + 2,
    bodyLines: bodyArr.map((t, i) => ({ line: end + 2 + i, text: t })),
  };
}

function isBlankOrComment(line) {
  const t = line.trim();
  return t === '' || t.startsWith('#');
}

// Parse the lines between the two --- markers. keyLines maps a key to its
// 1-based line number in the file (the opening --- is line 1).
function parseBlock(lines) {
  const data = {};
  const keyLines = {};
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const m = isBlankOrComment(raw) ? null : KEY_LINE.exec(raw.trimEnd());
    if (!m) {
      i++;
      continue;
    }
    const key = m[1];
    keyLines[key] = i + 2;
    const rest = stripComment(m[2] || '').trim();
    i++;
    if (rest !== '') {
      data[key] = parseValue(rest);
      continue;
    }
    // Empty value: collect the indented (or "- ") lines that follow.
    const children = [];
    while (i < lines.length && (isBlankOrComment(lines[i]) || /^\s+\S/.test(lines[i]) || /^-(\s|$)/.test(lines[i]))) {
      if (!isBlankOrComment(lines[i])) children.push(lines[i].trim());
      i++;
    }
    data[key] = parseChildren(children);
  }
  return { data, keyLines };
}

function parseChildren(children) {
  if (children.length === 0) return '';
  if (/^-(\s|$)/.test(children[0])) {
    return children
      .filter((c) => /^-(\s|$)/.test(c))
      .map((c) => parseScalar(c.slice(1).trim()));
  }
  const map = {};
  for (const c of children) {
    const m = KEY_LINE.exec(stripComment(c).trim());
    if (m) map[m[1]] = parseValue(stripComment(m[2] || '').trim());
  }
  return map;
}

function parseValue(v) {
  if (v.startsWith('[') && v.endsWith(']')) {
    const inner = v.slice(1, -1).trim();
    return inner === '' ? [] : splitTop(inner).map((s) => parseScalar(s));
  }
  if (v.startsWith('{') && v.endsWith('}')) {
    const map = {};
    const inner = v.slice(1, -1).trim();
    for (const part of inner === '' ? [] : splitTop(inner)) {
      const at = part.indexOf(':');
      if (at > 0) map[part.slice(0, at).trim()] = parseScalar(part.slice(at + 1));
    }
    return map;
  }
  return parseScalar(v);
}

// Split on commas that are not inside quotes.
function splitTop(s) {
  const parts = [];
  let cur = '';
  let quote = null;
  for (const ch of s) {
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      if (cur.trim() === '' || /[:\[{]\s*$/.test(cur)) quote = ch;
    } else if (ch === ',') {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

function parseScalar(s) {
  const t = s.trim();
  if (t.startsWith('"')) {
    const close = findClose(t, '"');
    if (close > 0) return t.slice(1, close).replace(/\\(["\\n])/g, (_, c) => (c === 'n' ? '\n' : c));
  }
  if (t.startsWith("'")) {
    const close = findClose(t, "'");
    if (close > 0) return t.slice(1, close).replace(/''/g, "'");
  }
  return stripComment(t).trim();
}

// Index of the closing quote, honoring \" in double quotes and '' in single.
function findClose(t, q) {
  for (let i = 1; i < t.length; i++) {
    if (q === '"' && t[i] === '\\') i++;
    else if (t[i] === q) {
      if (q === "'" && t[i + 1] === "'") i++;
      else return i;
    }
  }
  return -1;
}

// Remove a trailing "# comment". A # only starts a comment after whitespace
// or at the start, and never inside quotes.
function stripComment(s) {
  let quote = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if ((ch === '"' || ch === "'") && (i === 0 || /[\s\[{,:]/.test(s[i - 1]))) {
      quote = ch;
    } else if (ch === '#' && (i === 0 || /\s/.test(s[i - 1]))) {
      return s.slice(0, i);
    }
  }
  return s;
}
