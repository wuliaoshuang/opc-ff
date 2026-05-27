import { useState } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle2, Download, Plus, RotateCcw, Trash2, Video, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatListTime, latestOf, sortByNewest } from '@/lib/time'
import { addDays, isRegionVisible, projectPhase16Order } from '@/lib/v1-config'
import { projectPhase16Labels, type CrmProject, type ProjectPhase16, type ProjectStage } from '@/types'

const stageLabels: Record<ProjectStage, string> = {
  applied: '已申请',
  contact_filled: '对接人已填',
  online_meeting: '线上接洽',
  exclusive: '排他期',
  signed: '已签单',
  released: '已释放',
}

function getProjectLatestTime(project: CrmProject) {
  return latestOf(...project.followupLogs.map((log) => log.date), project.appliedAt)
}

function resolveProjectPhase(project: CrmProject): ProjectPhase16 {
  if (project.projectPhase16) return project.projectPhase16
  if (project.stage === 'signed') return 'signed_execute'
  if (project.stage === 'exclusive') return 'priority_exclusive'
  if (project.stage === 'online_meeting') return 'need_interview'
  if (project.stage === 'contact_filled') return 'contact_confirm'
  if (project.source === 'filing' || project.filingStatus === 'pending') return 'filing_review'
  return 'lead_in'
}

