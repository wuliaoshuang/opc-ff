import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/shared/StatCard";
import { useStore } from "@/stores";
import {
  Award,
  BookOpen,
  ChevronRight,
  Gift,
  LogOut,
  MapPin,
  Palette,
  Phone,
  Settings,
  ShieldCheck,
  Sparkles,
  Users2,
  Wallet,
} from "lucide-react";

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const leads = useStore((s) => s.leads);
  const projects = useStore((s) => s.projects);
  const bindings = useStore((s) => s.bindings);
  const redPacketTasks = useStore((s) => s.redPacketTasks);
  const commissions = useStore((s) => s.commissions);
  const subPartners = useStore((s) => s.subPartners);

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const totalEarned = commissions
    .filter((c) => c.status === "settled")
    .reduce((sum, item) => sum + item.amount, 0);
  const paidRewards = redPacketTasks
    .filter((task) => task.status === "paid")
    .reduce((sum, task) => sum + task.amount, 0);
  const activeBindings = bindings.filter(
    (binding) => binding.status === "active" && binding.partnerId === user.id,
  ).length;
  const mySubPartners = subPartners.filter(
    (partner) => partner.parentId === user.id && partner.status === "active",
  ).length;

  const quickLinks = isAdmin
    ? [
        {
          label: "线索管理",
          sub: "归属与分配",
          icon: ShieldCheck,
          path: "/admin/leads",
        },
        {
          label: "合伙人",
          sub: "团队绩效",
          icon: Users2,
          path: "/admin/partners",
        },
        {
          label: "激励管理",
          sub: "红包与分佣",
          icon: Gift,
          path: "/admin/incentives",
        },
      ]
    : [
        {
          label: "客户绑定",
          sub: "查看保护期",
          icon: ShieldCheck,
          path: "/partner/binding",
        },
        {
          label: "二级合伙人",
          sub: "渠道团队",
          icon: Users2,
          path: "/partner/channel",
        },
        {
          label: "培训系统",
          sub: "资料与问答",
          icon: BookOpen,
          path: "/partner/training",
        },
        {
          label: "AIGC 工具",
          sub: "政策/案例/机会",
          icon: Sparkles,
          path: "/partner/aigc",
        },
      ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="overflow-hidden rounded-3xl border bg-primary p-5 text-white">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-zinc-950">
            {user.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight">
                {user.name}
              </h1>
              <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/10">
                {isAdmin ? "管理端" : "合伙人"}
              </Badge>
            </div>
            <div className="mt-2 space-y-1 text-[12px] text-white/60">
              <p className="flex items-center gap-1.5">
                <Phone className="size-3.5" />
                {user.phone}
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {user.region} · {user.industry}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/[0.07] p-3">
            <p className="text-[10px] text-white/50">线索</p>
            <p className="mt-1 text-xl font-bold">{leads.length}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.07] p-3">
            <p className="text-[10px] text-white/50">项目</p>
            <p className="mt-1 text-xl font-bold">{projects.length}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.07] p-3">
            <p className="text-[10px] text-white/50">绑定</p>
            <p className="mt-1 text-xl font-bold">{activeBindings}</p>
          </div>
        </div>
      </section>

      {!isAdmin && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <StatCard
            title="累计收益"
            value={`¥${totalEarned.toLocaleString()}`}
            icon={Wallet}
          />
          <StatCard
            title="红包奖励"
            value={`¥${paidRewards.toLocaleString()}`}
            icon={Gift}
          />
          <StatCard title="二级团队" value={mySubPartners} icon={Award} />
        </div>
      )}

      <Card className="rounded-2xl border-border/70 shadow-none">
        <CardContent className="p-4">
          <p className="text-sm font-semibold">快捷入口</p>
          <div className="mt-3 space-y-2">
            {quickLinks.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted active:scale-[0.99]"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <item.icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">账号状态</p>
          </div>
          <Separator className="my-3" />
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <p className="text-muted-foreground">角色</p>
              <p className="mt-1 font-medium">
                {isAdmin ? "平台管理员" : "城市合伙人"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">认证</p>
              <p className="mt-1 font-medium">已通过</p>
            </div>
            <div>
              <p className="text-muted-foreground">负责区域</p>
              <p className="mt-1 font-medium">{user.region}</p>
            </div>
            <div>
              <p className="text-muted-foreground">主营行业</p>
              <p className="mt-1 font-medium">{user.industry}</p>
            </div>
          </div>
          <Separator className="my-3" />
          <button
            type="button"
            onClick={() =>
              navigate(
                isAdmin
                  ? "/admin/account-settings"
                  : "/partner/account-settings",
              )
            }
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted active:scale-[0.99]"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Settings className="size-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium">账号设置</p>
              <p className="text-[11px] text-muted-foreground">
                修改姓名、手机号与密码
              </p>
            </div>
            <ChevronRight className="size-3.5 text-muted-foreground" />
          </button>
          {!isAdmin && (
            <>
              <Separator className="my-3" />
              <button
                type="button"
                onClick={() => navigate("/partner/white-label")}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted active:scale-[0.99]"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Palette className="size-3.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">品牌自定义</p>
                  <p className="text-[11px] text-muted-foreground">
                    自定义名称、Logo 与主色调
                  </p>
                </div>
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </button>
            </>
          )}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="h-11 w-full gap-2 text-destructive hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut className="size-4" /> 退出登录
      </Button>
    </div>
  );
}
