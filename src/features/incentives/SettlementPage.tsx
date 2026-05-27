import { useState } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wallet, TrendingUp, Clock } from 'lucide-react'
import { formatListTime, sortByNewest } from '@/lib/time'
import type { CommissionRecord } from '@/types'

const statusLabels: Record<CommissionRecord['status'], { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  settled: { label: '已结算', variant: 'default' },
  pending: { label: '待结算', variant: 'outline' },
  frozen: { label: '冻结中', variant: 'secondary' },
  voided: { label: '已作废', variant: 'secondary' },
}

const months = ['2026-05', '2026-04', '2026-03', '2026-02', '2026-01']

export default function SettlementPage() {
  const commissions = useStore((s) => s.commissions)
  const user = useStore((s) => s.user)
  const subPartners = useStore((s) => s.subPartners)
  const [month, setMonth] = useState('2026-05')
  const [levelFilter, setLevelFilter] = useState<'all' | 'primary' | 'secondary'>('all')
  const visiblePartnerIds = [
    user?.id,
    ...subPartners.filter((s) => s.parentId === user?.id).map((s) => s.id),
  ].filter(Boolean)
  const visibleCommissions = commissions.filter((c) =>
    user?.role === 'admin' || visiblePartnerIds.includes(c.partnerId),
  )

  const filtered = sortByNewest(visibleCommissions, (commission) => commission.settledAt ?? commission.month).filter((c) => {
    const monthMatch = c.month === month || month === 'all'
    const levelMatch = levelFilter === 'all' || c.level === levelFilter
    return monthMatch && levelMatch
  })
  const totalEarned = visibleCommissions.filter((c) => c.status === 'settled').reduce((s, c) => s + c.amount, 0)
  const primaryEarned = visibleCommissions.filter((c) => c.level === 'primary' && c.status === 'settled').reduce((s, c) => s + c.amount, 0)
  const secondaryEarned = visibleCommissions.filter((c) => c.level === 'secondary' && c.status === 'settled').reduce((s, c) => s + c.amount, 0)

  const monthlyData = months.map((m) => ({
    month: m,
    amount: visibleCommissions.filter((c) => c.month === m && c.status === 'settled').reduce((s, c) => s + c.amount, 0),
  })).reverse()
  const maxAmount = Math.max(...monthlyData.map((d) => d.amount), 1)

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader title="分佣结算" description="查看本人及下级合伙人的项目收益和结算明细" />

      <section className="rounded-2xl border bg-card p-4 shadow-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">收益账户</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">一级收益与二级分佣分开看</h2>
          </div>
          <Badge variant="secondary" className="shrink-0">{month}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300">
            <p className="text-[10px] opacity-70">已结算</p>
            <p className="mt-1 truncate text-xl font-bold">¥{totalEarned.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
            <p className="text-[10px] opacity-70">待结算</p>
            <p className="mt-1 truncate text-xl font-bold">
              ¥{visibleCommissions.filter((c) => c.status === 'pending').reduce((s, c) => s + c.amount, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard title="累计收益" value={`¥${totalEarned.toLocaleString()}`} icon={Wallet} />
        <StatCard title="一级收益" value={`¥${primaryEarned.toLocaleString()}`} icon={TrendingUp} changeType="up" />
        <StatCard title="二级分佣" value={`¥${secondaryEarned.toLocaleString()}`} icon={Clock} />
      </div>

      <Card className="rounded-2xl border-border/70 shadow-none">
        <CardHeader className="pb-2"><CardTitle className="text-base">月度收益趋势</CardTitle></CardHeader>
        <CardContent>
          <div className="flex h-40 items-end gap-3">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-mono">{d.amount > 0 ? `¥${(d.amount / 1000).toFixed(0)}k` : '—'}</span>
                <div className="flex h-28 w-full items-end overflow-hidden rounded-t-md bg-primary/15">
                  <div className="w-full rounded-t-md bg-primary transition-all" style={{ height: `${(d.amount / maxAmount) * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{d.month.slice(5)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-medium">结算明细</h3>
        <div className="flex gap-2">
          <Select value={levelFilter} onValueChange={(v) => v && setLevelFilter(v as 'all' | 'primary' | 'secondary')}>
            <SelectTrigger className="w-full sm:w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="primary">一级</SelectItem>
              <SelectItem value="secondary">二级</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="2026-05" onValueChange={(v) => v && setMonth(String(v))}>
            <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <>
        <Card className="hidden md:block">
          <CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>项目名称</TableHead><TableHead>金额</TableHead><TableHead>类型</TableHead>
                <TableHead>结算时间</TableHead><TableHead>层级</TableHead><TableHead>佣金比例</TableHead><TableHead>状态</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const cfg = statusLabels[c.status]
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.projectName}</TableCell>
                      <TableCell className="font-mono">¥{c.amount.toLocaleString()}</TableCell>
                      <TableCell>{c.type === 'short_term' ? '短期' : '长期'}</TableCell>
                      <TableCell className="text-sm">{formatListTime(c.settledAt ?? c.month)}</TableCell>
                      <TableCell><Badge variant={c.level === 'primary' ? 'default' : 'secondary'}>{c.level === 'primary' ? '一级' : '二级'}{c.parentPartnerName ? ` · ${c.parentPartnerName}` : ''}</Badge></TableCell>
                      <TableCell>{c.commissionRate}</TableCell>
                      <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="space-y-3 md:hidden">
          {filtered.map((c) => {
            const cfg = statusLabels[c.status]
            return (
              <Card key={c.id} className="rounded-2xl border-border/70 shadow-none">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{c.projectName}</p>
                    <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
                  </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{formatListTime(c.settledAt ?? c.month)} · {c.type === 'short_term' ? '短期' : '长期'} · {c.commissionRate} · <Badge variant={c.level === 'primary' ? 'default' : 'secondary'} className="text-[10px] ml-1">{c.level === 'primary' ? '一级' : '二级'}</Badge></span>
                        <span className="font-mono font-medium">¥{c.amount.toLocaleString()}</span>
                      </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </>
    </div>
  )
}