function escapeCsv(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

export default function BusinessTrackingPage() {
  const projects = useStore((s) => s.projects)
  const partners = useStore((s) => s.partners)
  const bindings = useStore((s) => s.bindings)
  const adminLeads = useStore((s) => s.adminLeads)
  const addProject = useStore((s) => s.addProject)
  const updateProjectDetails = useStore((s) => s.updateProjectDetails)
  const deleteProject = useStore((s) => s.deleteProject)
  const setAdminLeads = useStore((s) => s.setAdminLeads)
  const signProject = useStore((s) => s.signProject)
  const signProjectAndCreateCommissions = useStore((s) => s.signProjectAndCreateCommissions)
  const confirmOnlineMeeting = useStore((s) => s.confirmOnlineMeeting)
  const advanceBindingStage = useStore((s) => s.advanceBindingStage)
  const releaseProjectByCompany = useStore((s) => s.releaseProjectByCompany)
  const releaseLeadByCompany = useStore((s) => s.releaseLeadByCompany)
  const releaseAdminLeadByCompany = useStore((s) => s.releaseAdminLeadByCompany)
  const releaseBinding = useStore((s) => s.releaseBinding)
  const reviewProjectFiling = useStore((s) => s.reviewProjectFiling)
  const updateLeadFiling = useStore((s) => s.updateLeadFiling)
  const updateProjectPhase16 = useStore((s) => s.updateProjectPhase16)
  const updateProjectReferrer = useStore((s) => s.updateProjectReferrer)
  const user = useStore((s) => s.user)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<ProjectStage | 'all'>('all')
  const [selectedProject, setSelectedProject] = useState<CrmProject | null>(null)
  const [signNote, setSignNote] = useState('')
  const [contractAmount, setContractAmount] = useState('')
  const [shortTermRate, setShortTermRate] = useState('3')
  const [longTermRate, setLongTermRate] = useState('1')
  const [filingNote, setFilingNote] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const [manualCompanyName, setManualCompanyName] = useState('')
  const [manualIndustry, setManualIndustry] = useState('')
  const [manualPartnerId, setManualPartnerId] = useState('')
  const [manualNote, setManualNote] = useState('')
  const [projectEditorOpen, setProjectEditorOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<CrmProject | null>(null)
  const [projectCompanyName, setProjectCompanyName] = useState('')
  const [projectIndustry, setProjectIndustry] = useState('')
  const [projectOwnerId, setProjectOwnerId] = useState('')
  const [projectNote, setProjectNote] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<CrmProject | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const getProjectRegion = (project: CrmProject) => {
    const leadRegion = project.leadId ? adminLeads.find((lead) => lead.id === project.leadId)?.region : undefined
    const partnerRegion = project.ownerPartnerId ? partners.find((partner) => partner.partnerId === project.ownerPartnerId)?.region : undefined
    return leadRegion ?? partnerRegion ?? ''
  }
  const visibleProjects = projects.filter((project) => user?.adminLevel !== 'region_admin' || isRegionVisible(user.adminRegionGroup, getProjectRegion(project)))
  const filtered = sortByNewest(visibleProjects, getProjectLatestTime)
    .filter((p) => stageFilter === 'all' || p.stage === stageFilter)
    .filter((p) => !search || p.companyName.includes(search) || p.industry.includes(search))
  const today = new Date().toISOString().split('T')[0]

  const getPartnerName = (project: CrmProject) => {
    if (project.ownerPartnerName) return project.ownerPartnerName
    const binding = bindings.find((item) => item.customerName === project.companyName && item.status === 'active')
    if (binding) return binding.partnerName
    const adminLead = project.leadId ? adminLeads.find((item) => item.id === project.leadId) : undefined
    if (adminLead?.assignedPartner) return adminLead.assignedPartner
    const partner = project.ownerPartnerId ? partners.find((p) => p.partnerId === project.ownerPartnerId) : undefined
    return partner?.partnerName ?? '未分配'
  }

  const handleRelease = (project: CrmProject) => {
    const activeBinding = bindings.find((binding) => binding.customerName === project.companyName && binding.status === 'active')
    if (activeBinding) releaseBinding(activeBinding.id)
    releaseProjectByCompany(project.companyName, '后台商务跟进表释放归属')
    releaseLeadByCompany(project.companyName)
    releaseAdminLeadByCompany(project.companyName)
    setSelectedProject({ ...project, stage: 'released', isExclusive: false })
    toast.warning(`已释放「${project.companyName}」的归属`)
  }

  const resetSignForm = () => {
    setSignNote('')
    setContractAmount('')
    setShortTermRate('3')
    setLongTermRate('1')
  }

  const handleSign = (project: CrmProject) => {
    const amount = Number(contractAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('请输入有效的合同金额')
      return
    }
    const stRate = Number(shortTermRate) / 100
    const ltRate = Number(longTermRate) / 100
    if (!Number.isFinite(stRate) || stRate <= 0 || !Number.isFinite(ltRate) || ltRate < 0) {
      toast.error('请输入有效的佣金比例')
      return
    }
    const partnerId = project.ownerPartnerId ?? ''
    const partnerName = project.ownerPartnerName ?? getPartnerName(project)
    const projectName = `${project.companyName}${project.industry ? project.industry + '项目' : '项目'}`

    signProject(project.id, signNote || `合同金额¥${amount.toLocaleString()}`, amount)
    signProjectAndCreateCommissions({
      projectId: project.id,
      projectName,
      partnerId,
      partnerName,
      contractAmount: amount,
      shortTermRate: stRate,
      longTermRate: ltRate,
    })

    const activeBinding = bindings.find((b) => b.customerName === project.companyName && b.status === 'active')
    if (activeBinding) releaseBinding(activeBinding.id)
    setSelectedProject({ ...project, stage: 'signed', isExclusive: false, isOverdue: false, contractAmount: amount })
    toast.success(`「${project.companyName}」已签单，合同金额¥${amount.toLocaleString()}，佣金已自动进入结算`)
    resetSignForm()
  }

  const handleConfirmMeeting = (project: CrmProject) => {
    confirmOnlineMeeting(project.id)
    const now = new Date().toISOString().split('T')[0]
    const exclusiveEnd = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
    const activeBinding = bindings.find((b) => b.customerName === project.companyName && b.status === 'active' && b.stage === 'locked')
    if (activeBinding) advanceBindingStage(activeBinding.id, '平台确认线上接洽完成')
    const updated = { ...project, stage: 'exclusive' as ProjectStage, exclusiveStart: now, exclusiveEnd, isExclusive: true }
    setSelectedProject(updated)
    toast.success(`接洽已确认，「${project.companyName}」进入180天排他期`)
  }

  const handleReviewFiling = (project: CrmProject, approved: boolean) => {
    const now = new Date().toISOString().split('T')[0]
    const exclusiveEnd = addDays(60)
    reviewProjectFiling(project.id, approved, filingNote || (approved ? '备案资料通过，进入2个月优先排他期' : '备案资料需补充'))
    if (project.leadId) updateLeadFiling(project.leadId, approved ? 'approved' : 'rejected', project.ownerPartnerName)
    if (project.leadId) {
      setAdminLeads(adminLeads.map((lead) => lead.id === project.leadId ? {
        ...lead,
        filingStatus: approved ? 'approved' as const : 'rejected' as const,
        status: approved ? 'exclusive' as const : lead.status,
        appliedBy: project.ownerPartnerName ?? lead.appliedBy,
        assignedPartner: project.ownerPartnerName ?? lead.assignedPartner,
        exclusiveUntil: approved ? exclusiveEnd : lead.exclusiveUntil,
        updatedAt: now,
      } : lead))
    }
    setSelectedProject({
      ...project,
      filingStatus: approved ? 'approved' : 'rejected',
      stage: approved ? 'exclusive' : project.stage,
      isExclusive: approved,
      projectPhase16: approved ? 'priority_exclusive' : 'filing_review',
      exclusiveStart: approved ? now : project.exclusiveStart,
      exclusiveEnd: approved ? exclusiveEnd : project.exclusiveEnd,
    })
    setFilingNote('')
    toast.success(approved ? '备案已通过，进入2个月优先排他' : '备案已驳回')
  }

  const handlePhaseChange = (project: CrmProject, phase: ProjectPhase16) => {
    updateProjectPhase16(project.id, phase, user?.name ?? '管理员')
    setSelectedProject({ ...project, projectPhase16: phase })
    toast.success(`项目阶段已更新为${projectPhase16Labels[phase]}`)
  }

  const handleReferrerChange = (project: CrmProject, partnerId: string) => {
    const partner = partners.find((item) => item.partnerId === partnerId)
    if (!partner) return
    updateProjectReferrer(project.id, partner.partnerId, partner.partnerName)
    setSelectedProject({ ...project, referrerPartnerId: partner.partnerId, referrerPartnerName: partner.partnerName })
    toast.success(`推荐人已绑定为${partner.partnerName}`)
  }

  const resetManualForm = () => {
    setManualCompanyName('')
    setManualIndustry('')
    setManualPartnerId('')
    setManualNote('')
  }

  const openProjectEditor = (project: CrmProject) => {
    setEditingProject(project)
    setProjectCompanyName(project.companyName)
    setProjectIndustry(project.industry)
    setProjectOwnerId(project.ownerPartnerId ?? '')
    setProjectNote(project.followupLogs.at(-1)?.result ?? '')
    setProjectEditorOpen(true)
  }

  const resetProjectEditor = () => {
    setEditingProject(null)
    setProjectCompanyName('')
    setProjectIndustry('')
    setProjectOwnerId('')
    setProjectNote('')
  }

  const saveProjectEditor = () => {
    if (!editingProject) return
    if (!projectCompanyName.trim() || !projectIndustry.trim()) {
      toast.error('请填写公司名称和行业')
      return
    }
    const partner = partners.find((item) => item.partnerId === projectOwnerId)
    const now = new Date().toISOString().split('T')[0]
    const patch: Partial<CrmProject> = {
      companyName: projectCompanyName.trim(),
      industry: projectIndustry.trim(),
      ownerPartnerId: partner?.partnerId,
      ownerPartnerName: partner?.partnerName,
      referrerPartnerId: partner?.partnerId ?? editingProject.referrerPartnerId,
      referrerPartnerName: partner?.partnerName ?? editingProject.referrerPartnerName,
      followupLogs: [
        ...editingProject.followupLogs,
        { date: now, action: '后台编辑项目基础信息', result: projectNote || '更新公司、行业或负责人信息' },
      ],
    }
    updateProjectDetails(editingProject.id, patch)
    setSelectedProject({ ...editingProject, ...patch })
    setProjectEditorOpen(false)
    resetProjectEditor()
    toast.success('项目基础信息已保存')
  }

  const removeProject = (project: CrmProject) => {
    if (deleteConfirm !== project.companyName) {
      toast.error('请输入公司名称确认删除')
      return
    }
    deleteProject(project.id)
    if (project.leadId) updateLeadFiling(project.leadId, 'none', project.ownerPartnerName)
    setDeleteTarget(null)
    setDeleteConfirm('')
    setSelectedProject(null)
    toast.warning(`已删除「${project.companyName}」项目记录`)
  }

  const handleAddManualProject = () => {
    if (!manualCompanyName.trim() || !manualIndustry.trim()) {
      toast.error('请填写公司名称和行业')
      return
    }
    const partner = partners.find((item) => item.partnerId === manualPartnerId)
    const now = new Date().toISOString().split('T')[0]
    addProject({
      id: `crm-manual-${Date.now()}`,
      companyName: manualCompanyName.trim(),
      industry: manualIndustry.trim(),
      ownerPartnerId: partner?.partnerId,
      ownerPartnerName: partner?.partnerName,
      referrerPartnerId: partner?.partnerId,
      referrerPartnerName: partner?.partnerName,
      stage: 'applied',
      appliedAt: now,
      contactDeadline: addDays(30),
      meetingDeadline: addDays(60),
      isExclusive: false,
      isOverdue: false,
      source: 'manual',
      filingStatus: 'none',
      projectPhase16: 'lead_in',
      bindingTags: partner ? ['绑定'] : [],
      followupLogs: [
        { date: now, action: '后台手动新增项目/线索', result: manualNote || '来源为管理员主动登记' },
      ],
    })
    setManualOpen(false)
    resetManualForm()
    toast.success('项目已加入总项目进展表单')
  }

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      toast.error('当前筛选条件下没有可导出的项目')
      return
    }

    const headers = [
      '序号',
      '公司名称',
      '行业',
      '负责合伙人',
      '当前阶段',
      '16阶段',
      '备案状态',
      '推荐人',
      '对接人',
      '信任度',
      '决策度',
      '申请日期',
      '最新跟进',
      '排他开始',
      '排他结束',
      '状态',
      '来源',
    ]
    const rows = filtered.map((project, index) => [
      index + 1,
      project.companyName,
      project.industry,
      getPartnerName(project),
      stageLabels[project.stage],
      projectPhase16Labels[resolveProjectPhase(project)],
      project.filingStatus === 'pending' ? '待审核' : project.filingStatus === 'approved' ? '已通过' : project.filingStatus === 'rejected' ? '已驳回' : '未备案',
      project.referrerPartnerName ?? project.ownerPartnerName ?? getPartnerName(project),
      project.contactPerson ? `${project.contactPerson.name}（${project.contactPerson.role}）` : '',
      project.contactPerson?.trustLevel ?? '',
      project.contactPerson?.decisionLevel ?? '',
      project.appliedAt,
      getProjectLatestTime(project),
      project.exclusiveStart ?? '',
      project.exclusiveEnd ?? '',
      project.isOverdue ? '逾期' : project.isExclusive ? '排他中' : '正常',
      project.source === 'filing' ? '备案项目' : project.source === 'lead' ? '线索申请' : '主动登记',
    ])
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `总项目进展表单-${today}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast.success(`已导出 ${filtered.length} 条项目数据`)
  }

  const phaseGroups = [
    { label: '线索入库', phases: ['lead_in', 'qualification', 'resource_match'] as ProjectPhase16[] },
    { label: '备案审核', phases: ['filing_apply', 'filing_review'] as ProjectPhase16[] },
    { label: '优先排他', phases: ['priority_exclusive', 'contact_confirm', 'need_interview', 'site_survey'] as ProjectPhase16[] },
    { label: '方案商务', phases: ['data_collect', 'solution_calc', 'proposal_review', 'commercial_quote', 'contract_negotiate'] as ProjectPhase16[] },
    { label: '签约回款', phases: ['signed_execute', 'payment_archive'] as ProjectPhase16[] },
  ]
  const phaseGroupStats = phaseGroups.map((group) => ({
    ...group,
    count: visibleProjects.filter((project) => group.phases.includes(resolveProjectPhase(project))).length,
  }))
  const enteredExclusiveCount = visibleProjects.filter((project) =>
    project.stage === 'exclusive' || project.stage === 'signed' || resolveProjectPhase(project) === 'priority_exclusive',
  ).length
  const signedCount = visibleProjects.filter((project) => project.stage === 'signed').length
  const nodeConversionRate = Math.round((signedCount / Math.max(enteredExclusiveCount, 1)) * 100)
  const statItems = [
    { label: '全部项目', value: visibleProjects.length, helper: '按权限可见' },
    { label: '今日新增线索', value: adminLeads.filter((lead) => lead.createdAt === today).length, helper: '线索库新增' },
    { label: '今日进展变化', value: visibleProjects.filter((project) => getProjectLatestTime(project) === today).length, helper: '日志/阶段更新' },
    { label: '节点转化率', value: `${nodeConversionRate}%`, helper: `签约 ${signedCount} / 排他 ${enteredExclusiveCount}` },
  ]

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader
        title="总项目进展表单"
        description="管理员维护项目详情、推荐人绑定、备案审核与16阶段进度"
        action={
          <div className="flex gap-2">
            <Button size="sm" className="gap-1.5" onClick={() => setManualOpen(true)}>
              <Plus className="size-4" /> 新增项目
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExportCsv}>
              <Download className="size-4" /> 导出 CSV
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-4 gap-2">
        {statItems.map((item) => (
          <div key={item.label} className="rounded-2xl border bg-card p-3">
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-xl font-bold">{item.value}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{item.helper}</p>
          </div>
        ))}
      </section>

      <Card>
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">16阶段节点统计</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">按当前项目所处节点汇总，用于日常查看节点转化</p>
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px]">{visibleProjects.length} 个项目</Badge>
          </div>
          <div className="grid gap-2 md:grid-cols-5">
            {phaseGroupStats.map((group) => (
              <div key={group.label} className="rounded-xl border bg-muted/25 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-medium">{group.label}</p>
                  <span className="text-sm font-semibold">{group.count}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round((group.count / Math.max(visibleProjects.length, 1)) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 line-clamp-1 text-[10px] text-muted-foreground">
                  {group.phases.map((phase) => projectPhase16Labels[phase]).join(' / ')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <div className="flex-1">
              <Input
                placeholder="搜索公司名称或行业..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9"
              />
            </div>
            <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as ProjectStage | 'all')}>
              <SelectTrigger className="sm:w-[160px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部阶段</SelectItem>
                {(Object.keys(stageLabels) as ProjectStage[]).map((s) => (
                  <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">序号</TableHead>
                  <TableHead className="min-w-[140px]">公司名称</TableHead>
                  <TableHead className="min-w-[100px]">行业</TableHead>
                  <TableHead className="min-w-[100px]">负责合伙人</TableHead>
                  <TableHead className="min-w-[100px]">当前阶段</TableHead>
                  <TableHead className="min-w-[120px]">16阶段</TableHead>
                  <TableHead className="min-w-[100px]">备案</TableHead>
                  <TableHead className="min-w-[100px]">推荐人</TableHead>
                  <TableHead className="min-w-[120px]">对接人</TableHead>
                  <TableHead className="min-w-[100px]">信任度</TableHead>
                  <TableHead className="min-w-[100px]">决策度</TableHead>
                  <TableHead className="min-w-[120px]">申请日期</TableHead>
                  <TableHead className="min-w-[120px]">最新跟进</TableHead>
                  <TableHead className="min-w-[120px]">排他期</TableHead>
                  <TableHead className="min-w-[80px]">状态</TableHead>
                  <TableHead className="min-w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((project, idx) => (
                  <TableRow
                    key={project.id}
                    className={cn(
                      'hover:bg-muted/30',
                      project.stage === 'released' && 'opacity-40',
                    )}
                  >
                    <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{project.companyName}</TableCell>
                    <TableCell>{project.industry}</TableCell>
                    <TableCell>{getPartnerName(project)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">{stageLabels[project.stage]}</Badge>
                    </TableCell>
                    <TableCell className="text-[12px]">{projectPhase16Labels[resolveProjectPhase(project)]}</TableCell>
                    <TableCell>
                      <Badge variant={project.filingStatus === 'pending' ? 'outline' : project.filingStatus === 'approved' ? 'default' : 'secondary'} className="text-[10px]">
                        {project.filingStatus === 'pending' ? '待审核' : project.filingStatus === 'approved' ? '已通过' : project.filingStatus === 'rejected' ? '已驳回' : '未备案'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[12px]">{project.referrerPartnerName ?? project.ownerPartnerName ?? getPartnerName(project)}</TableCell>
                    <TableCell>
                      {project.contactPerson ? (
                        <div className="text-[12px]">
                          <div className="font-medium">{project.contactPerson.name}</div>
                          <div className="text-muted-foreground">{project.contactPerson.role}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[12px]">未填写</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.contactPerson ? (
                        <div className="flex items-center gap-1">
                          <div className={cn('h-1.5 flex-1 rounded-full bg-muted overflow-hidden')}>
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${project.contactPerson.trustLevel * 10}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono w-6">{project.contactPerson.trustLevel}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.contactPerson ? (
                        <div className="flex items-center gap-1">
                          <div className={cn('h-1.5 flex-1 rounded-full bg-muted overflow-hidden')}>
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${project.contactPerson.decisionLevel * 10}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono w-6">{project.contactPerson.decisionLevel}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[12px]">{project.appliedAt}</TableCell>
                    <TableCell className="text-[12px]">{formatListTime(getProjectLatestTime(project))}</TableCell>
                    <TableCell className="text-[12px]">
                      {project.exclusiveStart && project.exclusiveEnd ? (
                        <div>
                          <div>{project.exclusiveStart}</div>
                          <div className="text-muted-foreground">至 {project.exclusiveEnd}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.isOverdue && <Badge variant="destructive" className="text-[10px]">逾期</Badge>}
                      {project.isExclusive && !project.isOverdue && <Badge className="text-[10px]">排他中</Badge>}
                      {!project.isOverdue && !project.isExclusive && <Badge variant="outline" className="text-[10px]">正常</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setSelectedProject(project)}>
                        详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3 mt-4">
            {filtered.map((project) => (
              <Card
                key={project.id}
                className={cn('cursor-pointer', project.stage === 'released' && 'opacity-40')}
                onClick={() => setSelectedProject(project)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{project.companyName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{project.industry} · {getPartnerName(project)} · 最新 {formatListTime(getProjectLatestTime(project))}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{stageLabels[project.stage]}</Badge>
                  </div>
                  {project.contactPerson && (
                    <div className="text-xs text-muted-foreground">
                      对接人: {project.contactPerson.name}({project.contactPerson.role}) · 信任 {project.contactPerson.trustLevel}/10
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {project.isOverdue && <Badge variant="destructive" className="text-[10px]">逾期</Badge>}
                    {project.isExclusive && !project.isOverdue && <Badge className="text-[10px]">排他中</Badge>}
                    {!project.isOverdue && !project.isExclusive && <Badge variant="outline" className="text-[10px]">正常</Badge>}
                    {project.filingStatus === 'pending' && <Badge variant="outline" className="text-[10px]">备案待审</Badge>}
                  </div>
                  <Button
                    size="sm"
                    variant={project.filingStatus === 'pending' ? 'default' : 'outline'}
                    className="mt-2 h-8 w-full text-[12px]"
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedProject(project)
                    }}
                  >
                    {project.filingStatus === 'pending' ? '审核备案' : '查看详情'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedProject} onOpenChange={(open) => { if (!open) setSelectedProject(null) }}>
        {selectedProject && (
          <SheetContent className="overflow-y-auto sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>{selectedProject.companyName}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div><span className="text-muted-foreground">行业：</span>{selectedProject.industry}</div>
                <div><span className="text-muted-foreground">阶段：</span>{stageLabels[selectedProject.stage]}</div>
                <div><span className="text-muted-foreground">申请日期：</span>{selectedProject.appliedAt}</div>
                <div><span className="text-muted-foreground">最新跟进：</span>{formatListTime(getProjectLatestTime(selectedProject))}</div>
                <div><span className="text-muted-foreground">来源：</span>{selectedProject.source === 'filing' ? '备案项目' : selectedProject.source === 'lead' ? '线索申请' : '主动登记'}</div>
                <div><span className="text-muted-foreground">负责人：</span>{getPartnerName(selectedProject)}</div>
                <div><span className="text-muted-foreground">状态：</span>{selectedProject.isOverdue ? '逾期' : selectedProject.isExclusive ? '排他中' : '正常'}</div>
                <div><span className="text-muted-foreground">备案：</span>{selectedProject.filingStatus === 'pending' ? '待审核' : selectedProject.filingStatus === 'approved' ? '已通过' : selectedProject.filingStatus === 'rejected' ? '已驳回' : '未备案'}</div>
              </div>

              <Separator />
              <div className="space-y-3">
                <p className="text-[13px] font-medium">管理员编辑</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-muted-foreground">16阶段进度</p>
                    <Select value={selectedProject.projectPhase16 ?? 'lead_in'} onValueChange={(value) => handlePhaseChange(selectedProject, value as ProjectPhase16)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {projectPhase16Order.map((phase) => (
                          <SelectItem key={phase} value={phase}>{projectPhase16Labels[phase]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-muted-foreground">项目推荐人绑定</p>
                    <Select value={selectedProject.referrerPartnerId ?? selectedProject.ownerPartnerId ?? ''} onValueChange={(value) => { if (value) handleReferrerChange(selectedProject, value) }}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="选择推荐人" /></SelectTrigger>
                      <SelectContent>
                        {partners.map((partner) => (
                          <SelectItem key={partner.partnerId} value={partner.partnerId}>{partner.partnerName} · {partner.region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {selectedProject.filingStatus === 'pending' && (
                <>
                  <Separator />
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                    <p className="text-[13px] font-semibold">备案审核</p>
                    <p className="text-[11px] text-muted-foreground">审核通过后按 v1.0 反馈进入2个月优先排他期。</p>
                    <Textarea value={filingNote} onChange={(event) => setFilingNote(event.target.value)} placeholder="审核意见（选填）" className="min-h-[64px]" />
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleReviewFiling(selectedProject, false)}>驳回备案</Button>
                      <Button onClick={() => handleReviewFiling(selectedProject, true)}>通过备案</Button>
                    </div>
                  </div>
                </>
              )}

              {selectedProject.contactPerson && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-[13px] font-medium">对接人信息</p>
                    <div className="grid grid-cols-2 gap-2 text-[12px]">
                      <div><span className="text-muted-foreground">姓名：</span>{selectedProject.contactPerson.name}</div>
                      <div><span className="text-muted-foreground">角色：</span>{selectedProject.contactPerson.role}</div>
                      <div><span className="text-muted-foreground">电话：</span>{selectedProject.contactPerson.phone}</div>
                      <div><span className="text-muted-foreground">信任度：</span>{selectedProject.contactPerson.trustLevel}/10</div>
                      <div><span className="text-muted-foreground">决策度：</span>{selectedProject.contactPerson.decisionLevel}/10</div>
                    </div>
                  </div>
                </>
              )}

              <Separator />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button variant="outline" onClick={() => openProjectEditor(selectedProject)}>编辑项目基础信息</Button>
                <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => { setDeleteTarget(selectedProject); setDeleteConfirm('') }}>
                  删除项目记录
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-[13px] font-medium">跟进日志</p>
                <div className="space-y-2">
                  {selectedProject.followupLogs.map((log, i) => (
                    <div key={i} className="flex gap-3 text-[12px]">
                      <span className="text-muted-foreground shrink-0 w-20">{log.date}</span>
                      <div>
                        <span className="font-medium">{log.action}</span>
                        <span className="text-muted-foreground ml-2">{log.result}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              {selectedProject.stage === 'online_meeting' && (
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-2">
                  <p className="text-[13px] font-semibold flex items-center gap-1.5 text-sky-700 dark:text-sky-300"><Video className="size-3.5" /> 待确认线上接洽</p>
                  <p className="text-[11px] text-muted-foreground">合伙人已申请线上接洽，平台安排完成后点击确认，项目将进入180天排他保护期。</p>
                  <Button className="w-full gap-1.5" onClick={() => handleConfirmMeeting(selectedProject)}>
                    <CheckCircle2 className="size-3.5" /> 确认接洽完成，进入排他期
                  </Button>
                </div>
              )}
              {selectedProject.stage === 'exclusive' && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                  <p className="text-[13px] font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300"><ShieldCheck className="size-3.5" /> 排他保护中 — 确认签单</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">合同金额（元）*</p>
                      <Input
                        placeholder="例如 12000000"
                        value={contractAmount}
                        onChange={(e) => setContractAmount(e.target.value)}
                        className="h-8 text-[13px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">短期佣金比例（%）*</p>
                      <Input
                        placeholder="3"
                        value={shortTermRate}
                        onChange={(e) => setShortTermRate(e.target.value)}
                        className="h-8 text-[13px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground">长期佣金比例（%）</p>
                    <Input
                      placeholder="1"
                      value={longTermRate}
                      onChange={(e) => setLongTermRate(e.target.value)}
                      className="h-8 text-[13px]"
                    />
                  </div>
                  {Number(contractAmount) > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      短期佣金 ¥{Math.round(Number(contractAmount) * Number(shortTermRate) / 100).toLocaleString()} · 长期佣金 ¥{Math.round(Number(contractAmount) * Number(longTermRate) / 100).toLocaleString()}
                    </p>
                  )}
                  <Textarea
                    placeholder="签单备注（选填，如项目类型等）"
                    value={signNote}
                    onChange={(e) => setSignNote(e.target.value)}
                    className="text-[13px] min-h-[60px]"
                  />
                  <Button className="w-full gap-1.5" onClick={() => handleSign(selectedProject)}>
                    <CheckCircle2 className="size-3.5" /> 确认签单并生成佣金
                  </Button>
                </div>
              )}
              <Separator />
              {selectedProject.stage === 'signed' && selectedProject.contractAmount && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-1">
                  <p className="text-[13px] font-semibold text-green-700 dark:text-green-300">已签单 · 合同金额 ¥{selectedProject.contractAmount.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground">佣金已自动生成，请前往分佣结算操作台查看。</p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {selectedProject.stage !== 'signed' && selectedProject.stage !== 'released' && selectedProject.stage !== 'exclusive' && (
                  <Button className="gap-1.5" onClick={() => handleSign(selectedProject)}>
                    <CheckCircle2 className="size-3.5" /> 快速标记签单
                  </Button>
                )}
                {selectedProject.stage !== 'released' && (
                  <Button variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => handleRelease(selectedProject)}>
                    <RotateCcw className="size-3.5" /> 释放归属
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      <Dialog open={manualOpen} onOpenChange={(open) => { setManualOpen(open); if (!open) resetManualForm() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>手动新增项目/线索</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={manualCompanyName}
              onChange={(event) => setManualCompanyName(event.target.value)}
              placeholder="公司名称"
            />
            <Input
              value={manualIndustry}
              onChange={(event) => setManualIndustry(event.target.value)}
              placeholder="行业"
            />
            <Select value={manualPartnerId} onValueChange={(value) => setManualPartnerId(value ?? '')}>
              <SelectTrigger><SelectValue placeholder="绑定推荐人/负责人（可选）" /></SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem key={partner.partnerId} value={partner.partnerId}>{partner.partnerName} · {partner.region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={manualNote}
              onChange={(event) => setManualNote(event.target.value)}
              placeholder="项目详情、来源或备注（选填）"
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)}>取消</Button>
            <Button onClick={handleAddManualProject}>加入总表</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={projectEditorOpen} onOpenChange={(open) => { setProjectEditorOpen(open); if (!open) resetProjectEditor() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑项目基础信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={projectCompanyName} onChange={(event) => setProjectCompanyName(event.target.value)} placeholder="公司名称" />
            <Input value={projectIndustry} onChange={(event) => setProjectIndustry(event.target.value)} placeholder="行业" />
            <Select value={projectOwnerId} onValueChange={(value) => setProjectOwnerId(value ?? '')}>
              <SelectTrigger><SelectValue placeholder="负责人/推荐人（可选）" /></SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem key={partner.partnerId} value={partner.partnerId}>{partner.partnerName} · {partner.region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea value={projectNote} onChange={(event) => setProjectNote(event.target.value)} placeholder="编辑说明（选填）" className="min-h-20" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectEditorOpen(false)}>取消</Button>
            <Button onClick={saveProjectEditor}>保存项目</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirm('') } }}>
        {deleteTarget && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>删除项目记录</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-[12px] leading-relaxed text-destructive">
                删除会从总项目进展表移除该记录，并重置关联备案状态。请输入公司名称「{deleteTarget.companyName}」确认删除。
              </div>
              <Input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder={deleteTarget.companyName} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
              <Button variant="destructive" onClick={() => removeProject(deleteTarget)}><Trash2 className="size-4" /> 确认删除</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
