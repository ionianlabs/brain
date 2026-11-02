// Small date helpers. All dates are YYYY-MM-DD strings, computed in UTC
// so that daylight saving never shifts a whole-day difference.

const DAY_MS = 86400000;

export function isValidDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function dayNumber(s) {
  return Math.round(Date.parse(`${s}T00:00:00Z`) / DAY_MS);
}

// Whole days from a to b. Positive when b is later.
export function daysBetween(a, b) {
  return dayNumber(b) - dayNumber(a);
}

export function addDays(s, n) {
  return new Date((dayNumber(s) + n) * DAY_MS).toISOString().slice(0, 10);
}

// The local calendar date of the machine.
export function localDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ISO 8601 date-time with an explicit UTC offset, such as 2026-12-01T09:00:00Z.
export function isIsoWithOffset(s) {
  if (typeof s !== 'string') return false;
  const m = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d+)?)?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(s);
  return Boolean(m) && isValidDate(m[1]);
}
