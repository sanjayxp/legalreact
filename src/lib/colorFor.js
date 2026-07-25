// Deterministic color assignment from a name string — ported from
// the duplicated colorFor() helper in admin/jobs.html and admin/courses.html.
const COLORS = ['#1e6deb', '#f2456b', '#ff9d1f', '#0d9488', '#7c3aed', '#0891b2'];

export function colorFor(name) {
  const s = String(name || '');
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}
