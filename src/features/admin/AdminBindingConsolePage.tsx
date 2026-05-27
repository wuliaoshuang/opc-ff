import { useState } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { AlertTriangle, Link2, Plus, RotateCcw, ShieldCheck, TimerReset, Trash2, UserCheck } from 'lucide-react'
import { bindingStageConfig, bindingTypeLabels } from '@/types'
import { formatListTime, latestOf, sortByNewest } from '@/lib/time'
import { isRegionVisible } from '@/lib/v1-config'
import type { BindingStage, CustomerBinding } from '@/types'

function daysRemaining(expiredAt: string) {
  return Math.ceil((new Date(expiredAt).getTime() - Date.now()) / 86400000)
}

function latestBindingTime(binding: CustomerBinding) {
  return latestOf(...binding.history.map((item) => item.date), binding.boundAt)
}

const stageOptions: Array<{ value: 'all' | BindingStage; label: string }> = [
  { value: 'all', label: '全部阶段' },
  { value: 'temporary', label: '临时绑定' },
  { value: 'locked', label: '初步锁定' },
  { value: 'exclusive', label: '排他保护' },
  { value: 'released', label: '已释放' },
]

const emptyBindingForm = {
  customerName: '',
  industry: '制造业',
  partnerId: '',
  stage: 'temporary' as BindingStage,
  expiredAt: '',
  contactPerson: '',
  contactRole: '',
  note: '',
}

