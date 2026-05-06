import { useNavigate } from 'react-router-dom'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Gift,
  BookOpen,
  Link2,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatListTime, latestOf, sortByNewest } from '@/lib/time'
import type { LeadGrade } from '@/types'

const gradeColors: Record<LeadGrade, string> = {
  S: 'text-fuchsia-600',
  A: 'text-emerald-600',
  B: 'text-blue-600',
  C: 'text-amber-600',
  D: 'text-red-600',
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const accounts = useStore((s) => s.accounts)
  const adminLeads = useStore((s) => s.adminLeads)
  const partners = useStore((s) => s.partners)
  const projects = useStore((s) => s.projects)
  const incentiveTasks = useStore((s) => s.incentiveTasks)
  const redPacketTasks = useStore((s) => s.redPacketTasks)
  const whiteLabelConfig = useStore((s) => s.whiteLabelConfig)
  const bindings = useStore((s) => s.bindings)
  const trainingResources = useStore((s) => s.trainingResources)
  const aigcTemplates = useStore((s) => s.aigcTemplates)
  const commissions = useStore((s) => s.commissions)

  const pendingAccounts = accounts.filter((account) => account.role === 'partner' && account.status === 'pending').length
  const draftIncentives = incentiveTasks.filter((task) => task.status === 'draft').length
  const pendingEvidence = redPacketTasks.filter((task) => task.status === 'evidence_submitted').length
  const whiteLabelPending = whiteLabelConfig.auditStatus === 'pending' ? 1 : 0
  const overdueProjects = projects.filter((project) => project.isOverdue).length
  const unassignedLeads = adminLeads.filter((lead) => lead.status === 'available' && !lead.assignedPartner).length
  const expiringBindings = bindings.filter((binding) =>
    binding.status === 'active' && binding.stage !== 'released' && Math.ceil((new Date(binding.expiredAt).getTime() - Date.now()) / 86400000) <= 7,
  ).length
  const draftTraining = trainingResources.filter((item) => item.status === 'draft').length
  const missingAigcTemplates = (['policy', 'case', 'opportunity'] as const).filter((type) =>
    !aigcTemplates.some((item) => item.type === type && item.status === 'active'),
  ).length
  const pendingCommissions = commissions.filter((item) => item.status === 'pending').length

  const totalLeads = adminLeads.length
  const activePartners = partners.filter((partner) => partner.accountStatus !== 'disabled' && partner.rating !== 'D').length
  const exclusiveProjects = projects.filter((project) => project.stage === 'exclusive').length
  const signedProjects = projects.filter((project) => project.stage === 'signed').length
  const activeProjects = projects.filter((project) => !['released', 'signed'].includes(project.stage)).length
  const signedRate = Math.round((signedProjects / Math.max(projects.length, 1)) * 100)

  const stageCount = (stage: string) => projects.filter((project) => project.stage === stage).length
  const funnelData = [
    { stage: '已申请', count: stageCount('applied') },
    { stage: '对接人', count: stageCount('contact_filled') },
    { stage: '接洽中', count: stageCount('online_meeting') },
    { stage: '排他期', count: exclusiveProjects },
    { stage: '已签单', count: signedProjects },
  ]

  const workQueue = [
    { label: '合伙人注册审核', count: pendingAccounts, icon: Users, path: '/admin/partners', tone: 'text-blue-700 bg-blue-500/10' },
    { label: '红包任务审核', count: draftIncentives, icon: Gift, path: '/admin/incentives', tone: 'text-amber-700 bg-amber-500/10' },
    { label: '凭证发放审核', count: pendingEvidence, icon: ClipboardCheck, path: '/admin/incentives', tone: 'text-emerald-700 bg-emerald-500/10' },
    { label: '贴牌配置审核', count: whiteLabelPending, icon: Palette, path: '/admin/white-label', tone: 'text-sky-700 bg-sky-500/10' },
    { label: '逾期项目处理', count: overdueProjects, icon: AlertTriangle, path: '/admin/tracking', tone: 'text-red-700 bg-red-500/10' },
    { label: '未分配线索', count: unassignedLeads, icon: FileSearch, path: '/admin/leads', tone: 'text-zinc-700 bg-zinc-500/10' },
    { label: '绑定即将到期', count: expiringBindings, icon: Link2, path: '/admin/bindings', tone: 'text-rose-700 bg-rose-500/10' },
    { label: '培训待发布', count: draftTraining, icon: BookOpen, path: '/admin/training', tone: 'text-indigo-700 bg-indigo-500/10' },
    { label: 'AIGC模板缺口', count: missingAigcTemplates, icon: Sparkles, path: '/admin/aigc', tone: 'text-violet-700 bg-violet-500/10' },
    { label: '待结算佣金', count: pendingCommissions, icon: WalletCards, path: '/admin/settlements', tone: 'text-green-700 bg-green-500/10' },
  ]
  const queueTotal = workQueue.reduce((sum, item) => sum + item.count, 0)
  const sortedPartners = [...partners].sort((a, b) => b.closedDeals - a.closedDeals)
  const urgentProjects = sortByNewest(
    projects.filter((project) => project.isOverdue || project.stage === 'applied' || project.stage === 'contact_filled'),
    (project) => latestOf(...project.followupLogs.map((log) => log.date), project.appliedAt),
  ).slice(0, 5)

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader title="管理后台总览" description="待办、审核、归属和项目风险统一处理" />

      <section className="overflow-hidden rounded-2xl border bg-zinc-950 p-4 text-white md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] text-white/55">运营工作台</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">今天还有 {queueTotal} 件事要处理</h2>
            <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-white/55">
              先清审核，再看逾期和未分配线索。所有入口都指向真实管理页，不在总览里做假按钮。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center md:min-w-[320px]">
            <div className="rounded-xl bg-white/[0.07] p-3">
              <p className="text-[10px] text-white/50">活跃合伙人</p>
              <p className="mt-1 text-xl font-bold">{activePartners}</p>
            </div>
            <div className="rounded-xl bg-white/[0.07] p-3">
              <p className="text-[10px] text-white/50">活跃项目</p>
              <p className="mt-1 text-xl font-bold">{activeProjects}</p>
            </div>
            <div className="rounded-xl bg-white/[0.07] p-3">
              <p className="text-[10px] text-white/50">签单率</p>
              <p className="mt-1 text-xl font-bold">{signedRate}%</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        {workQueue.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => navigate(item.path)}
            className="rounded-2xl border bg-card p-3 text-left transition-colors hover:bg-muted/60 active:scale-[0.99]"
          >
            <div className={cn('mb-3 flex size-8 items-center justify-center rounded-xl', item.tone)}>
              <item.icon className="size-4" />
            </div>
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-bold leading-none">{item.count}</p>
          </button>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl shadow-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">项目转化漏斗</CardTitle>
              <Badge variant="outline">线索 {totalLeads}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelData.map((item) => {
              const pct = Math.round((item.count / Math.max(totalLeads, 1)) * 100)
              return (
                <div key={item.stage} className="grid grid-cols-[56px_1fr_42px] items-center gap-3">
                  <span className="text-[12px] text-muted-foreground">{item.stage}</span>
                  <Progress value={Math.max(pct, item.count > 0 ? 8 : 0)} className="h-2" />
                  <span className="text-right text-[12px] font-mono">{item.count}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">项目风险</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => navigate('/admin/tracking')}>查看全部</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {urgentProjects.length === 0 ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700">
                暂无逾期或待推进项目
              </div>
            ) : urgentProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => navigate('/admin/tracking')}
                className="flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{project.companyName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {project.ownerPartnerName ?? '未分配'} · {project.industry} · 最新 {formatListTime(latestOf(...project.followupLogs.map((log) => log.date), project.appliedAt))}
                  </p>
                </div>
                <Badge variant={project.isOverdue ? 'destructive' : 'outline'} className="shrink-0 text-[10px]">
                  {project.isOverdue ? '逾期' : project.stage === 'applied' ? '补对接人' : '接洽'}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">合伙人绩效排行</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => navigate('/admin/partners')}>管理合伙人</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
            {sortedPartners.slice(0, 8).map((partner, index) => (
              <div key={partner.partnerId} className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-bold">{index + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{partner.partnerName}</p>
                      <p className="text-[11px] text-muted-foreground">{partner.region}</p>
                    </div>
                  </div>
                  <span className={cn('font-bold', gradeColors[partner.rating])}>{partner.rating}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-muted-foreground">
                  <span>成单 <b className="text-foreground">{partner.closedDeals}</b></span>
                  <span className="text-right">项目 <b className="text-foreground">{partner.activeProjects}</b></span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          { label: '排他保护中', value: exclusiveProjects, icon: ShieldCheck },
          { label: '本期成单', value: signedProjects, icon: CheckCircle2 },
          { label: '可申请线索', value: unassignedLeads, icon: FileSearch },
          { label: '逾期预警', value: overdueProjects, icon: AlertTriangle },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border bg-card p-4">
            <item.icon className="mb-3 size-4 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-bold leading-none">{item.value}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
