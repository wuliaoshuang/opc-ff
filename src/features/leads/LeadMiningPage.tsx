import { useState, useCallback } from "react";
import { useStore } from "@/stores";
import { useBrandHero } from "@/hooks/use-brand-hero";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  FileText,
  Handshake,
  Bell,
  X,
  Save,
  Lightbulb,
  Target,
  MessageSquare,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CustomerBinding, PotentialLead, LeadStatus } from "@/types";

const industries = [
  "全部",
  "制造业",
  "化工",
  "钢铁",
  "建材",
  "食品加工",
  "纺织",
  "电力",
  "农业",
  "新能源",
  "有色金属",
];
const regions = [
  "全部",
  "北京",
  "上海",
  "广州",
  "深圳",
  "成都",
  "杭州",
  "武汉",
  "南京",
  "长沙",
  "青岛",
  "大连",
  "珠海",
];
const resourceTags = [
  "人大",
  "政协",
  "协会",
  "商学院",
  "央企关系",
  "地方国企",
  "上市公司关系",
  "金融机构",
];
const statusLabels: Record<LeadStatus, string> = {
  available: "可申请",
  applied: "已申请",
  followed: "跟进中",
  exclusive: "排他期",
};

function mockMarketPlan(lead: PotentialLead) {
  return {
    opportunity: `${lead.companyName}作为${lead.industry}行业${lead.isListed ? "上市公司" : "重点企业"}，年营收${lead.revenue}，用能级别"${lead.energyUsage}"。${lead.newProjectSize ? `近期有${lead.newProjectSize}新建项目（${lead.newProjectProgress}），` : ""}存在显著的综合能源服务需求，预估年用电成本占比15-20%，适合推行光伏+储能方案。`,
    resourceAdvice: `建议利用您的行业资源，通过${lead.region}本地商会/协会引荐。如您具备相关人脉圈层，可优先联系该企业能源管理部门或基建部决策人。`,
    actionPlan: [
      `第一步：通过行业协会活动获取${lead.companyName}设备部/能源部联系方式`,
      "第二步：准备同行业成功案例（节能30%+投资回收期3年），发起初次商务沟通",
      "第三步：通过平台申请 B 类现场拜访红包任务，安排现场能效诊断",
      "第四步：提交初步技术方案，安排平台技术总监参与线上评审会",
    ],
    script: `"X总您好，我们注意到贵公司在${lead.region}的${lead.industry}业务规模持续增长，目前很多同行企业已经通过光伏+储能方案每年节约电费成本15%-25%。我们有一套零投资的方案，不影响生产的前提下帮您做一次免费的能效诊断，您看是否方便安排一次线上沟通？"`,
  };
}

