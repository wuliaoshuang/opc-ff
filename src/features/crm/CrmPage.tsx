import { useState } from "react";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubsectionTabs } from "@/components/shared/SubsectionTabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AddProjectDialog } from "./components/AddProjectDialog";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, Briefcase, CheckCircle2, Clock, Plus, ShieldCheck, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatListTime, latestOf, sortByNewest } from "@/lib/time";
import { projectPhase16Labels, type CrmProject, type ProjectStage } from "@/types";

const bindingStageLabels = {
  temporary: "临时绑定",
  locked: "初步锁定",
  exclusive: "排他保护",
  released: "已释放",
} as const;

const stageConfig: Record<ProjectStage, { label: string; color: string; icon: typeof Clock }> = {
  applied: { label: "已申请", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  contact_filled: { label: "对接人已填", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: ArrowRight },
  online_meeting: { label: "线上接洽中", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400", icon: Video },
  exclusive: { label: "排他期", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: ShieldCheck },
  signed: { label: "已签单", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  released: { label: "已释放", color: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400", icon: X },
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function getProjectLatestTime(project: CrmProject) {
  return latestOf(...project.followupLogs.map((log) => log.date), project.appliedAt);
}

function sourceLabel(project: CrmProject) {
  if (project.source === "filing") return "备案项目";
  if (project.source === "lead") return "线索跟进";
  return "手动登记";
}

function deadlineLabel(project: CrmProject) {
  if (project.stage === "exclusive" && project.exclusiveEnd) return `排他剩余 ${daysUntil(project.exclusiveEnd)} 天`;
  if (project.stage === "applied") return `对接人截止 ${daysUntil(project.contactDeadline)} 天`;
  if (project.stage === "contact_filled") return `接洽截止 ${daysUntil(project.meetingDeadline)} 天`;
  return "—";
}

export default function CrmPage() {
  const projects = useStore((state) => state.projects);
  const commissions = useStore((state) => state.commissions);
  const user = useStore((state) => state.user);
  const addProject = useStore((state) => state.addProject);
  const addManualBinding = useStore((state) => state.addManualBinding);
  const [selectedProject, setSelectedProject] = useState<CrmProject | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);

  const myProjects = projects.filter(
    (project) => project.ownerPartnerId === user?.id || project.ownerPartnerName === user?.name,
  );
  const sortedProjects = sortByNewest(myProjects, getProjectLatestTime);
  const filtered = activeTab === "all" ? sortedProjects : sortedProjects.filter((project) => project.stage === activeTab);
  const releasedProjects = myProjects
    .filter((project) => project.stage === "exclusive" && project.exclusiveEnd && daysUntil(project.exclusiveEnd) < 0)
    .map((project) => project.companyName);
  const showBanner = releasedProjects.length > 0 && !dismissedBanner;
  const followCount = myProjects.filter((project) => project.stage === "applied" || project.stage === "contact_filled" || project.stage === "online_meeting").length;
  const filingCount = myProjects.filter((project) => project.filingStatus && project.filingStatus !== "none").length;
  const exclusiveCount = myProjects.filter((project) => project.stage === "exclusive").length;

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader
        title="个人项目进展表单"
        description="只读查看本人备案项目与跟进项目，项目编辑统一由后台管理员维护"
        action={
          <Button size="sm" className="gap-1.5" onClick={() => setAddProjectOpen(true)}>
            <Plus className="size-4" />
            手动登记项目
          </Button>
        }
      />

      <section className="grid grid-cols-3 gap-2 md:gap-4">
        {[
          { label: "跟进项目", value: followCount, helper: "后台维护进度", tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
          { label: "备案项目", value: filingCount, helper: "含待审/通过", tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
          { label: "优先排他", value: exclusiveCount, helper: "备案通过2个月", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
        ].map((item) => (
          <div key={item.label} className={cn("rounded-2xl border p-3 md:p-4", item.tone)}>
            <p className="text-[11px] font-medium opacity-80 md:text-xs">{item.label}</p>
            <p className="mt-1 text-2xl font-bold leading-none md:text-3xl">{item.value}</p>
            <p className="mt-1 text-[10px] opacity-70 md:text-xs">{item.helper}</p>
          </div>
        ))}
      </section>

      {showBanner && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-50 p-4 dark:bg-amber-950/20">
          <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-amber-900 dark:text-amber-200">排他期到期提醒</p>
            <p className="mt-1 text-[12px] text-amber-700 dark:text-amber-400">
              以下项目排他期已到期，已自动释放至公海：<span className="ml-1 font-medium">{releasedProjects.join("、")}</span>
            </p>
          </div>
          <button onClick={() => setDismissedBanner(true)} className="shrink-0 text-amber-600 hover:text-amber-800 dark:text-amber-500">
            <X className="size-4" />
          </button>
        </div>
      )}

      <SubsectionTabs
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          { value: "all", label: "全部", count: myProjects.length },
          ...(Object.keys(stageConfig) as ProjectStage[]).map((stage) => ({
            value: stage,
            label: stageConfig[stage].label,
            count: myProjects.filter((project) => project.stage === stage).length,
          })),
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="暂无项目" description="请从目标项目清单选择跟进或申请备案" />
      ) : (
        <>
          <Card className="hidden md:block">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>公司名称</TableHead>
                    <TableHead>行业</TableHead>
                    <TableHead>最新时间</TableHead>
                    <TableHead>阶段</TableHead>
                    <TableHead>来源</TableHead>
                    <TableHead>截止/排他</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((project) => {
                    const cfg = stageConfig[project.stage];
                    return (
                      <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedProject(project)}>
                        <TableCell className="font-medium">{project.companyName}</TableCell>
                        <TableCell>{project.industry}</TableCell>
                        <TableCell className="text-sm">{formatListTime(getProjectLatestTime(project))}</TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", cfg.color)}>
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline">{sourceLabel(project)}</Badge>
                            {(project.bindingTags ?? []).map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{deadlineLabel(project)}</TableCell>
                        <TableCell>
                          {project.filingStatus === "pending" && <Badge variant="outline">备案待审</Badge>}
                          {project.isOverdue && <Badge variant="destructive" className="gap-1"><AlertTriangle className="size-3" />逾期</Badge>}
                          {project.isExclusive && !project.isOverdue && <Badge className="gap-1"><ShieldCheck className="size-3" />排他中</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-3 md:hidden">
            {filtered.map((project) => {
              const cfg = stageConfig[project.stage];
              const exclusiveDays = project.exclusiveEnd ? daysUntil(project.exclusiveEnd) : 0;
              const progressValue = project.stage === "exclusive" && project.exclusiveEnd
                ? Math.max(0, Math.min(100, (exclusiveDays / 60) * 100))
                : project.stage === "applied" ? 20
                  : project.stage === "contact_filled" ? 40
                    : project.stage === "online_meeting" ? 60
                      : project.stage === "signed" ? 100
                        : 0;
              return (
                <Card key={project.id} className="cursor-pointer rounded-2xl border-border/70 shadow-none" onClick={() => setSelectedProject(project)}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{project.companyName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{project.industry} · 最新 {formatListTime(getProjectLatestTime(project))}</p>
                      </div>
                      <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", cfg.color)}>{cfg.label}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{sourceLabel(project)}</Badge>
                      {(project.bindingTags ?? []).map((tag) => <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>)}
                      <span>{deadlineLabel(project)}</span>
                    </div>
                    {project.stage !== "released" && project.stage !== "signed" && <Progress value={progressValue} className="h-1.5" />}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Sheet open={!!selectedProject} onOpenChange={(open) => { if (!open) setSelectedProject(null); }}>
        {selectedProject && (
          <SheetContent className="overflow-y-auto sm:max-w-lg">
            <SheetHeader>
              <SheetTitle className="flex flex-wrap items-center gap-2">
                {selectedProject.companyName}
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", stageConfig[selectedProject.stage].color)}>
                  {stageConfig[selectedProject.stage].label}
                </span>
              </SheetTitle>
            </SheetHeader>

            <div className="mt-4 space-y-5">
              <div className="rounded-xl border bg-muted/30 p-3 text-[12px] text-muted-foreground">
                当前页面为只读个人项目表单；项目详情、进度、推荐人和备案审核由后台管理员在总项目进展表单维护。
              </div>

              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div><span className="text-muted-foreground">来源</span><p className="mt-0.5 font-medium">{sourceLabel(selectedProject)}</p></div>
                <div><span className="text-muted-foreground">申请时间</span><p className="mt-0.5 font-medium">{formatListTime(selectedProject.appliedAt)}</p></div>
                <div><span className="text-muted-foreground">行业</span><p className="mt-0.5 font-medium">{selectedProject.industry}</p></div>
                <div><span className="text-muted-foreground">16阶段</span><p className="mt-0.5 font-medium">{selectedProject.projectPhase16 ? projectPhase16Labels[selectedProject.projectPhase16] : "未设置"}</p></div>
                <div><span className="text-muted-foreground">推荐人</span><p className="mt-0.5 font-medium">{selectedProject.referrerPartnerName ?? selectedProject.ownerPartnerName ?? "—"}</p></div>
                <div><span className="text-muted-foreground">备案状态</span><p className="mt-0.5 font-medium">{selectedProject.filingStatus === "pending" ? "待审核" : selectedProject.filingStatus === "approved" ? "已通过" : selectedProject.filingStatus === "rejected" ? "已驳回" : "未备案"}</p></div>
                {selectedProject.stage === "exclusive" && selectedProject.exclusiveEnd && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">排他期</span>
                    <p className="mt-0.5 font-medium">{selectedProject.exclusiveStart} 至 {selectedProject.exclusiveEnd}（剩余 {daysUntil(selectedProject.exclusiveEnd)} 天）</p>
                  </div>
                )}
              </div>

              {selectedProject.contactPerson && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">对接人信息</p>
                    <div className="grid grid-cols-2 gap-2 text-[13px]">
                      <div><span className="text-muted-foreground">姓名：</span>{selectedProject.contactPerson.name}</div>
                      <div><span className="text-muted-foreground">角色：</span>{selectedProject.contactPerson.role}</div>
                      <div><span className="text-muted-foreground">电话：</span>{selectedProject.contactPerson.phone || "—"}</div>
                      <div><span className="text-muted-foreground">信任度：</span>{selectedProject.contactPerson.trustLevel}/10</div>
                      <div><span className="text-muted-foreground">决策度：</span>{selectedProject.contactPerson.decisionLevel}/10</div>
                    </div>
                  </div>
                </>
              )}

              {selectedProject.stage === "signed" && (
                <>
                  <Separator />
                  <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                    <p className="flex items-center gap-1.5 text-[13px] font-semibold text-green-700 dark:text-green-300"><CheckCircle2 className="size-3.5" /> 项目已签单</p>
                    {selectedProject.contractAmount && (
                      <p className="mt-2 text-[12px] text-muted-foreground">合同金额 <span className="font-semibold text-foreground">¥{selectedProject.contractAmount.toLocaleString()}</span></p>
                    )}
                    <div className="mt-3 space-y-1.5">
                      {commissions.filter((commission) => commission.projectId === selectedProject.id).map((commission) => (
                        <div key={commission.id} className="flex items-center justify-between rounded-lg bg-background p-2 text-[12px]">
                          <span>{commission.level === "primary" ? "一级" : "二级"} · {commission.type === "short_term" ? "短期" : "长期"}</span>
                          <span className="font-mono font-semibold">¥{commission.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-semibold">项目进展日志</p>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {selectedProject.followupLogs.length === 0 ? (
                    <p className="text-[12px] text-muted-foreground">暂无跟进记录</p>
                  ) : (
                    [...selectedProject.followupLogs].reverse().map((log, index) => (
                      <div key={`${log.date}-${index}`} className="flex gap-3 text-[12px]">
                        <span className="w-20 shrink-0 text-muted-foreground">{log.date}</span>
                        <div>
                          <span className="font-medium">{log.action}</span>
                          {log.result !== "—" && <span className="ml-2 text-muted-foreground">{log.result}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      <AddProjectDialog
        open={addProjectOpen}
        onOpenChange={setAddProjectOpen}
        onSubmit={(project) => {
          if (!user) return;
          const bindingResult = addManualBinding(project.companyName, project.industry, user.id, user.name);
          if (!bindingResult.success && bindingResult.conflict) {
            toast.error(`该客户已由${bindingResult.conflict.partnerName}绑定，当前阶段：${bindingStageLabels[bindingResult.conflict.stage]}`);
            return;
          }
          addProject({
            ...project,
            ownerPartnerId: user.id,
            ownerPartnerName: user.name,
            referrerPartnerId: user.id,
            referrerPartnerName: user.name,
            bindingTags: ["绑定"],
          });
          toast.success("项目已提交到个人项目表单，后续由后台管理员维护进度");
        }}
      />
    </div>
  );
}
