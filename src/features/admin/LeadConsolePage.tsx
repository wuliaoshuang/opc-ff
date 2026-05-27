import { useState } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { AlertTriangle, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { formatListTime, sortByNewest } from '@/lib/time'
import { isRegionVisible } from '@/lib/v1-config'
import type { AdminLeadRecord, CustomerBinding, LeadGrade, LeadStatus } from '@/types'

const statusLabels: Record<LeadStatus, string> = { available: '可申请', applied: '已申请', followed: '跟进中', exclusive: '排他期' }
const gradeOptions: LeadGrade[] = ['S', 'A', 'B', 'C', 'D']
const industries = ['全部', '制造业', '化工', '钢铁', '建材', '食品加工', '纺织', '电力', '农业', '新能源', '有色金属']

const emptyLeadForm = {
  companyName: '',
  industry: '制造业',
  region: '上海',
  revenue: '',
  energyUsage: '',
  aiMatchScore: '80',
  grade: 'B' as LeadGrade,
  projectInfo: '',
  businessInfo: '',
}

export default function LeadConsolePage() {
  const adminLeads = useStore((s) => s.adminLeads)
  const leads = useStore((s) => s.leads)
  const setLeads = useStore((s) => s.setLeads)
  const partners = useStore((s) => s.partners)
  const accounts = useStore((s) => s.accounts)
  const user = useStore((s) => s.user)
  const addAdminLead = useStore((s) => s.addAdminLead)
  const updateAdminLead = useStore((s) => s.updateAdminLead)
  const deleteAdminLead = useStore((s) => s.deleteAdminLead)
  const updateAssignment = useStore((s) => s.updateLeadAssignment)
  const releaseAdminLeadByCompany = useStore((s) => s.releaseAdminLeadByCompany)
  const releaseLeadByCompany = useStore((s) => s.releaseLeadByCompany)
  const checkConflict = useStore((s) => s.checkConflict)
  const bindings = useStore((s) => s.bindings)
  const addBinding = useStore((s) => s.addBinding)
  const releaseBinding = useStore((s) => s.releaseBinding)
  const addProject = useStore((s) => s.addProject)
  const releaseProjectByCompany = useStore((s) => s.releaseProjectByCompany)
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [selected, setSelected] = useState<AdminLeadRecord | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<AdminLeadRecord | null>(null)
  const [leadForm, setLeadForm] = useState(emptyLeadForm)
  const [deleteTarget, setDeleteTarget] = useState<AdminLeadRecord | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const canSeeRegion = (region: string) => user?.adminLevel !== 'region_admin' || isRegionVisible(user.adminRegionGroup, region)
  const visibleAdminLeads = adminLeads.filter((lead) => canSeeRegion(lead.region))
  const visiblePartners = partners.filter((partner) => canSeeRegion(partner.region))
  const visiblePartnerIds = new Set(visiblePartners.map((partner) => partner.partnerId))
  const visibleBindings = bindings.filter((binding) => visiblePartnerIds.has(binding.partnerId))
  const activeAccountIds = new Set(accounts.filter((account) => account.status === 'approved').map((account) => account.id))
  const assignablePartners = visiblePartners.filter((partner) => !activeAccountIds.size || activeAccountIds.has(partner.partnerId) || !partner.accountStatus)

  const filtered = sortByNewest(visibleAdminLeads, (lead) => lead.updatedAt ?? lead.createdAt).filter((l) => {
    if (search && !l.companyName.includes(search)) return false
    if (industryFilter && industryFilter !== '全部' && l.industry !== industryFilter) return false
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    return true
  })

  const statItems = [
    { label: '可分配', value: visibleAdminLeads.filter((lead) => lead.status === 'available' && !lead.assignedPartner).length },
    { label: '已申请', value: visibleAdminLeads.filter((lead) => lead.status === 'applied').length },
    { label: '排他期', value: visibleAdminLeads.filter((lead) => lead.status === 'exclusive').length },
    { label: '冲突保护', value: visibleBindings.filter((binding) => binding.status === 'active').length },
  ]

  const openLeadEditor = (lead?: AdminLeadRecord) => {
    setEditingLead(lead ?? null)
    setLeadForm(lead ? {
      companyName: lead.companyName,
      industry: lead.industry,
      region: lead.region,
      revenue: lead.revenue,
      energyUsage: lead.energyUsage,
      aiMatchScore: String(lead.aiMatchScore),
      grade: lead.grade ?? 'B',
      projectInfo: lead.projectInfo,
      businessInfo: lead.businessInfo,
    } : emptyLeadForm)
    setEditorOpen(true)
  }

  const saveLead = () => {
    if (!leadForm.companyName.trim() || !leadForm.industry.trim() || !leadForm.region.trim()) {
      toast.error('请填写公司名称、行业和区域')
      return
    }
    if (user?.adminLevel === 'region_admin' && !isRegionVisible(user.adminRegionGroup, leadForm.region.trim())) {
      toast.error(`当前区域管理员只能维护${user.adminRegionGroup}范围内线索`)
      return
    }
    const score = Number(leadForm.aiMatchScore)
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      toast.error('匹配度需为 0-100 的数字')
      return
    }
    const now = new Date().toISOString().split('T')[0]
    const payload = {
      companyName: leadForm.companyName.trim(),
      industry: leadForm.industry.trim(),
      region: leadForm.region.trim(),
      revenue: leadForm.revenue.trim() || '待补充',
      energyUsage: leadForm.energyUsage.trim() || '待补充',
      aiMatchScore: score,
      grade: leadForm.grade,
      projectInfo: leadForm.projectInfo.trim() || '后台新增线索，项目情况待补充。',
      businessInfo: leadForm.businessInfo.trim() || '商务信息待补充。',
      updatedAt: now,
    }
    if (editingLead) {
      updateAdminLead(editingLead.id, payload)
      setSelected((current) => current?.id === editingLead.id ? { ...current, ...payload } : current)
      toast.success('线索已更新')
    } else {
      addAdminLead({
        id: `lead-admin-${Date.now()}`,
        ...payload,
        isListed: false,
        status: 'available',
        createdAt: now,
      })
      toast.success('线索已新增到后台线索池')
    }
    setEditorOpen(false)
    setEditingLead(null)
    setLeadForm(emptyLeadForm)
  }

  const removeLead = (lead: AdminLeadRecord) => {
    if (deleteConfirm !== lead.companyName) {
      toast.error('请输入公司名称确认删除')
      return
    }
    deleteAdminLead(lead.id)
    releaseLeadByCompany(lead.companyName)
    releaseProjectByCompany(lead.companyName, '后台删除线索，同步释放相关项目归属')
    setSelected(null)
    setDeleteTarget(null)
    setDeleteConfirm('')
    toast.warning(`已删除「${lead.companyName}」`)
  }

  const handleAssignment = (leadId: string, partnerName: string) => {
    const lead = visibleAdminLeads.find((item) => item.id === leadId)
    const partner = assignablePartners.find((item) => item.partnerName === partnerName)
    if (!lead || !partner) return

    const conflict = checkConflict(lead.companyName)
    if (conflict && conflict.partnerName !== partnerName) {
      toast.error(`客户已由${conflict.partnerName}绑定，不能直接改派`)
      return
    }

    const now = new Date().toISOString().split('T')[0]
    const contactDeadline = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    const meetingDeadline = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
    updateAssignment(leadId, partnerName)
    setLeads(leads.map((item) =>
      item.id === leadId ? { ...item, status: 'applied' as const, appliedBy: partnerName } : item,
    ))

    if (!conflict) {
      const binding: CustomerBinding = {
        id: `bind-admin-${Date.now()}`,
        customerId: `cust-admin-${Date.now()}`,
        customerName: lead.companyName,
        industry: lead.industry,
        partnerId: partner.partnerId,
        partnerName,
        bindingType: 'admin_assign',
        stage: 'temporary',
        status: 'active',
        boundAt: now,
        expiredAt: contactDeadline,
        linkedProjects: 1,
        history: [
          { date: now, from: 'released', to: 'temporary', action: '管理员编辑线索归属并指派', operator: '管理员' },
        ],
      }
      addBinding(binding)
      addProject({
        id: `crm-admin-${Date.now()}`,
        leadId,
        companyName: lead.companyName,
        industry: lead.industry,
        ownerPartnerId: partner.partnerId,
        ownerPartnerName: partnerName,
        stage: 'applied',
        appliedAt: now,
        contactDeadline,
        meetingDeadline,
        isExclusive: false,
        isOverdue: false,
        source: 'lead',
        followupLogs: [
          { date: now, action: '后台指派线索', result: `指派给${partnerName}，需在30天内补全对接人` },
        ],
      })
    }

    toast.success(`已将「${lead.companyName}」指派给${partnerName}`)
  }

  const handleRelease = (lead: AdminLeadRecord) => {
    const activeBinding = bindings.find((binding) => binding.customerName === lead.companyName && binding.status === 'active')
    if (activeBinding) releaseBinding(activeBinding.id)
    releaseProjectByCompany(lead.companyName, '后台线索管理释放归属')
    releaseLeadByCompany(lead.companyName)
    releaseAdminLeadByCompany(lead.companyName)
    setSelected(null)
    toast.warning(`已释放「${lead.companyName}」的线索、CRM 和客户绑定归属`)
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader
        title="线索管理"
        description="查看和管理所有线索的归属"
        action={<Button size="sm" className="gap-1.5" onClick={() => openLeadEditor()}><Plus className="size-4" /> 新增线索</Button>}
      />

      <section className="grid grid-cols-4 gap-2">
        {statItems.map((item) => (
          <div key={item.label} className="rounded-2xl border bg-card p-3">
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-xl font-bold">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Input placeholder="搜索公司名称..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <Select onValueChange={(v) => v && setIndustryFilter(String(v))}>
          <SelectTrigger className="sm:w-40"><SelectValue placeholder="行业筛选" /></SelectTrigger>
          <SelectContent>{industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LeadStatus | 'all')}>
          <SelectTrigger className="sm:w-40"><SelectValue placeholder="状态筛选" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {(Object.keys(statusLabels) as LeadStatus[]).map((status) => (
              <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <>
        <Card className="hidden md:block">
          <CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>公司名称</TableHead><TableHead>行业</TableHead><TableHead>区域</TableHead>
                <TableHead>更新时间</TableHead><TableHead>匹配度</TableHead><TableHead>状态</TableHead><TableHead>归属合伙人</TableHead><TableHead>操作</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.companyName}</TableCell>
                    <TableCell>{lead.industry}</TableCell>
                    <TableCell>{lead.region}</TableCell>
                    <TableCell className="text-sm">{formatListTime(lead.updatedAt ?? lead.createdAt)}</TableCell>
                    <TableCell>{lead.aiMatchScore}%</TableCell>
                    <TableCell><Badge variant="outline">{statusLabels[lead.status]}</Badge></TableCell>
                    <TableCell>
                      <Select value={lead.assignedPartner ?? ''} onValueChange={(v) => v && handleAssignment(lead.id, String(v))}>
                        <SelectTrigger className="w-28 h-8"><SelectValue placeholder="未分配" /></SelectTrigger>
                        <SelectContent>{assignablePartners.map((p) => <SelectItem key={p.partnerId} value={p.partnerName}>{p.partnerName}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setSelected(lead)}>详情</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => openLeadEditor(lead)}>编辑</Button>
                        {lead.assignedPartner && (
                          <Button size="sm" variant="ghost" className="h-7 text-[11px] text-destructive hover:text-destructive" onClick={() => handleRelease(lead)}>
                            释放
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="md:hidden space-y-3">
          {filtered.map((lead) => (
            <Card key={lead.id} className="rounded-2xl shadow-none">
              <CardContent className="p-4 space-y-2">
                <button type="button" className="flex w-full items-start justify-between text-left" onClick={() => setSelected(lead)}>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{lead.companyName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{lead.industry} · {lead.region} · 更新 {formatListTime(lead.updatedAt ?? lead.createdAt)}</p>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">{lead.aiMatchScore}%</span>
                </button>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{statusLabels[lead.status]}</Badge>
                  {lead.assignedPartner && <Badge variant="secondary" className="text-[10px]">{lead.assignedPartner}</Badge>}
                </div>
                <Button size="sm" variant="outline" className="h-8 w-full text-xs" onClick={() => openLeadEditor(lead)}>编辑线索</Button>
                <Select value={lead.assignedPartner ?? ''} onValueChange={(v) => v && handleAssignment(lead.id, String(v))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="分配合伙人" /></SelectTrigger>
                  <SelectContent>{assignablePartners.map((p) => <SelectItem key={p.partnerId} value={p.partnerName}>{p.partnerName}</SelectItem>)}</SelectContent>
                </Select>
                {lead.assignedPartner && (
                  <Button size="sm" variant="outline" className="w-full gap-1.5 text-destructive hover:text-destructive" onClick={() => handleRelease(lead)}>
                    <RotateCcw className="size-3.5" /> 释放归属
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </>

      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        {selected && (
          <SheetContent className="overflow-y-auto sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>{selected.companyName}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{statusLabels[selected.status]}</Badge>
                <Badge variant="secondary">AI {selected.aiMatchScore}%</Badge>
                {selected.assignedPartner && <Badge>{selected.assignedPartner}</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div><span className="text-muted-foreground">行业</span><p className="font-medium">{selected.industry}</p></div>
                <div><span className="text-muted-foreground">区域</span><p className="font-medium">{selected.region}</p></div>
                <div><span className="text-muted-foreground">创建时间</span><p className="font-medium">{formatListTime(selected.createdAt)}</p></div>
                <div><span className="text-muted-foreground">更新时间</span><p className="font-medium">{formatListTime(selected.updatedAt)}</p></div>
                <div><span className="text-muted-foreground">营收</span><p className="font-medium">{selected.revenue}</p></div>
                <div><span className="text-muted-foreground">用能</span><p className="font-medium">{selected.energyUsage}</p></div>
                <div><span className="text-muted-foreground">新建项目</span><p className="font-medium">{selected.newProjectSize ?? '—'}</p></div>
                <div><span className="text-muted-foreground">进展</span><p className="font-medium">{selected.newProjectProgress ?? '—'}</p></div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">项目情况说明</p>
                <p className="rounded-xl bg-muted/50 p-3 text-[12px] leading-relaxed text-muted-foreground">{selected.projectInfo}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">商务情况说明</p>
                <p className="rounded-xl bg-muted/50 p-3 text-[12px] leading-relaxed text-muted-foreground">{selected.businessInfo}</p>
              </div>
              {checkConflict(selected.companyName) && (
                <div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] text-amber-700">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>该客户存在有效绑定，改派前必须释放或处理归属冲突。</span>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm font-medium">后台操作</p>
                <Button variant="outline" className="w-full" onClick={() => openLeadEditor(selected)}>编辑线索信息</Button>
                <Select value={selected.assignedPartner ?? ''} onValueChange={(value) => {
                  if (!value) return
                  handleAssignment(selected.id, value)
                  setSelected({ ...selected, assignedPartner: value, status: 'applied' })
                }}>
                  <SelectTrigger><SelectValue placeholder="分配合伙人" /></SelectTrigger>
                  <SelectContent>{assignablePartners.map((p) => <SelectItem key={p.partnerId} value={p.partnerName}>{p.partnerName}</SelectItem>)}</SelectContent>
                </Select>
                {selected.assignedPartner && (
                  <Button variant="outline" className="w-full gap-1.5 text-destructive hover:text-destructive" onClick={() => handleRelease(selected)}>
                    <RotateCcw className="size-3.5" /> 释放归属并回到线索池
                  </Button>
                )}
                <Button variant="outline" className="w-full gap-1.5 text-destructive hover:text-destructive" onClick={() => { setDeleteTarget(selected); setDeleteConfirm('') }}>
                  <Trash2 className="size-3.5" /> 删除线索
                </Button>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      <Dialog open={editorOpen} onOpenChange={(open) => { setEditorOpen(open); if (!open) { setEditingLead(null); setLeadForm(emptyLeadForm) } }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingLead ? '编辑线索' : '新增线索'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={leadForm.companyName} onChange={(event) => setLeadForm({ ...leadForm, companyName: event.target.value })} placeholder="公司名称" />
            <div className="grid grid-cols-2 gap-3">
              <Input value={leadForm.industry} onChange={(event) => setLeadForm({ ...leadForm, industry: event.target.value })} placeholder="行业" />
              <Input value={leadForm.region} onChange={(event) => setLeadForm({ ...leadForm, region: event.target.value })} placeholder="城市/区域" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input value={leadForm.revenue} onChange={(event) => setLeadForm({ ...leadForm, revenue: event.target.value })} placeholder="营收规模" />
              <Input value={leadForm.energyUsage} onChange={(event) => setLeadForm({ ...leadForm, energyUsage: event.target.value })} placeholder="用能情况" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input value={leadForm.aiMatchScore} onChange={(event) => setLeadForm({ ...leadForm, aiMatchScore: event.target.value })} placeholder="匹配度 0-100" />
              <Select value={leadForm.grade} onValueChange={(value) => setLeadForm({ ...leadForm, grade: value as LeadGrade })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{gradeOptions.map((grade) => <SelectItem key={grade} value={grade}>{grade} 级项目</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Textarea value={leadForm.projectInfo} onChange={(event) => setLeadForm({ ...leadForm, projectInfo: event.target.value })} placeholder="项目详细信息" className="min-h-24" />
            <Textarea value={leadForm.businessInfo} onChange={(event) => setLeadForm({ ...leadForm, businessInfo: event.target.value })} placeholder="商务情况说明" className="min-h-20" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>取消</Button>
            <Button onClick={saveLead}>{editingLead ? '保存修改' : '新增线索'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirm('') } }}>
        {deleteTarget && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>删除线索</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-[12px] leading-relaxed text-destructive">
                删除会同步释放关联线索与项目归属。请输入公司名称「{deleteTarget.companyName}」确认删除。
              </div>
              <Input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder={deleteTarget.companyName} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
              <Button variant="destructive" onClick={() => removeLead(deleteTarget)}>确认删除</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