export default function LeadMiningPage() {
  const heroClass = useBrandHero();
  const leads = useStore((s) => s.leads);
  const searchResults = useStore((s) => s.searchResults);
  const setSearchResults = useStore((s) => s.setSearchResults);
  const applyLead = useStore((s) => s.applyLead);
  const updateLeadNotes = useStore((s) => s.updateLeadNotes);
  const addProject = useStore((s) => s.addProject);
  const checkConflict = useStore((s) => s.checkConflict);
  const addBinding = useStore((s) => s.addBinding);
  const adminLeads = useStore((s) => s.adminLeads);
  const setAdminLeads = useStore((s) => s.setAdminLeads);
  const user = useStore((s) => s.user);

  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("");
  const [keyword, setKeyword] = useState("");
  const [prompt, setPrompt] = useState(
    "优先寻找高耗能、扩建、招标或园区综合能源机会",
  );
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [detailLead, setDetailLead] = useState<PotentialLead | null>(null);
  const [planLead, setPlanLead] = useState<PotentialLead | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [editProjectInfo, setEditProjectInfo] = useState("");
  const [editBusinessInfo, setEditBusinessInfo] = useState("");
  const [detailTab, setDetailTab] = useState<"project" | "business">("project");

  const newCount = leads.filter((l) => l.status === "available").length;

  const toggleResource = (tag: string) => {
    setSelectedResources((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSearch = useCallback(() => {
    setLoading(true);
    setSearched(true);
    setTimeout(() => {
      let results = [...leads];
      if (industry && industry !== "全部")
        results = results.filter((l) => l.industry === industry);
      if (region && region !== "全部")
        results = results.filter((l) => l.region === region);
      if (keyword) {
        results = results.filter((l) =>
          [
            l.companyName,
            l.industry,
            l.projectInfo,
            l.businessInfo,
            l.newProjectProgress ?? "",
          ].some((field) => field.includes(keyword)),
        );
      }
      results.sort((a, b) => {
        const resourceBoost = selectedResources.length > 0 ? 4 : 0;
        const promptBoostA =
          prompt.includes(a.industry) || prompt.includes(a.region) ? 3 : 0;
        const promptBoostB =
          prompt.includes(b.industry) || prompt.includes(b.region) ? 3 : 0;
        return (
          b.aiMatchScore +
          resourceBoost +
          promptBoostB -
          (a.aiMatchScore + resourceBoost + promptBoostA)
        );
      });
      setSearchResults(results.slice(0, 12));
      setLoading(false);
    }, 1500);
  }, [
    leads,
    industry,
    region,
    keyword,
    prompt,
    selectedResources.length,
    setSearchResults,
  ]);

  const handleApply = useCallback(
    (id: string) => {
      const lead = leads.find((l) => l.id === id);
      if (!lead || !user) return;
      if (lead.status !== "available") {
        toast.error("该线索已被申请或处于保护期，不能重复申请");
        return;
      }
      const conflict = checkConflict(lead.companyName);
      if (conflict) {
        toast.error(
          `该客户已由${conflict.partnerName}绑定，当前阶段：${conflict.stage}`,
        );
        return;
      }

      applyLead(id, user.name);
      setAdminLeads(
        adminLeads.map((l) =>
          l.id === id
            ? {
                ...l,
                status: "applied" as const,
                appliedBy: user.name,
                assignedPartner: user.name,
                updatedAt: new Date().toISOString().split("T")[0],
              }
            : l,
        ),
      );
      toast.success("申请已提交，线索、CRM与客户绑定已同步");
      if (lead) {
        const now = new Date().toISOString().split("T")[0];
        const oneMonth = new Date(Date.now() + 30 * 86400000)
          .toISOString()
          .split("T")[0];
        const twoMonth = new Date(Date.now() + 60 * 86400000)
          .toISOString()
          .split("T")[0];
        addProject({
          id: `crm-${Date.now()}`,
          leadId: lead.id,
          companyName: lead.companyName,
          industry: lead.industry,
          ownerPartnerId: user.id,
          ownerPartnerName: user.name,
          stage: "applied",
          appliedAt: now,
          contactDeadline: oneMonth,
          meetingDeadline: twoMonth,
          isExclusive: false,
          isOverdue: false,
          source: "lead",
          followupLogs: [
            {
              date: now,
              action: "从AI线索池申请跟进",
              result: `线索匹配度 ${lead.aiMatchScore}%`,
            },
          ],
        });
        const binding: CustomerBinding = {
          id: `bind-${Date.now()}`,
          customerId: `cust-${Date.now()}`,
          customerName: lead.companyName,
          industry: lead.industry,
          partnerId: user.id,
          partnerName: user.name,
          bindingType: "lead_apply",
          stage: "temporary",
          status: "active",
          boundAt: now,
          expiredAt: oneMonth,
          linkedProjects: 1,
          history: [
            {
              date: now,
              from: "released",
              to: "temporary",
              action: "从AI线索池申请绑定",
              operator: user.name,
            },
          ],
        };
        addBinding(binding);
      }
    },
    [
      addBinding,
      addProject,
      adminLeads,
      applyLead,
      checkConflict,
      leads,
      setAdminLeads,
      user,
    ],
  );

  const openDetail = (lead: PotentialLead) => {
    setDetailLead(lead);
    setEditProjectInfo(lead.projectInfo);
    setEditBusinessInfo(lead.businessInfo);
    setDetailTab("project");
  };

  const companyScore = (lead: PotentialLead) =>
    Math.round((lead.isListed ? 40 : 20) + (lead.aiMatchScore > 85 ? 20 : 10));
  const energyScore = (lead: PotentialLead) =>
    Math.round(
      lead.aiMatchScore * 0.3 +
        (lead.energyUsage === "极高"
          ? 25
          : lead.energyUsage === "高"
            ? 18
            : 10),
    );
  const matchScore = (lead: PotentialLead) =>
    Math.round(lead.aiMatchScore * 0.35);

  return (
    <div>
      <PageHeader
        title="AI 线索挖掘"
        description="设定关键词与资源标签，AI 自动匹配潜在项目并输出开发策略"
      />

      <section className={`${heroClass} p-4 md:p-5`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] text-white/55">线索雷达</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              先筛资源，再申请保护
            </h2>
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-white/60">
              从行业、区域、关键词和资源圈层四个维度缩小范围，优先处理高匹配客户。
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.08] px-3 py-2 text-right">
            <p className="text-2xl font-bold leading-none">{newCount}</p>
            <p className="mt-1 text-[10px] text-white/50">可申请</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/[0.07] p-3">
            <p className="text-[10px] text-white/50">已选资源</p>
            <p className="mt-1 text-base font-semibold">
              {selectedResources.length}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.07] p-3">
            <p className="text-[10px] text-white/50">搜索结果</p>
            <p className="mt-1 text-base font-semibold">
              {searchResults.length}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.07] p-3">
            <p className="text-[10px] text-white/50">推荐排序</p>
            <p className="mt-1 text-base font-semibold">AI</p>
          </div>
        </div>
      </section>

      {showBanner && newCount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-50 px-4 py-3 dark:bg-blue-950/20">
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
            <Bell className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-blue-900 dark:text-blue-200">
              本周 AI 新增 <span className="font-bold">{newCount}</span>{" "}
              条潜在线索
            </p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400">
              系统已根据您的行业标签自动更新推荐
            </p>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="shrink-0 text-blue-400 hover:text-blue-600"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <Card className="mb-5 overflow-hidden rounded-2xl border-border/70 shadow-none md:mb-6">
        <CardContent className="p-0">
          <div className="border-b bg-card p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <SlidersHorizontal className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">挖掘条件</p>
                  <p className="text-[11px] text-muted-foreground">
                    先输入客户画像，再交给 AI 排序
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {selectedResources.length} 个资源
              </Badge>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-12 rounded-xl border-border/80 bg-muted/40 pl-9 text-[15px]"
                placeholder="搜索：新建厂房、电力增容、节能改造..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4 p-4 md:p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  行业
                </Label>
                <Select onValueChange={(v) => v && setIndustry(String(v))}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="选择行业" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  区域
                </Label>
                <Select onValueChange={(v) => v && setRegion(String(v))}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="选择区域" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">
                个性化提示词
              </Label>
              <Textarea
                className="min-h-24 resize-none rounded-xl bg-muted/35 p-3 text-[13px] leading-relaxed"
                placeholder="例如：优先关注化工园区、电力增容、招标中项目"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                提示词会影响线索排序与策略建议。
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  资源标签
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  匹配您的圈层资源
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {resourceTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleResource(tag)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors active:scale-[0.98]",
                      selectedResources.includes(tag)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={loading}
              className="h-11 w-full rounded-xl"
            >
              <Search className="mr-2 size-4" />
              {loading ? "挖掘中..." : "开始 AI 挖掘"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <LoadingSkeleton rows={8} />}
      {!loading && searched && searchResults.length === 0 && (
        <EmptyState
          icon={Search}
          title="未找到匹配线索"
          description="请尝试调整搜索条件"
        />
      )}
      {!loading && searchResults.length > 0 && (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>公司名称</TableHead>
                    <TableHead>行业</TableHead>
                    <TableHead>区域</TableHead>
                    <TableHead>上市</TableHead>
                    <TableHead className="w-[160px]">AI 评分</TableHead>
                    <TableHead>详情</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((lead) => {
                    const cs = companyScore(lead);
                    const es = energyScore(lead);
                    const ms = matchScore(lead);
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">
                          {lead.companyName}
                        </TableCell>
                        <TableCell>{lead.industry}</TableCell>
                        <TableCell>{lead.region}</TableCell>
                        <TableCell>
                          {lead.isListed ? (
                            <Badge>上市</Badge>
                          ) : (
                            <Badge variant="outline">非上市</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground w-10">
                                企业
                              </span>
                              <Progress value={cs} className="h-1.5 flex-1" />
                              <span className="text-[10px] font-mono w-6">
                                {cs}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground w-10">
                                能源
                              </span>
                              <Progress value={es} className="h-1.5 flex-1" />
                              <span className="text-[10px] font-mono w-6">
                                {es}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground w-10">
                                匹配
                              </span>
                              <Progress value={ms} className="h-1.5 flex-1" />
                              <span className="text-[10px] font-mono w-6">
                                {ms}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[11px] gap-1"
                              onClick={() => openDetail(lead)}
                            >
                              <FileText className="size-3" /> 详情
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[11px] gap-1 text-primary"
                              onClick={() => setPlanLead(lead)}
                            >
                              <Lightbulb className="size-3" /> 策略
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.status === "available" ? (
                            <Button
                              size="sm"
                              onClick={() => handleApply(lead.id)}
                            >
                              申请跟进
                            </Button>
                          ) : (
                            <Button size="sm" disabled variant="outline">
                              {statusLabels[lead.status]}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile Card List */}
          <div className="space-y-3 md:hidden">
            {searchResults.map((lead) => {
              const cs = companyScore(lead);
              const es = energyScore(lead);
              const ms = matchScore(lead);
              return (
                <Card
                  key={lead.id}
                  className="rounded-2xl border-border/70 shadow-none"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {lead.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {lead.industry} · {lead.region}
                        </p>
                      </div>
                      {lead.isListed && (
                        <Badge className="shrink-0 text-[10px]">上市</Badge>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { label: "企业", value: cs, color: "bg-blue-500" },
                        { label: "能源", value: es, color: "bg-emerald-500" },
                        { label: "匹配", value: ms, color: "bg-sky-500" },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-8">
                            {s.label}
                          </span>
                          <Progress value={s.value} className="h-1.5 flex-1" />
                          <span className="text-[10px] font-mono w-5 text-right">
                            {s.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-[12px] gap-1"
                        onClick={() => openDetail(lead)}
                      >
                        <FileText className="size-3" /> 详情
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-[12px] gap-1 text-primary"
                        onClick={() => setPlanLead(lead)}
                      >
                        <Lightbulb className="size-3" /> 策略
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-[12px]"
                        disabled={lead.status !== "available"}
                        onClick={() => handleApply(lead.id)}
                      >
                        {lead.status === "available"
                          ? "申请"
                          : statusLabels[lead.status]}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Dialog
        open={!!detailLead}
        onOpenChange={(open) => {
          if (!open) setDetailLead(null);
        }}
      >
        {detailLead && (
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{detailLead.companyName}</DialogTitle>
            </DialogHeader>
            <div className="flex gap-3 text-[12px] text-muted-foreground">
              <span>{detailLead.industry}</span>
              <span>{detailLead.region}</span>
              <span>收入 {detailLead.revenue}</span>
              <span>用能 {detailLead.energyUsage}</span>
              {detailLead.isListed && (
                <Badge variant="outline" className="text-[10px] h-5">
                  上市
                </Badge>
              )}
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/70 p-1">
                {[
                  { value: "project" as const, label: "项目情况" },
                  { value: "business" as const, label: "商务情况" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setDetailTab(item.value)}
                    className={cn(
                      "rounded-lg px-2 py-2 text-[12px] font-medium leading-tight transition-colors",
                      detailTab === item.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <textarea
                className="min-h-[140px] w-full resize-none rounded-xl border bg-background/50 p-3 text-[13px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring"
                value={
                  detailTab === "project" ? editProjectInfo : editBusinessInfo
                }
                onChange={(e) => {
                  if (detailTab === "project")
                    setEditProjectInfo(e.target.value);
                  else setEditBusinessInfo(e.target.value);
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailLead(null)}>
                关闭
              </Button>
              <Button
                onClick={() => {
                  updateLeadNotes(detailLead.id, {
                    projectInfo: editProjectInfo,
                    businessInfo: editBusinessInfo,
                  });
                  toast.success("线索说明已保存");
                  setDetailLead(null);
                }}
                className="gap-1.5"
              >
                <Save className="size-3.5" /> 保存备注
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Sheet
        open={!!planLead}
        onOpenChange={(open) => {
          if (!open) setPlanLead(null);
        }}
      >
        {planLead &&
          (() => {
            const plan = mockMarketPlan(planLead);
            return (
              <SheetContent className="overflow-y-auto sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>个性化市场开发规划</SheetTitle>
                  <p className="text-[13px] text-muted-foreground">
                    {planLead.companyName} · {planLead.industry} ·{" "}
                    {planLead.region}
                  </p>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Target className="size-4 text-blue-600" />
                      </div>
                      <p className="text-sm font-semibold">机会点分析</p>
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed pl-9">
                      {plan.opportunity}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Handshake className="size-4 text-emerald-600" />
                      </div>
                      <p className="text-sm font-semibold">资源利用建议</p>
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed pl-9">
                      {plan.resourceAdvice}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Lightbulb className="size-4 text-amber-600" />
                      </div>
                      <p className="text-sm font-semibold">行动推进动作</p>
                    </div>
                    <div className="pl-9 space-y-2">
                      {plan.actionPlan.map((step, i) => (
                        <div key={i} className="flex gap-3 text-[13px]">
                          <Badge
                            variant="outline"
                            className="shrink-0 size-5 p-0 flex items-center justify-center text-[10px]"
                          >
                            {i + 1}
                          </Badge>
                          <span className="text-muted-foreground">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-sky-500/10 flex items-center justify-center">
                        <MessageSquare className="size-4 text-sky-600" />
                      </div>
                      <p className="text-sm font-semibold">话术建议</p>
                    </div>
                    <div className="pl-9 rounded-lg bg-muted/50 p-4">
                      <p className="text-[13px] text-muted-foreground leading-relaxed italic">
                        "{plan.script}"
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setPlanLead(null)}
                    >
                      关闭
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        handleApply(planLead.id);
                        setPlanLead(null);
                      }}
                    >
                      申请跟进此线索
                    </Button>
                  </div>
                </div>
              </SheetContent>
            );
          })()}
      </Sheet>
    </div>
  );
}
