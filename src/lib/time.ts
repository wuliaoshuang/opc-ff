export function toTimestamp(value?: string) {
  if (!value) return 0
  const normalized = /^\d{4}-\d{2}$/.test(value)
    ? `${value}-01T00:00:00`
    : value.includes('T')
      ? value
      : `${value}T00:00:00`
  const timestamp = new Date(normalized).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

export function sortByNewest<T>(items: T[], getTime: (item: T) => string | undefined) {
  return [...items].sort((a, b) => toTimestamp(getTime(b)) - toTimestamp(getTime(a)))
}

export function formatListTime(value?: string) {
  if (!value) return '—'
  if (!value.includes('T')) return value

  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

export function latestOf(...values: Array<string | undefined>) {
  return values.reduce<string | undefined>((latest, value) => (
    toTimestamp(value) > toTimestamp(latest) ? value : latest
  ), undefined)
}
