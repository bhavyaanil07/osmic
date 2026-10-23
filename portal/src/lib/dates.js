// Small date helpers. Dates are stored as ISO strings (date-time) or
// 'YYYY-MM-DD' strings (date only, in local time).

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

export const DAY = 864e5;

export function ymd(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Parse 'YYYY-MM-DD' as a local date (new Date('2026-10-22') would be UTC).
export function parseDay(s) {
  if (!s) return null;
  if (s.length === 10) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(s);
}

export function fmtDate(s) {
  const d = parseDay(s);
  if (!d) return '';
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function fmtTime(s) {
  const d = new Date(s);
  let h = d.getHours();
  const m = pad(d.getMinutes());
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export function fmtRange(from, to) {
  if (!to || to === from) return fmtDate(from);
  return `${fmtDate(from)} – ${fmtDate(to)}`;
}

// "today", "tomorrow", "in 3 days", "2 days ago"
export function relDay(s) {
  const d = parseDay(s);
  if (!d) return '';
  const today = parseDay(ymd());
  const diff = Math.round((parseDay(ymd(d)) - today) / DAY);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  if (diff > 1) return `in ${diff} days`;
  return `${-diff} days ago`;
}

export function timeAgo(s) {
  const mins = Math.round((Date.now() - new Date(s).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

// Is a date-only deadline already past? (Due today is not past.)
export function isPastDay(s) {
  return parseDay(s) < parseDay(ymd());
}

export function dayInRange(day, from, to) {
  const d = ymd(parseDay(day));
  return d >= from && d <= (to || from);
}
