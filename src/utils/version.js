export function compareVersions(left = '0.0.0', right = '0.0.0') {
  const normalize = (value) => String(value).replace(/^v/i, '').split(/[+-]/)[0]
    .split('.').map((part) => Number.parseInt(part, 10) || 0);
  const a = normalize(left);
  const b = normalize(right);
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const delta = (a[index] || 0) - (b[index] || 0);
    if (delta !== 0) return delta > 0 ? 1 : -1;
  }
  return 0;
}
