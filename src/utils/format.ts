export function formatCompactNumber(value: number): string {
  if (!value) return '-';
  const abs = Math.abs(value);
  const [div, unit] =
    abs >= 1e12 ? [1e12, ' T'] :
    abs >= 1e9 ? [1e9, ' B'] :
    abs >= 1e6 ? [1e6, ' M'] :
    abs >= 1e3 ? [1e3, ' K'] :
    [1, ''];
  return `${(value / div).toLocaleString('id-ID', { maximumFractionDigits: 2 })}${unit}`;
}
