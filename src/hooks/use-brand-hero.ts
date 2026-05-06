import { useStore } from '@/stores'

function isNeutralColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.15 || luminance > 0.90
}

export function useBrandHero() {
  const user = useStore((s) => s.user)
  const configs = useStore((s) => s.whiteLabelConfigs)

  const isPartner = user?.role === 'partner'
  const config = isPartner && user ? configs[user.id] : null
  const snapshot = config?.auditStatus === 'approved'
    ? { primaryColor: config.primaryColor }
    : config?.approvedSnapshot ?? null

  const hasBrand = !!snapshot && !isNeutralColor(snapshot.primaryColor)

  return hasBrand
    ? 'overflow-hidden rounded-2xl border border-primary/10 bg-primary/90 text-white shadow-sm'
    : 'overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-white shadow-sm'
}
