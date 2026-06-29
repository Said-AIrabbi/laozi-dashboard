export const COLORS = {
  green: '#1D9E75',
  orange: '#EF9F27',
  red: '#E24B4A',
  blue: '#378ADD',
  lightGreen: '#9FE1CB',
  primaryDark: '#1F4E5F',
  primaryMid: '#2E6E8E',
} as const;

/** Colors a bar by achievement rate (revenue / target) */
export function achievementColor(rate: number): string {
  if (rate >= 1.0) return COLORS.green;
  if (rate >= 0.95) return COLORS.orange;
  return COLORS.red;
}

/** Colors a value relative to a band [min, max] */
export function bandColor(value: number, band: { min: number; max: number }): string {
  if (value > band.max) return COLORS.red;
  if (value < band.min) return COLORS.orange;
  return COLORS.green;
}

/** Semantic color for KPI delta: positive is good/bad depending on metric */
export function deltaColor(delta: number, positiveIsGood: boolean): string {
  if (delta === 0) return '#666';
  const isPositive = delta > 0;
  return (isPositive === positiveIsGood) ? COLORS.green : COLORS.red;
}
