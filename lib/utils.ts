export function generateNumericStaticParams(count = 500) {
  return Array.from({ length: count }, (_, i) => ({ id: String(i + 1) }));
}
