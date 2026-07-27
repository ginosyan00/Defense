/**
 * Display/storage helper: numeric labels like "01" → "1".
 * Non-numeric labels (A, Բ, 1A) stay unchanged.
 */
export function formatMarkerLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return trimmed;
  if (/^\d+$/.test(trimmed)) {
    return String(Number(trimmed));
  }
  return trimmed;
}
