export function generateNumericStaticParams(count = 500) {
  return Array.from({ length: count }, (_, i) => ({ id: String(i + 1) }));
}

/** 26 -> "2 yrs 2 mos" (whole months to a compact duration). */
export function formatMonths(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
  if (rest || !years) parts.push(`${rest} ${rest === 1 ? 'mo' : 'mos'}`);
  return parts.join(' ');
}
