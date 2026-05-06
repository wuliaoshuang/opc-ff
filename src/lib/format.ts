export function formatCompactNumber(value: number) {
  const abs = Math.abs(value)
  if (abs >= 10000) return `${Number((value / 10000).toFixed(1))}w`
  if (abs >= 1000) return `${Number((value / 1000).toFixed(1))}k`
  return `${value}`
}

export function formatCurrency(value: number, compact = false) {
  if (!compact) return `¥${value.toLocaleString()}`
  return `¥${formatCompactNumber(value)}`
}
