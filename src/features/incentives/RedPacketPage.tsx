import { useState } from "react";
import { useStore } from "@/stores";
import { useBrandHero } from "@/hooks/use-brand-hero";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { SubsectionTabs } from "@/components/shared/SubsectionTabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Gift,
  Wallet,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { UploadEvidenceDialog } from "./components/UploadEvidenceDialog";
import { formatListTime, latestOf, sortByNewest } from "@/lib/time";
import type { IncentiveTask, RedPacketTask } from "@/types";

const statusConfig: Record<
  RedPacketTask["status"],
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon?: typeof Clock;
  }
> = {
  available: { label: "可领取", variant: "default" },
  claimed: { label: "已领取", variant: "secondary" },
  executing: { label: "执行中", variant: "outline", icon: Clock },
  evidence_submitted: { label: "待审核", variant: "outline", icon: Clock },
  reviewing: { label: "审核中", variant: "outline" },
  paid: { label: "已发放", variant: "default", icon: CheckCircle2 },
  rejected: { label: "已驳回", variant: "destructive", icon: XCircle },
  expired: { label: "已过期", variant: "destructive" },
};

export default function RedPacketPage() {
  const heroClass = useBrandHero();
  const tasks = useStore((s) => s.redPacketTasks);
  const projects = useStore((s) => s.projects);
  const claimTask = useStore((s) => s.claimRedPacket);
  const submitEvidence = useStore((s) => s.submitEvidence);
  const addIncentiveTask = useStore((s) => s.addIncentiveTask);
  const user = useStore((s) => s.user);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<RedPacketTask | null>(null);
  const [uploadTask, setUploadTask] = useState<RedPacketTask | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskProject, setTaskProject] = useState("");
  const [taskAmount, setTaskAmount] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskRequirements, setTaskRequirements] = useState("");

  const getTaskTime = (task: RedPacketTask) =>
    latestOf(
      task.evidence?.submittedAt,
      task.paidAt,
      task.claimedAt,
      task.createdAt,
      task.deadline,
    );
  const sortedTasks = sortByNewest(tasks, getTaskTime);
  const filtered =
    filter === "all"
      ? sortedTasks
      : sortedTasks.filter((t) => t.status === filter);
  const totalEarned = tasks
    .filter((t) => t.status === "paid")
    .reduce((s, t) => s + t.amount, 0);
  const available = tasks.filter((t) => t.status === "available").length;
  const executing = tasks.filter(
    (t) => t.status === "executing" || t.status === "evidence_submitted",
  ).length;

  const handleClaim = (task: RedPacketTask) => {
    if (task.projectName !== "通用任务") {
      const hasProject = projects.some(
        (p) =>
          p.companyName.includes(task.projectName) ||
          task.projectName.includes(p.companyName),
      );
      if (!hasProject) {
        toast.error(`您不是「${task.projectName}」的跟进人，无法领取该任务`);
        return;
      }
    }
    claimTask(task.id, user?.id, user?.name);
    toast.success(`已领取任务「${task.name}」，请尽快完成并上传凭证`);
  };

  const handleSubmitEvidence = (evidence: {
    images: string[];
    description: string;
  }) => {
    if (!uploadTask) return;
    submitEvidence(uploadTask.id, evidence);
    setUploadTask(null);
  };

  const handleCreateTask = () => {
    if (!taskName.trim()) {
      toast.error("请填写任务名称");
      return;
    }
    if (!taskProject.trim()) {
      toast.error("请填写关联项目");
      return;
    }
    const amount = Number(taskAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("请填写有效奖励金额");
      return;
    }
    if (!taskDeadline) {
      toast.error("请选择截止日期");
      return;
    }

    const task: IncentiveTask = {
      id: `inc-${Date.now()}`,
      name: taskName.trim(),
      projectName: taskProject.trim(),
      amount,
      applicantCount: 0,
      createdAt: new Date().toISOString(),
      status: "draft",
      createdBy: user?.id ?? "partner",
      deadline: taskDeadline,
      requirements:
        taskRequirements.trim() ||
        "完成项目推进动作，并上传现场照片、沟通纪要或其他可审核凭证。",
    };
    addIncentiveTask(task);
    toast.success("红包任务已提交后台审核，通过后会进入可领取任务池");
    setCreateOpen(false);
    setTaskName("");
    setTaskProject("");
    setTaskAmount("");
    setTaskDeadline("");
    setTaskRequirements("");
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader
        title="红包任务"
        description="完成任务获取奖励，也可以为关键项目发起奖励任务"
        action={
          <Button
            size="lg"
            className="gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" /> 发起任务
          </Button>
        }
      />

      <section className={`${heroClass} p-4 md:p-5`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] text-white/55">任务奖励</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              领取、执行、上传凭证一屏处理
            </h2>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-bold leading-none">
              ¥{totalEarned.toLocaleString()}
            </p>
            <p className="mt-1 text-[10px] text-white/50">已发放</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/[0.07] p-3">
            <p className="text-[10px] text-white/50">可领取</p>
            <p className="mt-1 text-xl font-bold">{available}</p>
          </div>
          <div className="rounded-xl bg-white/[0.07] p-3">
            <p className="text-[10px] text-white/50">执行中</p>
            <p className="mt-1 text-xl font-bold">{executing}</p>
          </div>
          <div className="rounded-xl bg-white/[0.07] p-3">
            <p className="text-[10px] text-white/50">待审核</p>
            <p className="mt-1 text-xl font-bold">
              {
                tasks.filter(
                  (t) =>
                    t.status === "evidence_submitted" ||
                    t.status === "reviewing",
                ).length
              }
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          title="已获得总额"
          value={`¥${totalEarned.toLocaleString()}`}
          icon={Wallet}
        />
        <StatCard
          title="可领取任务"
          value={available}
          icon={Gift}
          changeType="up"
        />
        <StatCard title="执行中" value={executing} icon={Clock} />
      </div>

      <SubsectionTabs
        active={filter}
        onChange={setFilter}
        tabs={[
          { value: "all", label: "全部", count: tasks.length },
          { value: "available", label: "可领取", count: tasks.filter((t) => t.status === "available").length },
          { value: "executing", label: "执行中", count: tasks.filter((t) => t.status === "executing").length },
          { value: "evidence_submitted", label: "待审核", count: tasks.filter((t) => t.status === "evidence_submitted").length },
          { value: "rejected", label: "已驳回", count: tasks.filter((t) => t.status === "rejected").length },
          { value: "paid", label: "已发放", count: tasks.filter((t) => t.status === "paid").length },
        ]}
      />

      <>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-14 text-center">
            <Gift className="mb-3 size-9 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              暂无{ filter !== 'all' && ({ available: '可领取', executing: '执行中', evidence_submitted: '待审核', rejected: '已驳回', paid: '已发放' } as Record<string,string>)[filter] }任务
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              {filter === 'available' ? '平台发布任务后会在这里显示' : '切换其他分类查看'}
            </p>
          </div>
        ) : (
          <>
            <Card className="hidden md:block">
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务名称</TableHead>
                  <TableHead>关联项目</TableHead>
                  <TableHead>奖励金额</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead>截止日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((task) => {
                  const cfg = statusConfig[task.status];
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {task.projectName}
                      </TableCell>
                      <TableCell className="font-mono font-medium text-amber-600">
                        ¥{task.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatListTime(getTaskTime(task))}
                      </TableCell>
                      <TableCell className="text-sm">{task.deadline}</TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant} className="gap-1">
                          {Icon && <Icon className="size-3" />}
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {task.status === "available" && (
                            <Button size="sm" onClick={() => handleClaim(task)}>
                              领取任务
                            </Button>
                          )}
                          {task.status === "executing" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => setUploadTask(task)}
                            >
                              <Upload className="size-3.5" /> 上传凭证
                            </Button>
                          )}
                          {task.status === "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => setUploadTask(task)}
                            >
                              <Upload className="size-3.5" /> 重新上传
                            </Button>
                          )}
                          {(task.status === "evidence_submitted" ||
                            task.status === "paid" ||
                            task.status === "rejected") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDetail(task)}
                            >
                              查看详情
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="space-y-3 md:hidden">
          {filtered.map((task) => {
            const cfg = statusConfig[task.status];
            const Icon = cfg.icon;
            return (
              <Card
                key={task.id}
                className="rounded-2xl border-border/70 shadow-none"
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{task.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.projectName}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-amber-600 shrink-0">
                      ¥{task.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cfg.variant} className="gap-1 text-[10px]">
                      {Icon && <Icon className="size-3" />}
                      {cfg.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      更新 {formatListTime(getTaskTime(task))}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      截止 {task.deadline}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{
                        width:
                          task.status === "available"
                            ? "18%"
                            : task.status === "executing"
                              ? "52%"
                              : task.status === "paid"
                                ? "100%"
                                : task.status === "rejected"
                                  ? "70%"
                                  : "78%",
                      }}
                    />
                  </div>
                  <div className="pt-1">
                    {task.status === "available" && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleClaim(task)}
                      >
                        领取任务
                      </Button>
                    )}
                    {task.status === "executing" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-1"
                        onClick={() => setUploadTask(task)}
                      >
                        <Upload className="size-3.5" /> 上传凭证
                      </Button>
                    )}
                    {(task.status === "evidence_submitted" ||
                      task.status === "paid" ||
                      task.status === "rejected") && (
                      <div className="grid grid-cols-1 gap-2">
                        {task.status === "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-1"
                            onClick={() => setUploadTask(task)}
                          >
                            <Upload className="size-3.5" /> 重新上传
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full"
                          onClick={() => setDetail(task)}
                        >
                          查看详情
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
          </>
        )}
      </>

      <Dialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        {detail && (
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{detail.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <span className="text-muted-foreground">关联项目：</span>
                  {detail.projectName}
                </div>
                <div>
                  <span className="text-muted-foreground">奖励金额：</span>
                  <span className="font-mono font-medium text-amber-600">
                    ¥{detail.amount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">截止日期：</span>
                  {detail.deadline}
                </div>
                <div>
                  <span className="text-muted-foreground">更新时间：</span>
                  {formatListTime(getTaskTime(detail))}
                </div>
                <div>
                  <span className="text-muted-foreground">状态：</span>
                  <Badge variant={statusConfig[detail.status].variant}>
                    {statusConfig[detail.status].label}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-[13px] font-medium">任务要求</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  {detail.requirements}
                </p>
              </div>

              {detail.evidence && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-[13px] font-medium">提交凭证</p>
                    <div className="grid grid-cols-3 gap-2">
                      {detail.evidence.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt=""
                          className="w-full aspect-square object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-[12px] leading-relaxed">
                      {detail.evidence.description}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      提交时间：{detail.evidence.submittedAt}
                    </p>
                  </div>
                </>
              )}

              {detail.reviewNote && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-[13px] font-medium">审核意见</p>
                    <div
                      className={`rounded-lg p-3 text-[12px] ${detail.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"}`}
                    >
                      {detail.reviewNote}
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              {detail.status === "rejected" && (
                <Button
                  onClick={() => {
                    setUploadTask(detail);
                    setDetail(null);
                  }}
                >
                  <Upload className="size-3.5 mr-1.5" /> 重新上传凭证
                </Button>
              )}
              <Button variant="outline" onClick={() => setDetail(null)}>
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <UploadEvidenceDialog
        open={!!uploadTask}
        onOpenChange={(open) => {
          if (!open) setUploadTask(null);
        }}
        taskName={uploadTask?.name ?? ""}
        onSubmit={handleSubmitEvidence}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>发起红包任务</DialogTitle>
            <p className="text-[13px] text-muted-foreground">
              提交后进入后台激励管理审核，通过后自动发布到红包任务列表。
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[12px]">任务名称</Label>
              <Input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="如：A类项目现场拜访激励"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[12px]">关联项目</Label>
                <Input
                  value={taskProject}
                  onChange={(e) => setTaskProject(e.target.value)}
                  placeholder="输入项目或批量任务名称"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">奖励金额</Label>
                <Input
                  value={taskAmount}
                  onChange={(e) => setTaskAmount(e.target.value)}
                  inputMode="numeric"
                  placeholder="例如 2000"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">截止日期</Label>
              <Input
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                type="date"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">任务要求</Label>
              <Textarea
                value={taskRequirements}
                onChange={(e) => setTaskRequirements(e.target.value)}
                placeholder="说明完成标准，例如现场拜访、上传照片、提交沟通纪要等"
                className="min-h-24 resize-none text-[13px]"
              />
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[12px] text-amber-700 dark:text-amber-300">
              平台审核会检查任务描述、金额合理性、项目归属和凭证要求。审核通过后，任务状态会从“待审核”变为“可领取”。
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateTask}>提交审核</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
