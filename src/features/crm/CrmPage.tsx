import { useState } from "react";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubsectionTabs } from "@/components/shared/SubsectionTabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Plus,
  X,
  UserPlus,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatListTime, latestOf, sortByNewest } from "@/lib/time";
import { toast } from "sonner";
import { AddProjectDialog } from "./components/AddProjectDialog";
import type { CrmProject, CustomerBinding, ProjectStage } from "@/types";

const stageConfig: Record<
  ProjectStage,
  { label: string; color: string; icon: typeof Clock }
> = {
  applied: {
    label: "已申请",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Clock,
  },
  contact_filled: {
    label: "对接人已填",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: ArrowRight,
  },
  online_meeting: {
    label: "线上接洽",
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    icon: ArrowRight,
  },
  exclusive: {
    label: "排他期",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: ShieldCheck,
  },
  signed: {
    label: "已签单",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
  released: {
    label: "已释放",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400",
    icon: X,
  },
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function getProjectLatestTime(project: CrmProject) {
  return latestOf(
    ...project.followupLogs.map((log) => log.date),
    project.appliedAt,
  );
}

export default function CrmPage() {
  const projects = useStore((s) => s.projects);
  const addProject = useStore((s) => s.addProject);
  const fillContactAndAdvance = useStore((s) => s.fillContactAndAdvance);
  const requestOnlineMeeting = useStore((s) => s.requestOnlineMeeting);
  const bindings = useStore((s) => s.bindings);
  const fillContactInfo = useStore((s) => s.fillContactInfo);
  const applyOnlineMeeting = useStore((s) => s.applyOnlineMeeting);
  const checkConflict = useStore((s) => s.checkConflict);
  const addBinding = useStore((s) => s.addBinding);
  const user = useStore((s) => s.user);
  const [selectedProject, setSelectedProject] = useState<CrmProject | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const sortedProjects = sortByNewest(projects, getProjectLatestTime);
  const filtered =
    activeTab === "all"
      ? sortedProjects
      : sortedProjects.filter((p) => p.stage === activeTab);
  const releasedProjects = projects
    .filter(
      (p) =>
        p.stage === "exclusive" &&
        p.exclusiveEnd &&
        daysUntil(p.exclusiveEnd) < 0,
    )
    .map((p) => p.companyName);

  const showBanner = releasedProjects.length > 0 && !dismissedBanner;
  const needsContact = projects.filter(
    (project) => project.stage === "applied",
  ).length;
  const needsMeeting = projects.filter(
    (project) => project.stage === "contact_filled",
  ).length;
  const exclusiveCount = projects.filter(
    (project) => project.stage === "exclusive",
  ).length;

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader
        title="项目跟进"
        description="管理您的项目跟进清单和排他期"
        action={
          <Button
            size="lg"
            className="gap-1.5"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="size-4" /> 主动登记项目
          </Button>
        }
      />

      <section className="grid grid-cols-3 gap-2 md:grid-cols-3 md:gap-4">
        {[
          {
            label: "补对接人",
            value: needsContact,
            helper: "30天规则",
            tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
          },
          {
            label: "线上接洽",
            value: needsMeeting,
            helper: "60天规则",
            tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
          },
          {
            label: "排他保护",
            value: exclusiveCount,
            helper: "180天规则",
            tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={cn("rounded-2xl border p-3 md:p-4", item.tone)}
          >
            <p className="text-[11px] font-medium opacity-80 md:text-xs">
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-bold leading-none md:text-3xl">
              {item.value}
            </p>
            <p className="mt-1 text-[10px] opacity-70 md:text-xs">
              {item.helper}
            </p>
          </div>
        ))}
      </section>

      {showBanner && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-50 p-4 dark:bg-amber-950/20">
          <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-amber-900 dark:text-amber-200">
              排他期到期提醒
            </p>
            <p className="mt-1 text-[12px] text-amber-700 dark:text-amber-400">
              以下项目排他期已到期，已自动释放至公海：
              <span className="font-medium ml-1">
                {releasedProjects.join("、")}
              </span>
            </p>
          </div>
          <button
            onClick={() => setDismissedBanner(true)}
            className="shrink-0 text-amber-600 hover:text-amber-800 dark:text-amber-500 dark:hover:text-amber-300"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <SubsectionTabs
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          { value: "all", label: "全部", count: projects.length },
          ...(Object.keys(stageConfig) as ProjectStage[]).map((stage) => ({
            value: stage,
            label: stageConfig[stage].label,
            count: projects.filter((p) => p.stage === stage).length,
          })),
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="暂无项目"
          description="从AI线索挖掘申请跟进，或手动登记新项目"
        />
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
                    const deadline =
                      project.stage === "exclusive" && project.exclusiveEnd
                        ? `排他剩余 ${daysUntil(project.exclusiveEnd)} 天`
                        : project.stage === "applied"
                          ? `对接人截止 ${daysUntil(project.contactDeadline)} 天`
                          : project.stage === "contact_filled"
                            ? `接洽截止 ${daysUntil(project.meetingDeadline)} 天`
                            : "—";
                    return (
                      <TableRow
                        key={project.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedProject(project)}
                      >
                        <TableCell className="font-medium">
                          {project.companyName}
                        </TableCell>
                        <TableCell>{project.industry}</TableCell>
                        <TableCell className="text-sm">
                          {formatListTime(getProjectLatestTime(project))}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              cfg.color,
                            )}
                          >
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {project.source === "lead"
                              ? "线索申请"
                              : "主动登记"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{deadline}</TableCell>
                        <TableCell>
                          {project.isOverdue && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              逾期
                            </Badge>
                          )}
                          {project.isExclusive && !project.isOverdue && (
                            <Badge className="gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              排他中
                            </Badge>
                          )}
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
              const denominator =
                project.stage === "applied"
                  ? 30
                  : project.stage === "contact_filled"
                    ? 60
                    : project.stage === "exclusive"
                      ? 180
                      : 100;
              const deadline =
                project.stage === "exclusive" && project.exclusiveEnd
                  ? `排他剩余 ${daysUntil(project.exclusiveEnd)} 天`
                  : project.stage === "applied"
                    ? `对接人截止 ${daysUntil(project.contactDeadline)} 天`
                    : project.stage === "contact_filled"
                      ? `接洽截止 ${daysUntil(project.meetingDeadline)} 天`
                      : "—";
              return (
                <Card
                  key={project.id}
                  className="cursor-pointer rounded-2xl border-border/70 shadow-none"
                  onClick={() => setSelectedProject(project)}
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">
                          {project.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {project.industry} · 最新{" "}
                          {formatListTime(getProjectLatestTime(project))}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0",
                          cfg.color,
                        )}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">
                        {project.source === "lead" ? "线索申请" : "主动登记"}
                      </Badge>
                      <span>{deadline}</span>
                    </div>
                    {(project.stage === "applied" ||
                      project.stage === "contact_filled" ||
                      project.stage === "exclusive") && (
                      <Progress
                        value={
                          project.stage === "exclusive" && project.exclusiveEnd
                            ? Math.max(
                                0,
                                Math.min(
                                  100,
                                  (daysUntil(project.exclusiveEnd) /
                                    denominator) *
                                    100,
                                ),
                              )
                            : project.stage === "applied"
                              ? 34
                              : 66
                        }
                        className="h-1.5"
                      />
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      {project.isOverdue && (
                        <Badge
                          variant="destructive"
                          className="gap-1 text-[10px]"
                        >
                          <AlertTriangle className="size-3" />
                          逾期
                        </Badge>
                      )}
                      {project.isExclusive && !project.isOverdue && (
                        <Badge className="gap-1 text-[10px]">
                          <ShieldCheck className="size-3" />
                          排他中
                        </Badge>
                      )}
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        点开处理
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Sheet
        open={!!selectedProject}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProject(null);
            setContactName("");
            setContactRole("");
            setContactPhone("");
          }
        }}
      >
        {selectedProject && (
          <SheetContent className="overflow-y-auto sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>{selectedProject.companyName}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="flex gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    stageConfig[selectedProject.stage].color,
                  )}
                >
                  {stageConfig[selectedProject.stage].label}
                </span>
                {selectedProject.isOverdue && (
                  <Badge variant="destructive">逾期</Badge>
                )}
              </div>

              {selectedProject.contactPerson && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">对接人信息</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <span>姓名：{selectedProject.contactPerson.name}</span>
                    <span>角色：{selectedProject.contactPerson.role}</span>
                    <span>电话：{selectedProject.contactPerson.phone}</span>
                    <span>
                      信任度：{selectedProject.contactPerson.trustLevel}/10
                    </span>
                  </div>
                </div>
              )}

              {selectedProject.stage === "applied" &&
                !selectedProject.contactPerson && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-[13px] font-medium flex items-center gap-1.5">
                        <UserPlus className="size-3.5" /> 填写对接人信息
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        提交后自动推进至「对接人已填」阶段，请在1个月内完成
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-[12px]">姓名 *</Label>
                          <Input
                            placeholder="姓名"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className="h-8 text-[13px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[12px]">角色 *</Label>
                          <Select
                            value={contactRole}
                            onValueChange={(v) => {
                              if (v) setContactRole(v);
                            }}
                          >
                            <SelectTrigger className="h-8 text-[13px]">
                              <SelectValue placeholder="选择角色" />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                "设备科长",
                                "能源管理部",
                                "技术总监",
                                "采购经理",
                                "项目经理",
                                "副总",
                              ].map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[12px]">电话</Label>
                          <Input
                            placeholder="选填"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="h-8 text-[13px]"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

              {selectedProject.stage === "contact_filled" && (
                <>
                  <Separator />
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <p className="text-[13px] font-medium flex items-center gap-1.5">
                      <Video className="size-3.5" /> 申请线上接洽
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      确认线上接洽完成后，将直接进入180天排他保护期
                    </p>
                  </div>
                </>
              )}

              <Separator />
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <span className="text-muted-foreground">申请时间</span>
                  <p className="font-medium">
                    {formatListTime(selectedProject.appliedAt)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">最新跟进</span>
                  <p className="font-medium">
                    {formatListTime(getProjectLatestTime(selectedProject))}
                  </p>
                </div>
              </div>

              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium">跟进日志</p>
                <div className="space-y-2">
                  {selectedProject.followupLogs.map((log, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="text-muted-foreground shrink-0 w-20">
                        {log.date}
                      </span>
                      <div>
                        <span className="font-medium">{log.action}</span>
                        <span className="text-muted-foreground ml-2">
                          {log.result}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedProject.stage === "online_meeting" && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-[12px] text-emerald-700 dark:text-emerald-300">
                  线上接洽已安排，请由平台确认会议结果后进入排他保护。
                </div>
              )}
            </div>

            {selectedProject.stage === "applied" &&
              !selectedProject.contactPerson && (
                <SheetFooter className="flex-row gap-2">
                  <Button
                    disabled={!contactName.trim() || !contactRole}
                    onClick={() => {
                      const contact = {
                        name: contactName.trim(),
                        role: contactRole,
                        phone: contactPhone || "",
                        trustLevel: 5,
                        decisionLevel: 5,
                      };
                      fillContactAndAdvance(selectedProject.id, contact);
                      const binding = bindings.find(
                        (b) =>
                          b.customerName === selectedProject.companyName &&
                          b.stage === "temporary" &&
                          b.status === "active",
                      );
                      if (binding)
                        fillContactInfo(binding.id, contact.name, contact.role);
                      toast.success(
                        `对接人信息已提交，项目已推进至「对接人已填」`,
                      );
                      setSelectedProject({
                        ...selectedProject,
                        stage: "contact_filled",
                        contactPerson: contact,
                      });
                      setContactName("");
                      setContactRole("");
                      setContactPhone("");
                    }}
                  >
                    <UserPlus className="size-3.5 mr-1.5" /> 提交对接人信息
                  </Button>
                </SheetFooter>
              )}

            {selectedProject.stage === "contact_filled" && (
              <SheetFooter className="flex-row gap-2">
                <Button
                  onClick={() => {
                    requestOnlineMeeting(selectedProject.id);
                    const binding = bindings.find(
                      (b) =>
                        b.customerName === selectedProject.companyName &&
                        b.stage === "locked" &&
                        b.status === "active",
                    );
                    if (binding) applyOnlineMeeting(binding.id);
                    const now = new Date().toISOString().split("T")[0];
                    const exclusiveEnd = new Date(Date.now() + 180 * 86400000)
                      .toISOString()
                      .split("T")[0];
                    toast.success("线上接洽已完成，项目已进入「排他期」");
                    setSelectedProject({
                      ...selectedProject,
                      stage: "exclusive",
                      exclusiveStart: now,
                      exclusiveEnd,
                      isExclusive: true,
                    });
                  }}
                >
                  <Video className="size-3.5 mr-1.5" /> 确认线上接洽完成
                </Button>
              </SheetFooter>
            )}
          </SheetContent>
        )}
      </Sheet>

      <AddProjectDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={(project) => {
          const nextProject = {
            ...project,
            ownerPartnerId: user?.id,
            ownerPartnerName: user?.name,
          };
          addProject(nextProject);
          if (!user) return;
          const conflict = checkConflict(project.companyName);
          if (conflict) {
            toast.warning(
              `项目已登记，但客户绑定由${conflict.partnerName}保护中，请先处理归属冲突`,
            );
            return;
          }
          const binding: CustomerBinding = {
            id: `bind-crm-${Date.now()}`,
            customerId: `cust-crm-${Date.now()}`,
            customerName: project.companyName,
            industry: project.industry,
            partnerId: user.id,
            partnerName: user.name,
            bindingType: "manual",
            stage: project.contactPerson ? "locked" : "temporary",
            status: "active",
            boundAt: project.appliedAt,
            expiredAt: project.contactPerson
              ? project.meetingDeadline
              : project.contactDeadline,
            contactPerson: project.contactPerson?.name,
            contactRole: project.contactPerson?.role,
            linkedProjects: 1,
            history: [
              {
                date: project.appliedAt,
                from: "released",
                to: "temporary",
                action: "从项目跟进主动登记客户",
                operator: user.name,
              },
              ...(project.contactPerson
                ? [
                    {
                      date: project.appliedAt,
                      from: "temporary" as const,
                      to: "locked" as const,
                      action: `同步补全对接人：${project.contactPerson.name}（${project.contactPerson.role || "未填写角色"}）`,
                      operator: user.name,
                    },
                  ]
                : []),
            ],
          };
          addBinding(binding);
        }}
      />
    </div>
  );
}
