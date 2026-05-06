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
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle2, Download, RotateCcw, Video, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatListTime, latestOf, sortByNewest } from '@/lib/time'
import type { CrmProject, ProjectStage } from '@/types'

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

export default function BusinessTrackingPage() {
  const projects = useStore((s) => s.projects)
  const partners = useStore((s) => s.partners)
  const bindings = useStore((s) => s.bindings)
  const adminLeads = useStore((s) => s.adminLeads)
  const signProject = useStore((s) => s.signProject)
  const signProjectAndCreateCommissions = useStore((s) => s.signProjectAndCreateCommissions)
  const confirmOnlineMeeting = useStore((s) => s.confirmOnlineMeeting)
  const advanceBindingStage = useStore((s) => s.advanceBindingStage)
  const releaseProjectByCompany = useStore((s) => s.releaseProjectByCompany)
  const releaseLeadByCompany = useStore((s) => s.releaseLeadByCompany)
  const releaseAdminLeadByCompany = useStore((s) => s.releaseAdminLeadByCompany)
  const releaseBinding = useStore((s) => s.releaseBinding)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<ProjectStage | 'all'>('all')
  const [selectedProject, setSelectedProject] = useState<CrmProject | null>(null)
  const [signNote, setSignNote] = useState('')
  const [contractAmount, setContractAmount] = useState('')
  const [shortTermRate, setShortTermRate] = useState('3')
  const [longTermRate, setLongTermRate] = useState('1')

  const filtered = sortByNewest(projects, getProjectLatestTime)
    .filter((p) => stageFilter === 'all' || p.stage === stageFilter)
    .filter((p) => !search || p.companyName.includes(search) || p.industry.includes(search))

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

  const statItems = [
    { label: '全部项目', value: projects.length },
    { label: '待补对接人', value: projects.filter((project) => project.stage === 'applied').length },
    { label: '排他保护', value: projects.filter((project) => project.stage === 'exclusive').length },
    { label: '逾期风险', value: projects.filter((project) => project.isOverdue).length },
  ]

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader
        title="商务跟进统一表"
        description="全局项目跟进进度与商务情况汇总"
        action={
          <Button size="sm" variant="outline" className="gap-1.5">
            <Download className="size-4" /> 导出 Excel
          </Button>
        }
      />

      <section className="grid grid-cols-4 gap-2">
        {statItems.map((item) => (
          <div key={item.label} className="rounded-2xl border bg-card p-3">
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-xl font-bold">{item.value}</p>
          </div>
        ))}
      </section>

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
                  </div>
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
                <div><span className="text-muted-foreground">来源：</span>{selectedProject.source === 'lead' ? '线索申请' : '主动登记'}</div>
                <div><span className="text-muted-foreground">负责人：</span>{getPartnerName(selectedProject)}</div>
                <div><span className="text-muted-foreground">状态：</span>{selectedProject.isOverdue ? '逾期' : selectedProject.isExclusive ? '排他中' : '正常'}</div>
              </div>

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
    </div>
  )
}
