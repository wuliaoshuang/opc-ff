import { useState, useMemo } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { SubsectionTabs } from '@/components/shared/SubsectionTabs'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Link2, ShieldCheck, Lock, Clock, Unlock, Plus, AlertTriangle, UserPlus, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatListTime, latestOf, sortByNewest } from '@/lib/time'
import { toast } from 'sonner'
import { bindingStageConfig, bindingTypeLabels } from '@/types'
import type { BindingStage, CustomerBinding } from '@/types'

const stageIcons: Record<BindingStage, typeof ShieldCheck> = {
  temporary: Clock, locked: Lock, exclusive: ShieldCheck, released: Unlock,
}

function daysRemaining(expiredAt: string): number {
  return Math.ceil((new Date(expiredAt).getTime() - Date.now()) / 86400000)
}

function getBindingLatestTime(binding: CustomerBinding) {
  return latestOf(...binding.history.map((entry) => entry.date), binding.boundAt)
}

function StageTimeline({ history }: { history: CustomerBinding['history'] }) {
  return (
    <ScrollArea className="max-h-[260px] pr-3">
      <div className="space-y-3">
        {history.map((entry, i) => {
          const cfg = bindingStageConfig[entry.to]
          const Icon = stageIcons[entry.to]
          const isLast = i === history.length - 1
          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn('flex size-7 items-center justify-center rounded-full', isLast ? cfg.color : 'bg-muted')}>
                  <Icon className={cn('size-3.5', isLast ? '' : 'text-muted-foreground')} />
                </div>
                {!isLast && <div className="w-px flex-1 bg-border my-1" />}
              </div>
              <div className="pb-3 min-w-0">
                <p className={cn('text-[12px] font-medium', isLast ? '' : 'text-muted-foreground')}>{cfg.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{entry.action}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{entry.date} · {entry.operator}</p>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

export default function BindingPage() {
  const bindings = useStore((s) => s.bindings)
  const user = useStore((s) => s.user)
  const subPartners = useStore((s) => s.subPartners)
  const addManualBinding = useStore((s) => s.addManualBinding)
  const releaseBinding = useStore((s) => s.releaseBinding)
  const fillContactInfo = useStore((s) => s.fillContactInfo)
  const applyOnlineMeeting = useStore((s) => s.applyOnlineMeeting)
  const projects = useStore((s) => s.projects)
  const fillContactAndAdvance = useStore((s) => s.fillContactAndAdvance)
  const requestOnlineMeeting = useStore((s) => s.requestOnlineMeeting)
  const releaseProjectByCompany = useStore((s) => s.releaseProjectByCompany)
  const releaseLeadByCompany = useStore((s) => s.releaseLeadByCompany)
  const releaseAdminLeadByCompany = useStore((s) => s.releaseAdminLeadByCompany)
  const [filter, setFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detail, setDetail] = useState<CustomerBinding | null>(null)
  const [conflict, setConflict] = useState<CustomerBinding | null>(null)
  const [formName, setFormName] = useState('')
  const [formIndustry, setFormIndustry] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactRole, setContactRole] = useState('')

  const visiblePartnerIds = useMemo(() => [
    user?.id,
    ...subPartners.filter((s) => s.parentId === user?.id).map((s) => s.id),
  ].filter(Boolean), [subPartners, user?.id])
  const visibleBindings = useMemo(() => bindings.filter((b) =>
    user?.role === 'admin' || visiblePartnerIds.includes(b.partnerId) || (b.parentId && visiblePartnerIds.includes(b.parentId)),
  ), [bindings, user?.role, visiblePartnerIds])

  const active = visibleBindings.filter((b) => b.status === 'active').length
  const exclusive = visibleBindings.filter((b) => b.stage === 'exclusive').length
  const expiring = visibleBindings.filter((b) => b.status === 'active' && b.stage !== 'released' && daysRemaining(b.expiredAt) <= 7 && daysRemaining(b.expiredAt) > 0).length

  const filtered = useMemo(() => {
    const sorted = sortByNewest(visibleBindings, getBindingLatestTime)
    if (filter === 'all') return sorted
    return sorted.filter((b) => b.stage === filter)
  }, [filter, visibleBindings])

  const handleAdd = () => {
    if (!formName.trim()) { toast.error('请输入客户名称'); return }
    if (!user) return
    const result = addManualBinding(formName.trim(), formIndustry || '制造业', user.id, user.name)
    if (result.success) {
      toast.success(`已绑定「${formName}」，请在30天内补全对接人信息`)
      setDialogOpen(false); setFormName(''); setFormIndustry('')
    } else {
      setConflict(result.conflict!)
    }
  }

  const stageFilters = [
    { value: 'all', label: '全部' },
    { value: 'temporary', label: '临时绑定' },
    { value: 'locked', label: '初步锁定' },
    { value: 'exclusive', label: '排他保护' },
    { value: 'released', label: '已释放' },
  ]

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader
        title="客户绑定"
        description="管理客户绑定生命周期 — 临时绑定 → 锁定 → 排他保护"
        action={<Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}><Plus className="size-4" /> 主动登记</Button>}
      />

      <section className="rounded-2xl border bg-card p-4 shadow-none">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">客户归属</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">绑定冲突先拦截，生命周期自动推进</h2>
          </div>
          <Badge variant={expiring > 0 ? 'destructive' : 'secondary'} className="shrink-0">
            {expiring > 0 ? `${expiring} 个到期` : '无冲突'}
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-[10px] text-muted-foreground">临时</p>
            <p className="mt-1 text-xl font-bold">{visibleBindings.filter((b) => b.stage === 'temporary').length}</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-[10px] text-muted-foreground">锁定</p>
            <p className="mt-1 text-xl font-bold">{visibleBindings.filter((b) => b.stage === 'locked').length}</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-[10px] text-muted-foreground">排他</p>
            <p className="mt-1 text-xl font-bold">{exclusive}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard title="活跃绑定" value={active} icon={Link2} />
        <StatCard title="排他保护中" value={exclusive} icon={ShieldCheck} />
        <StatCard title="即将到期 (≤7天)" value={expiring} icon={AlertTriangle} changeType={expiring > 0 ? 'down' : 'neutral'} />
      </div>

      <div>
        <SubsectionTabs
          active={filter}
          onChange={setFilter}
          tabs={stageFilters.map((s) => ({
            value: s.value,
            label: s.label,
            count: s.value === 'all' ? undefined : visibleBindings.filter((b) => b.stage === s.value).length,
          }))}
        />
      </div>

      <Card className="hidden md:block">
        <CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>客户名称</TableHead><TableHead>行业</TableHead><TableHead>绑定方式</TableHead>
                <TableHead>绑定时间</TableHead><TableHead>阶段</TableHead><TableHead>剩余天数</TableHead><TableHead>合伙人</TableHead><TableHead>操作</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((b) => <BindingRow key={b.id} binding={b} onDetail={setDetail} />)}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      <div className="space-y-3 md:hidden">
        {filtered.map((b) => <BindingCard key={b.id} binding={b} onDetail={setDetail} />)}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>主动登记绑定</DialogTitle><DialogDescription>录入私有资源客户，系统将检查是否与现有绑定冲突</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">客户名称</Label>
              <Input placeholder="请输入公司全称" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">所属行业</Label>
              <Select value={formIndustry} onValueChange={(value) => value && setFormIndustry(value)}>
                <SelectTrigger><SelectValue placeholder="选择行业" /></SelectTrigger>
                <SelectContent>
                  {['制造业', '化工', '钢铁', '建材', '食品加工', '纺织', '电力', '农业', '新能源', '有色金属'].map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={handleAdd}>确认绑定</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!conflict} onOpenChange={(open) => { if (!open) setConflict(null) }}>
        {conflict && (
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-amber-500" /> 绑定冲突</DialogTitle></DialogHeader>
            <div className="rounded-lg border border-amber-500/30 bg-amber-50 p-4 dark:bg-amber-950/20 space-y-2">
              <p className="text-[13px] font-medium text-amber-900 dark:text-amber-200">「{conflict.customerName}」已被绑定</p>
              <div className="text-[12px] text-amber-700 dark:text-amber-400 space-y-1">
                <p>绑定人：{conflict.partnerName}</p>
                <p>当前阶段：{bindingStageConfig[conflict.stage].label}</p>
                <p>到期时间：{conflict.expiredAt}</p>
              </div>
              <p className="text-[12px] text-muted-foreground">如需申请「线索争议处理」，请提供更高级别的客户关系证明联系平台管理员。</p>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setConflict(null)}>知道了</Button></DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(open) => { if (!open) { setDetail(null); setContactName(''); setContactRole('') } }}>
        {detail && (
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
            <DialogHeader><DialogTitle>{detail.customerName}</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-1">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium', bindingStageConfig[detail.stage].color)}>
                    {bindingStageConfig[detail.stage].label}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{bindingTypeLabels[detail.bindingType]}</Badge>
                  <Badge variant="outline" className="text-[10px]">{detail.industry}</Badge>
                  {detail.sourcePartnerName && <Badge variant="secondary" className="text-[10px]">贴牌: {detail.sourcePartnerName}</Badge>}
                </div>

                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div><span className="text-muted-foreground">绑定人</span><p className="font-medium">{detail.partnerName}</p></div>
                  <div><span className="text-muted-foreground">关联项目</span><p className="font-medium">{detail.linkedProjects}</p></div>
                  <div><span className="text-muted-foreground">绑定日期</span><p className="font-medium">{detail.boundAt}</p></div>
                  <div><span className="text-muted-foreground">最新流转</span><p className="font-medium">{formatListTime(getBindingLatestTime(detail))}</p></div>
                  <div><span className="text-muted-foreground">到期日期</span><p className="font-medium">{detail.expiredAt}</p></div>
                  {detail.contactPerson && (
                    <div><span className="text-muted-foreground">对接人</span><p className="font-medium">{detail.contactPerson}（{detail.contactRole}）</p></div>
                  )}
                </div>

                {detail.stage !== 'released' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium">绑定进度</span>
                        <span className={cn('font-mono', daysRemaining(detail.expiredAt) <= 7 && 'text-red-500')}>
                          剩余 {Math.max(0, daysRemaining(detail.expiredAt))} 天
                        </span>
                      </div>
                      <Progress value={Math.max(0, Math.min(100, (daysRemaining(detail.expiredAt) / (detail.stage === 'temporary' ? 30 : detail.stage === 'locked' ? 60 : 180)) * 100))} className="h-2" />
                    </div>
                  </>
                )}

                {detail.stage === 'temporary' && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-[13px] font-medium flex items-center gap-1.5"><UserPlus className="size-3.5" /> 补全对接人信息</p>
                      <p className="text-[11px] text-muted-foreground">提交后将自动推进至「初步锁定」阶段，有效期延长至60天</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[12px]">对接人姓名</Label>
                          <Input placeholder="姓名" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[12px]">职务角色</Label>
                          <Select value={contactRole} onValueChange={(value) => value && setContactRole(value)}>
                            <SelectTrigger><SelectValue placeholder="选择角色" /></SelectTrigger>
                            <SelectContent>
                              {['决策者', '技术负责人', '采购负责人', '项目经理', '业务对接人'].map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {detail.stage === 'locked' && (
                  <>
                    <Separator />
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                      <p className="text-[13px] font-medium flex items-center gap-1.5"><Video className="size-3.5" /> 申请线上接洽</p>
                      <p className="text-[11px] text-muted-foreground">提交后将自动推进至「排他保护」阶段，有效期延长至180天，平台将安排线上接洽会议</p>
                    </div>
                  </>
                )}

                <Separator />
                <div className="space-y-1">
                  <p className="text-[13px] font-medium">绑定流转历史</p>
                  <StageTimeline history={detail.history} />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="gap-2">
              {detail.stage !== 'released' && (
                <>
                  {detail.stage === 'temporary' && (
                    <Button
                      className="gap-1.5"
                      disabled={!contactName.trim() || !contactRole}
                      onClick={() => {
                        fillContactInfo(detail.id, contactName.trim(), contactRole)
                        const project = projects.find((p) => p.companyName === detail.customerName && p.stage === 'applied')
                        if (project) {
                          fillContactAndAdvance(project.id, {
                            name: contactName.trim(),
                            role: contactRole,
                            phone: '',
                            trustLevel: 5,
                            decisionLevel: 5,
                          })
                        }
                        toast.success(`对接人信息已提交，「${detail.customerName}」已进入初步锁定阶段`)
                        setDetail(null); setContactName(''); setContactRole('')
                      }}
                    >
                      <UserPlus className="size-3.5" /> 提交对接人信息
                    </Button>
                  )}
                  {detail.stage === 'locked' && (
                    <Button
                      className="gap-1.5"
                      onClick={() => {
                        applyOnlineMeeting(detail.id)
                        const project = projects.find((p) => p.companyName === detail.customerName && p.stage === 'contact_filled')
                        if (project) requestOnlineMeeting(project.id)
                        toast.success(`已申请线上接洽，「${detail.customerName}」已进入排他保护阶段`)
                        setDetail(null)
                      }}
                    >
                      <Video className="size-3.5" /> 申请线上接洽
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      releaseBinding(detail.id)
                      releaseProjectByCompany(detail.customerName, '客户绑定释放，CRM项目同步标记为已释放')
                      releaseLeadByCompany(detail.customerName)
                      releaseAdminLeadByCompany(detail.customerName)
                      setDetail(null)
                      toast.warning(`已释放「${detail.customerName}」，线索池、CRM 和后台归属已同步`)
                    }}
                  >
                    释放绑定
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setDetail(null)}>关闭</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

function BindingRow({ binding, onDetail }: {
  binding: CustomerBinding
  onDetail: (b: CustomerBinding) => void
}) {
  const cfg = bindingStageConfig[binding.stage]
  const Icon = stageIcons[binding.stage]
  const days = daysRemaining(binding.expiredAt)
  const isReleased = binding.stage === 'released'

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => onDetail(binding)}>
      <TableCell className="font-medium">{binding.customerName}</TableCell>
      <TableCell>{binding.industry}</TableCell>
      <TableCell><Badge variant="outline" className="text-[10px]">{bindingTypeLabels[binding.bindingType]}</Badge></TableCell>
      <TableCell className="text-sm">{formatListTime(binding.boundAt)}</TableCell>
      <TableCell>
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', cfg.color)}>
          <Icon className="size-3" />{cfg.label}
        </span>
      </TableCell>
      <TableCell>
        {isReleased ? (
          <span className="text-[12px] text-muted-foreground">—</span>
        ) : (
          <div className="flex items-center gap-2">
            <Progress value={Math.max(0, Math.min(100, (days / (binding.stage === 'temporary' ? 30 : binding.stage === 'locked' ? 60 : 180)) * 100))} className="h-1.5 w-16" />
            <span className={cn('text-[11px] font-mono w-8', days <= 7 ? 'text-red-500 font-semibold' : days <= 14 ? 'text-amber-600' : 'text-emerald-600')}>
              {days}天
            </span>
          </div>
        )}
      </TableCell>
      <TableCell className="text-[12px]">{binding.partnerName}</TableCell>
      <TableCell className="text-[12px] text-muted-foreground">
        {isReleased ? '已归档' : binding.stage === 'temporary' ? '补对接人' : binding.stage === 'locked' ? '线上接洽' : '保护中'}
      </TableCell>
    </TableRow>
  )
}

function BindingCard({ binding, onDetail }: {
  binding: CustomerBinding
  onDetail: (b: CustomerBinding) => void
}) {
  const cfg = bindingStageConfig[binding.stage]
  const Icon = stageIcons[binding.stage]
  const days = daysRemaining(binding.expiredAt)
  const isReleased = binding.stage === 'released'

  return (
    <Card className="cursor-pointer rounded-2xl border-border/70 shadow-none" onClick={() => onDetail(binding)}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{binding.customerName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{binding.industry} · {binding.partnerName} · 绑定 {formatListTime(binding.boundAt)}</p>
          </div>
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0', cfg.color)}>
            <Icon className="size-3" />{cfg.label}
          </span>
        </div>
        {!isReleased && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">剩余 {Math.max(0, days)} 天</span>
              <Progress value={Math.max(0, Math.min(100, (days / (binding.stage === 'temporary' ? 30 : binding.stage === 'locked' ? 60 : 180)) * 100))} className="h-1.5 flex-1 mx-2" />
            </div>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">{bindingTypeLabels[binding.bindingType]}</Badge>
          {binding.sourcePartnerName && <Badge variant="secondary" className="text-[10px]">贴牌</Badge>}
          {!isReleased && <span className="ml-auto text-[10px] text-muted-foreground">点开处理</span>}
        </div>
      </CardContent>
    </Card>
  )
}