export default function AdminBindingConsolePage() {
  const bindings = useStore((s) => s.bindings)
  const partners = useStore((s) => s.partners)
  const projects = useStore((s) => s.projects)
  const adminLeads = useStore((s) => s.adminLeads)
  const user = useStore((s) => s.user)
  const releaseBinding = useStore((s) => s.releaseBinding)
  const releaseProjectByCompany = useStore((s) => s.releaseProjectByCompany)
  const releaseLeadByCompany = useStore((s) => s.releaseLeadByCompany)
  const releaseAdminLeadByCompany = useStore((s) => s.releaseAdminLeadByCompany)
  const addBinding = useStore((s) => s.addBinding)
  const updateBinding = useStore((s) => s.updateBinding)
  const deleteBinding = useStore((s) => s.deleteBinding)
  const reassignBinding = useStore((s) => s.reassignBinding)
  const extendBinding = useStore((s) => s.extendBinding)
  const updateProjectOwnerByCompany = useStore((s) => s.updateProjectOwnerByCompany)
  const updateLeadAssignmentByCompany = useStore((s) => s.updateLeadAssignmentByCompany)
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState<'all' | BindingStage>('all')
  const [selected, setSelected] = useState<CustomerBinding | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<CustomerBinding | null>(null)
  const [bindingForm, setBindingForm] = useState(emptyBindingForm)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [releaseConfirm, setReleaseConfirm] = useState('')

  const canSeeRegion = (region: string) => user?.adminLevel !== 'region_admin' || isRegionVisible(user.adminRegionGroup, region)
  const visiblePartners = partners.filter((partner) => canSeeRegion(partner.region))
  const visiblePartnerIds = new Set(visiblePartners.map((partner) => partner.partnerId))
  const visibleBindings = bindings.filter((binding) => visiblePartnerIds.has(binding.partnerId))

  const active = visibleBindings.filter((item) => item.status === 'active').length
  const expiring = visibleBindings.filter((item) => item.status === 'active' && item.stage !== 'released' && daysRemaining(item.expiredAt) <= 7).length
  const conflicts = visibleBindings.filter((item, index) =>
    item.status === 'active' && visibleBindings.findIndex((other) => other.status === 'active' && other.customerName === item.customerName) !== index,
  ).length

  const filtered = sortByNewest(visibleBindings, latestBindingTime).filter((item) => {
    const keywordHit = !search || `${item.customerName}${item.partnerName}${item.industry}`.includes(search)
    const stageHit = stage === 'all' || item.stage === stage
    return keywordHit && stageHit
  })

  const handleRelease = (binding: CustomerBinding) => {
    if (releaseConfirm !== binding.customerName) {
      toast.error('请输入客户名称确认释放')
      return
    }
    releaseBinding(binding.id)
    releaseProjectByCompany(binding.customerName, '后台绑定控制台释放客户归属')
    releaseLeadByCompany(binding.customerName)
    releaseAdminLeadByCompany(binding.customerName)
    toast.success(`已释放「${binding.customerName}」，线索、CRM、绑定同步回公海`)
    setReleaseConfirm('')
    setSelected(null)
  }

  const handleReassign = (binding: CustomerBinding, partnerId: string) => {
    const partner = visiblePartners.find((item) => item.partnerId === partnerId)
    if (!partner) return
    reassignBinding(binding.id, partner.partnerId, partner.partnerName)
    updateProjectOwnerByCompany(binding.customerName, partner.partnerId, partner.partnerName)
    updateLeadAssignmentByCompany(binding.customerName, partner.partnerName)
    toast.success(`已将「${binding.customerName}」归属调整给${partner.partnerName}`)
    setSelected({ ...binding, partnerId: partner.partnerId, partnerName: partner.partnerName })
  }

  const openEditor = (binding?: CustomerBinding) => {
    setEditing(binding ?? null)
    setBindingForm(binding ? {
      customerName: binding.customerName,
      industry: binding.industry,
      partnerId: binding.partnerId,
      stage: binding.stage,
      expiredAt: binding.expiredAt,
      contactPerson: binding.contactPerson ?? '',
      contactRole: binding.contactRole ?? '',
      note: '',
    } : {
      ...emptyBindingForm,
      partnerId: visiblePartners[0]?.partnerId ?? '',
      expiredAt: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    })
    setEditorOpen(true)
  }

  const saveBinding = () => {
    const partner = visiblePartners.find((item) => item.partnerId === bindingForm.partnerId)
    if (!bindingForm.customerName.trim() || !bindingForm.industry.trim() || !partner) {
      toast.error('请补全客户、行业和归属合伙人')
      return
    }
    if (!bindingForm.expiredAt) {
      toast.error('请填写到期日期')
      return
    }
    const now = new Date().toISOString().split('T')[0]
    if (editing) {
      updateBinding(editing.id, {
        customerName: bindingForm.customerName.trim(),
        industry: bindingForm.industry.trim(),
        partnerId: partner.partnerId,
        partnerName: partner.partnerName,
        stage: bindingForm.stage,
        status: bindingForm.stage === 'released' ? 'inactive' : 'active',
        expiredAt: bindingForm.expiredAt,
        contactPerson: bindingForm.contactPerson.trim() || undefined,
        contactRole: bindingForm.contactRole.trim() || undefined,
      })
      updateProjectOwnerByCompany(editing.customerName, partner.partnerId, partner.partnerName, bindingForm.note || '后台编辑客户绑定归属')
      updateLeadAssignmentByCompany(editing.customerName, partner.partnerName)
      setSelected((current) => current?.id === editing.id ? {
        ...current,
        customerName: bindingForm.customerName.trim(),
        industry: bindingForm.industry.trim(),
        partnerId: partner.partnerId,
        partnerName: partner.partnerName,
        stage: bindingForm.stage,
        status: bindingForm.stage === 'released' ? 'inactive' : 'active',
        expiredAt: bindingForm.expiredAt,
        contactPerson: bindingForm.contactPerson.trim() || undefined,
        contactRole: bindingForm.contactRole.trim() || undefined,
      } : current)
      toast.success('客户绑定已更新')
    } else {
      const conflict = bindings.find((binding) => binding.customerName === bindingForm.customerName.trim() && binding.status === 'active' && binding.stage !== 'released')
      if (conflict) {
        toast.error(`客户已由${conflict.partnerName}绑定，不能重复新增`)
        return
      }
      addBinding({
        id: `bind-admin-${Date.now()}`,
        customerId: `cust-admin-${Date.now()}`,
        customerName: bindingForm.customerName.trim(),
        industry: bindingForm.industry.trim(),
        partnerId: partner.partnerId,
        partnerName: partner.partnerName,
        bindingType: 'manual',
        stage: bindingForm.stage,
        status: bindingForm.stage === 'released' ? 'inactive' : 'active',
        boundAt: now,
        expiredAt: bindingForm.expiredAt,
        contactPerson: bindingForm.contactPerson.trim() || undefined,
        contactRole: bindingForm.contactRole.trim() || undefined,
        linkedProjects: 0,
        history: [{ date: now, from: 'released', to: bindingForm.stage, action: bindingForm.note || '后台新增客户绑定', operator: user?.name ?? '管理员' }],
      })
      toast.success('客户绑定已新增')
    }
    setEditorOpen(false)
    setEditing(null)
    setBindingForm(emptyBindingForm)
  }

  const handleDelete = (binding: CustomerBinding) => {
    if (deleteConfirm !== binding.customerName) {
      toast.error('请输入客户名称确认删除')
      return
    }
    deleteBinding(binding.id)
    releaseProjectByCompany(binding.customerName, '后台删除客户绑定记录，同步释放项目归属')
    releaseLeadByCompany(binding.customerName)
    releaseAdminLeadByCompany(binding.customerName)
    setDeleteConfirm('')
    setSelected(null)
    toast.warning(`已删除「${binding.customerName}」绑定记录`)
  }

  const linkedProjectCount = (binding: CustomerBinding) => projects.filter((project) => project.companyName === binding.customerName).length
  const linkedLead = (binding: CustomerBinding) => adminLeads.find((lead) => lead.companyName === binding.customerName)

  return (
    <div className="space-y-5">
      <PageHeader
        title="客户绑定管理"
        description="全局处理客户归属、冲突、释放和排他保护"
        action={<Button size="sm" className="gap-1.5" onClick={() => openEditor()}><Plus className="size-4" /> 新增绑定</Button>}
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard title="活跃绑定" value={active} icon={Link2} />
        <StatCard title="7天内到期" value={expiring} icon={TimerReset} changeType={expiring ? 'down' : 'neutral'} />
        <StatCard title="冲突记录" value={conflicts} icon={AlertTriangle} changeType={conflicts ? 'down' : 'neutral'} />
      </div>

      <section className="rounded-2xl border bg-card p-3 shadow-none">
        <div className="grid gap-2 md:grid-cols-[1fr_220px]">
          <Input placeholder="搜索客户、合伙人、行业" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select value={stage} onValueChange={(value) => setStage(value as 'all' | BindingStage)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {stageOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </section>

      <Card className="hidden md:block">
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客户</TableHead><TableHead>归属</TableHead><TableHead>来源</TableHead>
                <TableHead>阶段</TableHead><TableHead>到期</TableHead><TableHead>关联</TableHead><TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.customerName}</p>
                    <p className="text-xs text-muted-foreground">{item.industry} · 最新 {formatListTime(latestBindingTime(item))}</p>
                  </TableCell>
                  <TableCell>{item.partnerName}</TableCell>
                  <TableCell><Badge variant="outline">{bindingTypeLabels[item.bindingType]}</Badge></TableCell>
                  <TableCell><span className={`rounded-full px-2 py-0.5 text-xs ${bindingStageConfig[item.stage].color}`}>{bindingStageConfig[item.stage].label}</span></TableCell>
                  <TableCell>{item.stage === 'released' ? '—' : `${Math.max(0, daysRemaining(item.expiredAt))}天`}</TableCell>
                  <TableCell>{linkedProjectCount(item)} 项目 / {linkedLead(item) ? '有线索' : '无线索'}</TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => setSelected(item)}>处理</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-3 md:hidden">
        {filtered.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.customerName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.partnerName} · {item.industry}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${bindingStageConfig[item.stage].color}`}>{bindingStageConfig[item.stage].label}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-muted/60 p-2"><p className="text-muted-foreground">剩余</p><p className="font-bold">{item.stage === 'released' ? '-' : Math.max(0, daysRemaining(item.expiredAt))}</p></div>
                <div className="rounded-lg bg-muted/60 p-2"><p className="text-muted-foreground">项目</p><p className="font-bold">{linkedProjectCount(item)}</p></div>
                <div className="rounded-lg bg-muted/60 p-2"><p className="text-muted-foreground">来源</p><p className="font-bold">{bindingTypeLabels[item.bindingType].slice(0, 2)}</p></div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelected(item)}>处理归属</Button>
                <Button size="sm" variant="outline" onClick={() => openEditor(item)}>编辑</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        {selected && (
          <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
            <SheetHeader><SheetTitle>{selected.customerName}</SheetTitle></SheetHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{selected.industry}</Badge>
                <Badge variant="secondary">{bindingTypeLabels[selected.bindingType]}</Badge>
                <span className={`rounded-full px-2.5 py-0.5 text-xs ${bindingStageConfig[selected.stage].color}`}>{bindingStageConfig[selected.stage].label}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">当前归属</span><p className="font-medium">{selected.partnerName}</p></div>
                <div><span className="text-muted-foreground">到期时间</span><p className="font-medium">{selected.expiredAt}</p></div>
                <div><span className="text-muted-foreground">关联项目</span><p className="font-medium">{linkedProjectCount(selected)}</p></div>
                <div><span className="text-muted-foreground">后台线索</span><p className="font-medium">{linkedLead(selected)?.status ?? '未匹配'}</p></div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">调整归属</p>
                <Select value={selected.partnerId} onValueChange={(value) => { if (value) handleReassign(selected, value) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {visiblePartners.map((partner) => <SelectItem key={partner.partnerId} value={partner.partnerId}>{partner.partnerName} · {partner.region}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="gap-1.5" disabled={selected.stage === 'released'} onClick={() => { extendBinding(selected.id, 30); toast.success('已延长30天保护期') }}>
                  <ShieldCheck className="size-4" /> 延长30天
                </Button>
                <Button variant="outline" className="gap-1.5" onClick={() => openEditor(selected)}>
                  编辑绑定
                </Button>
              </div>
              <div className="space-y-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                <Label className="text-[12px] text-destructive">释放/删除确认</Label>
                <Input value={releaseConfirm} onChange={(event) => setReleaseConfirm(event.target.value)} placeholder={`输入「${selected.customerName}」确认释放`} />
                <Button variant="outline" className="w-full gap-1.5 text-destructive hover:text-destructive" disabled={selected.stage === 'released'} onClick={() => handleRelease(selected)}>
                  <RotateCcw className="size-4" /> 释放归属
                </Button>
                <Input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder={`输入「${selected.customerName}」确认删除`} />
                <Button variant="outline" className="w-full gap-1.5 text-destructive hover:text-destructive" onClick={() => handleDelete(selected)}>
                  <Trash2 className="size-4" /> 删除绑定记录
                </Button>
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">流转日志</p>
                {selected.history.map((entry, index) => (
                  <div key={`${entry.date}-${index}`} className="rounded-lg border p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{entry.action}</span>
                      <Badge variant="outline" className="shrink-0">{entry.operator}</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">{entry.date} · {bindingStageConfig[entry.from].label} → {bindingStageConfig[entry.to].label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
                <UserCheck className="mb-2 size-4" />
                后台释放会同步线索池、后台线索、CRM项目和客户绑定；重分配会同步CRM项目负责人和后台线索归属。
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      <Dialog open={editorOpen} onOpenChange={(open) => { setEditorOpen(open); if (!open) { setEditing(null); setBindingForm(emptyBindingForm) } }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing ? '编辑客户绑定' : '新增客户绑定'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>客户名称</Label>
                <Input value={bindingForm.customerName} onChange={(event) => setBindingForm({ ...bindingForm, customerName: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>行业</Label>
                <Input value={bindingForm.industry} onChange={(event) => setBindingForm({ ...bindingForm, industry: event.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>归属合伙人</Label>
                <Select value={bindingForm.partnerId} onValueChange={(value) => { if (value) setBindingForm({ ...bindingForm, partnerId: value }) }}>
                  <SelectTrigger><SelectValue placeholder="选择合伙人" /></SelectTrigger>
                  <SelectContent>
                    {visiblePartners.map((partner) => <SelectItem key={partner.partnerId} value={partner.partnerId}>{partner.partnerName} · {partner.region}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>绑定阶段</Label>
                <Select value={bindingForm.stage} onValueChange={(value) => setBindingForm({ ...bindingForm, stage: value as BindingStage })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stageOptions.filter((item) => item.value !== 'all').map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>到期日期</Label>
                <Input value={bindingForm.expiredAt} onChange={(event) => setBindingForm({ ...bindingForm, expiredAt: event.target.value })} placeholder="YYYY-MM-DD" />
              </div>
              <div className="space-y-1.5">
                <Label>对接人</Label>
                <Input value={bindingForm.contactPerson} onChange={(event) => setBindingForm({ ...bindingForm, contactPerson: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>对接角色</Label>
                <Input value={bindingForm.contactRole} onChange={(event) => setBindingForm({ ...bindingForm, contactRole: event.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>操作备注</Label>
              <Textarea value={bindingForm.note} onChange={(event) => setBindingForm({ ...bindingForm, note: event.target.value })} className="min-h-20 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>取消</Button>
            <Button onClick={saveBinding}>{editing ? '保存修改' : '新增绑定'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
