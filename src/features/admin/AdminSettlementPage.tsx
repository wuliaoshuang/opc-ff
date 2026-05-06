import { useMemo, useState } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Banknote, FilePlus2, LockKeyhole, Send, WalletCards } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { formatListTime, sortByNewest } from '@/lib/time'
import type { CommissionRecord } from '@/types'

const statusLabels: Record<CommissionRecord['status'], { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending: { label: '待结算', variant: 'outline' },
  settled: { label: '已结算', variant: 'default' },
  frozen: { label: '已冻结', variant: 'secondary' },
}

const emptyManual = {
  projectName: '',
  partnerId: '',
  amount: '',
  type: 'short_term' as CommissionRecord['type'],
  level: 'primary' as CommissionRecord['level'],
  commissionRate: '人工调整',
  reviewNote: '',
}

export default function AdminSettlementPage() {
  const commissions = useStore((s) => s.commissions)
  const partners = useStore((s) => s.partners)
  const subPartners = useStore((s) => s.subPartners)
  const updateCommission = useStore((s) => s.updateCommission)
  const addCommission = useStore((s) => s.addCommission)
  const [status, setStatus] = useState<'all' | CommissionRecord['status']>('all')
  const [level, setLevel] = useState<'all' | CommissionRecord['level']>('all')
  const [selected, setSelected] = useState<CommissionRecord | null>(null)
  const [note, setNote] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const [manual, setManual] = useState(emptyManual)

  const filtered = useMemo(() => sortByNewest(commissions, (item) => item.settledAt ?? item.month).filter((item) => {
    const statusHit = status === 'all' || item.status === status
    const levelHit = level === 'all' || item.level === level
    return statusHit && levelHit
  }), [commissions, status, level])

  const pendingAmount = commissions.filter((item) => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0)
  const settledAmount = commissions.filter((item) => item.status === 'settled').reduce((sum, item) => sum + item.amount, 0)
  const frozenAmount = commissions.filter((item) => item.status === 'frozen').reduce((sum, item) => sum + item.amount, 0)

  const partnerName = (record: CommissionRecord) => {
    const partner = partners.find((item) => item.partnerId === record.partnerId)
    const sub = subPartners.find((item) => item.id === record.partnerId)
    return partner?.partnerName ?? sub?.name ?? record.partnerId
  }

  const settle = (record: CommissionRecord, markPaid = false) => {
    const now = new Date().toISOString().split('T')[0]
    updateCommission(record.id, {
      status: 'settled',
      settledAt: record.settledAt ?? now,
      paidAt: markPaid ? now : record.paidAt,
      reviewNote: note || record.reviewNote || '后台结算通过',
      operator: '管理员',
    })
    toast.success(markPaid ? '已标记发放完成' : '佣金已结算')
    setSelected(null)
    setNote('')
  }

  const freeze = (record: CommissionRecord) => {
    updateCommission(record.id, {
      status: record.status === 'frozen' ? 'pending' : 'frozen',
      reviewNote: note || (record.status === 'frozen' ? '后台解除冻结' : '后台冻结待核对'),
      operator: '管理员',
    })
    toast.success(record.status === 'frozen' ? '已解除冻结，回到待结算' : '已冻结佣金')
    setSelected(null)
    setNote('')
  }

  const createManual = () => {
    const amount = Number(manual.amount)
    if (!manual.projectName.trim() || !manual.partnerId || !Number.isFinite(amount) || amount <= 0) {
      toast.error('请补全项目、合伙人和有效金额')
      return
    }
    const parent = subPartners.find((item) => item.id === manual.partnerId)
    addCommission({
      id: `comm-manual-${Date.now()}`,
      projectName: manual.projectName,
      partnerId: manual.partnerId,
      amount,
      type: manual.type,
      level: manual.level,
      parentPartnerId: parent?.parentId,
      parentPartnerName: parent?.parentName,
      status: 'pending',
      commissionRate: manual.commissionRate,
      month: new Date().toISOString().slice(0, 7),
      sourceType: 'manual_adjustment',
      reviewNote: manual.reviewNote || '后台人工新增',
      operator: '管理员',
    })
    toast.success('人工分佣记录已进入待结算')
    setManual(emptyManual)
    setManualOpen(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="分佣结算操作台"
        description="处理短期/长期收益、一级/二级分佣、冻结和发放状态"
        action={<Button size="sm" className="gap-1.5" onClick={() => setManualOpen(true)}><FilePlus2 className="size-4" /> 人工调整</Button>}
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard title="待结算" value={formatCurrency(pendingAmount)} icon={WalletCards} />
        <StatCard title="已结算" value={formatCurrency(settledAmount)} icon={Banknote} />
        <StatCard title="冻结中" value={formatCurrency(frozenAmount)} icon={LockKeyhole} changeType={frozenAmount ? 'down' : 'neutral'} />
      </div>

      <section className="rounded-2xl border bg-card p-3">
        <div className="grid grid-cols-2 gap-2 md:flex md:max-w-lg">
          <Select value={status} onValueChange={(value) => setStatus(value as 'all' | CommissionRecord['status'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">待结算</SelectItem>
              <SelectItem value="settled">已结算</SelectItem>
              <SelectItem value="frozen">已冻结</SelectItem>
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={(value) => setLevel(value as 'all' | CommissionRecord['level'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部层级</SelectItem>
              <SelectItem value="primary">一级分佣</SelectItem>
              <SelectItem value="secondary">二级分佣</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <Card className="hidden md:block">
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>项目</TableHead><TableHead>合伙人</TableHead><TableHead>金额</TableHead>
                <TableHead>收益类型</TableHead><TableHead>层级</TableHead><TableHead>状态</TableHead><TableHead>发放</TableHead><TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const statusCfg = statusLabels[item.status]
                return (
                  <TableRow key={item.id}>
                    <TableCell><p className="font-medium">{item.projectName}</p><p className="text-xs text-muted-foreground">{item.month} · {item.commissionRate}</p></TableCell>
                    <TableCell>{partnerName(item)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(item.amount)}</TableCell>
                    <TableCell>{item.type === 'short_term' ? '短期收益' : '长期收益'}</TableCell>
                    <TableCell><Badge variant="outline">{item.level === 'primary' ? '一级' : '二级'}</Badge></TableCell>
                    <TableCell><Badge variant={statusCfg.variant}>{statusCfg.label}</Badge></TableCell>
                    <TableCell>{item.paidAt ? formatListTime(item.paidAt) : '未发放'}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => setSelected(item)}>处理</Button></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-3 md:hidden">
        {filtered.map((item) => {
          const statusCfg = statusLabels[item.status]
          return (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.projectName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{partnerName(item)} · {item.type === 'short_term' ? '短期' : '长期'} · {item.level === 'primary' ? '一级' : '二级'}</p>
                  </div>
                  <Badge variant={statusCfg.variant} className="shrink-0">{statusCfg.label}</Badge>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <span className="font-mono text-lg font-bold">{formatCurrency(item.amount, true)}</span>
                  <Button size="sm" variant="outline" onClick={() => setSelected(item)}>处理</Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setNote('') } }}>
        {selected && (
          <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
            <SheetHeader><SheetTitle>{selected.projectName}</SheetTitle></SheetHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">合伙人</span><p className="font-medium">{partnerName(selected)}</p></div>
                <div><span className="text-muted-foreground">金额</span><p className="font-mono font-bold">{formatCurrency(selected.amount)}</p></div>
                <div><span className="text-muted-foreground">收益类型</span><p className="font-medium">{selected.type === 'short_term' ? '短期收益' : '长期收益'}</p></div>
                <div><span className="text-muted-foreground">层级</span><p className="font-medium">{selected.level === 'primary' ? '一级分佣' : `二级分佣 · ${selected.parentPartnerName ?? ''}`}</p></div>
                <div><span className="text-muted-foreground">结算状态</span><p className="font-medium">{statusLabels[selected.status].label}</p></div>
                <div><span className="text-muted-foreground">发放时间</span><p className="font-medium">{formatListTime(selected.paidAt)}</p></div>
              </div>
              <div className="space-y-1.5">
                <Label>审核/操作备注</Label>
                <Textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder={selected.reviewNote ?? '填写冻结、结算或发放说明'} />
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button className="gap-1.5" disabled={selected.status === 'settled'} onClick={() => settle(selected)}><Banknote className="size-4" /> 结算</Button>
                <Button variant="outline" className="gap-1.5" disabled={selected.status !== 'settled' || !!selected.paidAt} onClick={() => settle(selected, true)}><Send className="size-4" /> 标记发放</Button>
                <Button variant="outline" className="gap-1.5" onClick={() => freeze(selected)}><LockKeyhole className="size-4" /> {selected.status === 'frozen' ? '解冻' : '冻结'}</Button>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      <Sheet open={manualOpen} onOpenChange={(open) => { setManualOpen(open); if (!open) setManual(emptyManual) }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>人工新增分佣</SheetTitle></SheetHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>项目名称</Label><Input value={manual.projectName} onChange={(event) => setManual({ ...manual, projectName: event.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>合伙人</Label>
              <Select value={manual.partnerId} onValueChange={(value) => { if (value) setManual({ ...manual, partnerId: value }) }}>
                <SelectTrigger><SelectValue placeholder="选择合伙人" /></SelectTrigger>
                <SelectContent>
                  {partners.map((item) => <SelectItem key={item.partnerId} value={item.partnerId}>{item.partnerName} · 一级</SelectItem>)}
                  {subPartners.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · 二级 · {item.parentName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>金额</Label><Input value={manual.amount} onChange={(event) => setManual({ ...manual, amount: event.target.value })} placeholder="例如 2000" /></div>
              <div className="space-y-1.5"><Label>比例/来源</Label><Input value={manual.commissionRate} onChange={(event) => setManual({ ...manual, commissionRate: event.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>收益类型</Label>
                <Select value={manual.type} onValueChange={(value) => setManual({ ...manual, type: value as CommissionRecord['type'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="short_term">短期收益</SelectItem><SelectItem value="long_term">长期收益</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>分佣层级</Label>
                <Select value={manual.level} onValueChange={(value) => setManual({ ...manual, level: value as CommissionRecord['level'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="primary">一级</SelectItem><SelectItem value="secondary">二级</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>备注</Label><Textarea rows={3} value={manual.reviewNote} onChange={(event) => setManual({ ...manual, reviewNote: event.target.value })} /></div>
            <Button className="w-full" onClick={createManual}>加入待结算</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
