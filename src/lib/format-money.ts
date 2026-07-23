/**
 * Locale-stable money formatting for SSR + client hydration.
 * Avoids hy-AM / en-US thousand-separator mismatches (space vs comma).
 */
export function formatMoney(value: number, currency: string): string {
  const formatted = new Intl.NumberFormat("en-US", {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(value);
  return `${formatted} ${currency}`;
}
