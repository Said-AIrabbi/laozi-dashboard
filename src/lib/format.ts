/** Format number with thousands separator */
export function fmtNumber(n: number): string {
  return n.toLocaleString('zh-TW');
}

/** Format as "52萬" (in 萬 units) */
export function fmtWan(n: number): string {
  const wan = n / 10000;
  return `${wan % 1 === 0 ? wan : wan.toFixed(1)}萬`;
}

/** Format percentage with 1 decimal */
export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

/** Format achievement rate as percentage */
export function achievementRate(revenue: number, target: number): number {
  return revenue / target;
}

/** Format achievement rate as display string */
export function fmtRate(revenue: number, target: number): string {
  return `${(achievementRate(revenue, target) * 100).toFixed(1)}%`;
}
