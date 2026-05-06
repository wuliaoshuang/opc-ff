import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  Clock,
  FileText,
  Gift,
  Handshake,
  Lightbulb,
  Radar,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/stores";
import { cn } from "@/lib/utils";
import { formatListTime, latestOf, sortByNewest } from "@/lib/time";
import type { PotentialLead } from "@/types";

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function PartnerDashboardPage() {
  const navigate = useNavigate();
  const leads = useStore((s) => s.leads);
  const projects = useStore((s) => s.projects);
  const redPacketTasks = useStore((s) => s.redPacketTasks);
  const commissions = useStore((s) => s.commissions);
  const user = useStore((s) => s.user);
  const subPartners = useStore((s) => s.subPartners);

  const [aiAnalysisLead, setAiAnalysisLead] = useState<PotentialLead | null>(
    null,
  );
  const [aigcDialogOpen, setAigcDialogOpen] = useState(false);

  const shortTermEarned = redPacketTasks
    .filter((t) => t.status === "paid")
    .reduce((sum, task) => sum + task.amount, 0);
  const longTermPending = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, commission) => sum + commission.amount, 0);
  const longTermSettled = commissions
    .filter((c) => c.status === "settled")
    .reduce((sum, commission) => sum + commission.amount, 0);
  const availableLeads = leads.filter(
    (lead) => lead.status === "available",
  ).length;
  const exclusiveProjects = projects.filter(
    (project) => project.stage === "exclusive",
  ).length;
  const signedCount = projects.filter(
    (project) => project.stage === "signed",
  ).length;

  const overdueProjects = projects.filter((project) => project.isOverdue);
  const getProjectLatestTime = (project: (typeof projects)[number]) =>
    latestOf(...project.followupLogs.map((log) => log.date), project.appliedAt);
  const urgentProjects = sortByNewest(
    projects.filter(
      (project) =>
        (project.stage === "applied" || project.stage === "contact_filled") &&
        !project.isOverdue,
    ),
    getProjectLatestTime,
  ).slice(0, 3);
  const availableTasks = sortByNewest(
    redPacketTasks.filter((task) => task.status === "available"),
    (task) => task.createdAt ?? task.deadline,
  );
  const executingTasks = sortByNewest(
    redPacketTasks.filter(
      (task) =>
        task.status === "executing" || task.status === "evidence_submitted",
    ),
    (task) =>
      latestOf(
        task.evidence?.submittedAt,
        task.claimedAt,
        task.createdAt,
        task.deadline,
      ),
  );
  const topLeads = [...leads]
    .sort((a, b) => b.aiMatchScore - a.aiMatchScore)
    .slice(0, 4);
  const todayActions = sortByNewest(
    projects.filter((project) => {
      if (project.stage === "applied")
        return daysUntil(project.contactDeadline) <= 7;
      if (project.stage === "contact_filled")
        return daysUntil(project.meetingDeadline) <= 14;
      return false;
    }),
    getProjectLatestTime,
  );
  const newWeeklyLeads = leads
    .filter((lead) => lead.status === "available")
    .slice(0, 3);
  const activeSubPartners = sortByNewest(
    subPartners.filter(
      (partner) => partner.parentId === user?.id && partner.status === "active",
    ),
    (partner) => partner.boundAt,
  );
  const topSubPartner = [...activeSubPartners].sort(
    (a, b) => b.activeProjects - a.activeProjects,
  )[0];
  const weeklyActions = [
    {
      label: "最值得跟进客户",
      value: topLeads[0]?.companyName ?? "暂无推荐",
      helper: topLeads[0]
        ? `${topLeads[0].industry} · 匹配 ${topLeads[0].aiMatchScore}%`
        : "先完成 AI 线索挖掘",
    },
    {
      label: "最关键推进动作",
      value: urgentProjects[0]?.companyName ?? "暂无紧急动作",
      helper:
        urgentProjects[0]?.stage === "applied"
          ? "补全对接人信息"
          : urgentProjects[0]
            ? "确认线上接洽"
            : "本周节奏正常",
    },
    {
      label: "每周新增客户",
      value: `${newWeeklyLeads.length} 条`,
      helper:
        newWeeklyLeads.map((lead) => lead.companyName).join("、") || "暂无新增",
    },
    {
      label: "二级合伙人进展",
      value: topSubPartner
        ? topSubPartner.name
        : `${activeSubPartners.length} 人`,
      helper: topSubPartner
        ? `${topSubPartner.region} · 活跃项目 ${topSubPartner.activeProjects}`
        : "可发展下级渠道",
    },
  ];

  const quickActions = [
    {
      label: "挖线索",
      sub: `${availableLeads} 条可申请`,
      icon: Radar,
      path: "/partner/leads",
    },
    {
      label: "补跟进",
      sub: `${urgentProjects.length} 个动作`,
      icon: CalendarCheck,
      path: "/partner/crm",
    },
    {
      label: "领任务",
      sub: `${availableTasks.length} 个红包`,
      icon: Gift,
      path: "/partner/red-packets",
    },
    {
      label: "写内容",
      sub: "政策/案例/话术",
      icon: Sparkles,
      path: "/partner/aigc",
    },
  ];

  const mockAiAnalysis = (lead: PotentialLead) => ({
    opportunity: `${lead.companyName}作为${lead.industry}行业${lead.isListed ? "上市公司" : "重点企业"}，年用能成本约${lead.energyUsage}，存在显著节能降碳需求。当前政策环境利好，建议优先跟进。`,
    strategy: `破冰策略：利用您的行业资源，通过${lead.region}本地商会/协会引荐。重点突破设备科或能源管理部门，强调投资回报周期（预计2-3年）。`,
    matchScore: lead.aiMatchScore,
    valueScore: lead.isListed ? 95 : 78,
  });

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="overflow-hidden rounded-2xl border border-primary/10 bg-primary/90 text-white shadow-sm">
        <div className="space-y-4 p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[12px] text-white/60">
                {user?.region ?? "本地"}合伙人工作台
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">
                {user?.name ?? "合伙人"}，今天优先推进{" "}
                {todayActions.length || urgentProjects.length} 件事
              </h1>
            </div>
            <Badge className="shrink-0 border-white/15 bg-white/10 text-white hover:bg-white/10">
              {overdueProjects.length > 0
                ? `${overdueProjects.length} 个预警`
                : "节奏正常"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
              <p className="text-[11px] text-white/55">待补对接</p>
              <p className="mt-1 text-2xl font-bold">
                {
                  projects.filter((project) => project.stage === "applied")
                    .length
                }
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
              <p className="text-[11px] text-white/55">排他保护</p>
              <p className="mt-1 text-2xl font-bold">{exclusiveProjects}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
              <p className="text-[11px] text-white/55">待传凭证</p>
              <p className="mt-1 text-2xl font-bold">{executingTasks.length}</p>
            </div>
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="min-w-[126px] rounded-xl border border-white/10 bg-white/[0.08] p-3 text-left transition-colors hover:bg-white/[0.12] active:scale-[0.98]"
              >
                <action.icon className="size-4 text-emerald-300" />
                <p className="mt-2 text-sm font-medium">{action.label}</p>
                <p className="mt-0.5 text-[11px] text-white/55">{action.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <MetricCard
          icon={Wallet}
          label="短期收益"
          value={`¥${shortTermEarned.toLocaleString()}`}
          helper="已发放任务奖励"
          tag="红包奖励"
        />
        <MetricCard
          icon={TrendingUp}
          label="长期收益"
          value={`¥${longTermSettled.toLocaleString()}`}
          helper={`待结算 ¥${longTermPending.toLocaleString()}`}
          tag="项目分佣"
        />
        <MetricCard
          icon={Target}
          label="线索漏斗"
          value={`${availableLeads}`}
          helper={`排他 ${exclusiveProjects} · 签单 ${signedCount}`}
          tag="可申请"
        />
        <MetricCard
          icon={Star}
          label="绩效评级"
          value="A+"
          helper="本月排名 Top 5%"
          tag="评级"
          accent
        />
      </div>

      <Card className="rounded-2xl border-border/70 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="size-4 text-primary" /> 每周关键商务行动
            </CardTitle>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              系统周更
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {weeklyActions.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border bg-muted/25 p-3"
              >
                <p className="text-[11px] font-medium text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 line-clamp-1 text-sm font-semibold">
                  {item.value}
                </p>
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                  {item.helper}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-primary" /> AI 智能线索流
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/partner/leads")}
                >
                  查看全部 <ArrowRight className="ml-1 size-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {topLeads.map((lead, index) => {
                const analysis = mockAiAnalysis(lead);
                return (
                  <div
                    key={lead.id}
                    className="rounded-xl border bg-card p-3 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <span className="text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {lead.companyName}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {lead.industry} · {lead.region} · {lead.revenue}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-lg font-bold leading-none text-primary">
                              {lead.aiMatchScore}
                            </p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              匹配
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {lead.isListed && (
                            <Badge variant="outline" className="text-[10px]">
                              上市
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px]">
                            价值 {analysis.valueScore}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            资源 {analysis.matchScore}
                          </Badge>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-[12px]"
                            onClick={() => setAiAnalysisLead(lead)}
                          >
                            <Lightbulb className="size-3.5" /> 策略
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 text-[12px]"
                            onClick={() => navigate("/partner/leads")}
                          >
                            申请 <ChevronRight className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="size-4 text-emerald-500" />{" "}
                今日行动清单
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {urgentProjects.length > 0 ? (
                urgentProjects.map((project) => {
                  const daysLeft =
                    project.stage === "applied"
                      ? daysUntil(project.contactDeadline)
                      : daysUntil(project.meetingDeadline);
                  return (
                    <button
                      key={project.id}
                      onClick={() => navigate("/partner/crm")}
                      className="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:border-primary/40 active:scale-[0.99]"
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                          daysLeft <= 3
                            ? "bg-red-500/10 text-red-600"
                            : "bg-amber-500/10 text-amber-600",
                        )}
                      >
                        <Clock className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-medium">
                            {project.companyName}
                          </p>
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[10px]"
                          >
                            {daysLeft}天
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          最新 {formatListTime(getProjectLatestTime(project))} ·{" "}
                          {project.stage === "applied"
                            ? "补全对接人信息，进入初步锁定"
                            : "确认线上接洽，争取排他保护"}
                        </p>
                        <Progress
                          value={project.stage === "applied" ? 32 : 66}
                          className="mt-2 h-1.5"
                        />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed p-5 text-center">
                  <CircleCheck className="mx-auto size-8 text-emerald-500" />
                  <p className="mt-2 text-sm font-medium">今天没有紧急推进项</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    可以去线索池挑选新的高匹配客户
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-4 text-amber-500" /> 红包任务
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableTasks.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {availableTasks.slice(0, 4).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => navigate("/partner/red-packets")}
                      className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/[0.04] p-4 text-left transition-colors hover:border-amber-500/60 active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Badge variant="outline" className="text-[10px]">
                            {task.createdBy === "platform"
                              ? "平台发布"
                              : "合伙人发起"}
                          </Badge>
                          <p className="mt-2 line-clamp-1 text-sm font-semibold">
                            {task.name}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {task.projectName} ·{" "}
                            {formatListTime(task.createdAt ?? task.deadline)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <Gift className="ml-auto size-4 text-amber-600" />
                          <p className="mt-2 text-xl font-bold text-amber-600">
                            ¥{task.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-5 text-center">
                  <Gift className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">暂无可领取红包任务</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    后台发布后会在这里展示
                  </p>
                </div>
              )}

              {executingTasks.length > 0 && (
                <Alert className="mt-4 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
                  <Clock className="size-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-[12px] text-blue-700 dark:text-blue-300">
                    您有 {executingTasks.length} 个任务执行中，请及时上传凭证
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate("/partner/channel")}
            >
              <CardContent className="p-4 md:pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">二级渠道</p>
                    <p className="text-xs text-muted-foreground">
                      查看团队进度和下级分佣
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setAigcDialogOpen(true)}
            >
              <CardContent className="p-4 md:pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Zap className="size-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">AIGC 工具箱</p>
                    <p className="text-xs text-muted-foreground">
                      生成政策、案例和获客话术
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card
            className={cn(
              overdueProjects.length > 0 && "border-destructive/50",
            )}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle
                  className={cn(
                    "size-4",
                    overdueProjects.length > 0
                      ? "text-destructive"
                      : "text-amber-500",
                  )}
                />
                推进预警
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdueProjects.length > 0 ? (
                overdueProjects.map((project) => (
                  <Alert
                    key={project.id}
                    variant="destructive"
                    className="py-3"
                  >
                    <AlertDescription className="text-[12px]">
                      <p className="mb-1 font-medium">{project.companyName}</p>
                      <p className="text-destructive/80">
                        {project.stage === "applied"
                          ? "对接人信息逾期未填"
                          : "线上接洽逾期未完成"}
                      </p>
                    </AlertDescription>
                  </Alert>
                ))
              ) : (
                <div className="rounded-xl bg-emerald-500/5 p-4 text-center">
                  <CircleCheck className="mx-auto size-7 text-emerald-500" />
                  <p className="mt-2 text-sm font-medium">暂无逾期项目</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    所有保护期动作都在节奏内
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:pt-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">本周重点客户</p>
                  <p className="text-xs text-muted-foreground">AI 推荐 Top 3</p>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="space-y-2">
                {topLeads.slice(0, 3).map((lead, index) => (
                  <button
                    key={lead.id}
                    onClick={() => setAiAnalysisLead(lead)}
                    className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {lead.companyName}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {lead.aiMatchScore}%
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!aiAnalysisLead}
        onOpenChange={(open) => {
          if (!open) setAiAnalysisLead(null);
        }}
      >
        {aiAnalysisLead && (
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="size-5 text-amber-500" />
                AI 策略分析
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-2xl font-bold text-primary">
                    {aiAnalysisLead.aiMatchScore}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {aiAnalysisLead.companyName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {aiAnalysisLead.industry} · {aiAnalysisLead.region}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Target className="size-4 text-blue-600" />
                    <p className="text-sm font-medium">机会分析</p>
                  </div>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {mockAiAnalysis(aiAnalysisLead).opportunity}
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Handshake className="size-4 text-emerald-600" />
                    <p className="text-sm font-medium">破冰策略</p>
                  </div>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {mockAiAnalysis(aiAnalysisLead).strategy}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
                    <p className="mb-1 text-xs text-muted-foreground">
                      线索价值
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {mockAiAnalysis(aiAnalysisLead).valueScore}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/20">
                    <p className="mb-1 text-xs text-muted-foreground">
                      资源匹配
                    </p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {mockAiAnalysis(aiAnalysisLead).matchScore}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setAiAnalysisLead(null)}>
                关闭
              </Button>
              <Button
                onClick={() => {
                  setAiAnalysisLead(null);
                  navigate("/partner/leads");
                }}
              >
                立即申请
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={aigcDialogOpen} onOpenChange={setAigcDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="size-5 text-emerald-600" />
              AIGC 内容生成
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => navigate("/partner/aigc")}
            >
              <FileText className="size-4" /> 政策解读文章
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => navigate("/partner/aigc")}
            >
              <Sparkles className="size-4" /> 案例分析内容
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => navigate("/partner/aigc")}
            >
              <Target className="size-4" /> 商机挖掘话术
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type MetricCardProps = {
  icon: typeof Wallet;
  label: string;
  value: string;
  helper: string;
  tag: string;
  accent?: boolean;
};

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tag,
  accent,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        accent && "border-primary/30 bg-primary/[0.04]",
      )}
    >
      <CardContent className="p-4 md:pt-6">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <Icon className="size-4 shrink-0" />
            <span className="truncate text-xs font-medium">{label}</span>
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {tag}
          </Badge>
        </div>
        <p
          className={cn(
            "text-xl font-bold md:text-2xl",
            accent && "text-primary md:text-3xl",
          )}
        >
          {value}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
