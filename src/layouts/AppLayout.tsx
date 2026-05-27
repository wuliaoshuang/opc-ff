import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useStore } from "@/stores";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard,
  Search,
  Star,
  Briefcase,
  Users,
  BookOpen,
  Sparkles,
  Gift,
  Wallet,
  LogOut,
  Zap,
  Menu,
  BarChart3,
  Database,
  Users2,
  Palette,
  Package,
  Trophy,
  Sun,
  Moon,
  ChevronLeft,
  MoreHorizontal,
  Link2,
  UserCircle,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  sub: string;
  icon: typeof LayoutDashboard;
  path: string;
  superOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const partnerNav: NavGroup[] = [
  {
    title: "工作台",
    items: [
      {
        label: "任务看板",
        sub: "首页看板",
        icon: LayoutDashboard,
        path: "/partner/dashboard",
      },
      {
        label: "目标项目",
        sub: "客户清单",
        icon: Search,
        path: "/partner/leads",
      },
      {
        label: "线索评级",
        sub: "双维度评估",
        icon: Star,
        path: "/partner/evaluation",
      },
      {
        label: "个人项目",
        sub: "进展表单",
        icon: Briefcase,
        path: "/partner/crm",
      },
    ],
  },
  {
    title: "业务",
    items: [
      {
        label: "客户绑定",
        sub: "关系管理",
        icon: Users,
        path: "/partner/binding",
      },
      {
        label: "二级合伙人",
        sub: "渠道管理",
        icon: Users2,
        path: "/partner/channel",
      },
      {
        label: "培训系统",
        sub: "知识库",
        icon: BookOpen,
        path: "/partner/training",
      },
      { label: "AIGC", sub: "内容生成", icon: Sparkles, path: "/partner/aigc" },
    ],
  },
  {
    title: "激励",
    items: [
      {
        label: "红包任务",
        sub: "任务奖励",
        icon: Gift,
        path: "/partner/red-packets",
      },
      {
        label: "分佣结算",
        sub: "收益明细",
        icon: Wallet,
        path: "/partner/settlement",
      },
    ],
  },
  {
    title: "个人",
    items: [
      {
        label: "个人中心",
        sub: "账号资料",
        icon: UserCircle,
        path: "/partner/profile",
      },
      {
        label: "账号设置",
        sub: "信息与密码",
        icon: Settings,
        path: "/partner/account-settings",
      },
    ],
  },
];

const adminNav: NavGroup[] = [
  {
    title: "管理",
    items: [
      {
        label: "总览",
        sub: "数据概览",
        icon: BarChart3,
        path: "/admin/dashboard",
      },
      {
        label: "线索管理",
        sub: "全局线索",
        icon: Database,
        path: "/admin/leads",
      },
      {
        label: "合伙人",
        sub: "团队管理",
        icon: Users2,
        path: "/admin/partners",
      },
      {
        label: "账号管理",
        sub: "后台权限",
        icon: ShieldCheck,
        path: "/admin/accounts",
        superOnly: true,
      },
      {
        label: "总项目表",
        sub: "进展表单",
        icon: Briefcase,
        path: "/admin/tracking",
      },
      {
        label: "客户绑定",
        sub: "归属冲突",
        icon: Link2,
        path: "/admin/bindings",
      },
    ],
  },
  {
    title: "配置",
    items: [
      {
        label: "培训内容",
        sub: "知识库CMS",
        icon: BookOpen,
        path: "/admin/training",
      },
      {
        label: "AIGC模板",
        sub: "提示词配置",
        icon: Sparkles,
        path: "/admin/aigc",
      },
      {
        label: "贴牌配置",
        sub: "品牌定制",
        icon: Palette,
        path: "/admin/white-label",
      },
      {
        label: "产品货架",
        sub: "服务目录",
        icon: Package,
        path: "/admin/products",
      },
      {
        label: "激励管理",
        sub: "红包与分佣",
        icon: Trophy,
        path: "/admin/incentives",
      },
      {
        label: "分佣结算",
        sub: "收益发放",
        icon: Wallet,
        path: "/admin/settlements",
      },
    ],
  },
  {
    title: "个人",
    items: [
      {
        label: "个人中心",
        sub: "账号资料",
        icon: UserCircle,
        path: "/admin/profile",
      },
      {
        label: "账号设置",
        sub: "信息与密码",
        icon: Settings,
        path: "/admin/account-settings",
      },
    ],
  },
];

function SidebarContent({ groups, isSuperAdmin = false }: { groups: NavGroup[]; isSuperAdmin?: boolean }) {
  return (
    <>
      {groups.map((group) => (
        <div key={group.title}>
          <span className="mb-1 px-2 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            {group.title}
          </span>
          <div className="flex flex-col gap-0.5">
            {group.items.filter((item) => !item.superOnly || isSuperAdmin).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )
                }
              >
                <item.icon className="size-4 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] leading-tight">
                    {item.label}
                  </span>
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    {item.sub}
                  </span>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const isSuperAdmin = user?.adminLevel === "super_admin";
  const groups = isAdmin ? adminNav : partnerNav;
  const userInitial = user?.name?.[0] ?? "?";

  const whiteLabelConfigs = useStore((s) => s.whiteLabelConfigs);
  const myBrand = !isAdmin && user ? whiteLabelConfigs[user.id] : null;
  const activeBrand = myBrand?.auditStatus === "approved" ? myBrand : null;
  const effectiveSnapshot = activeBrand
    ? { systemName: activeBrand.systemName, logoUrl: activeBrand.logoUrl, primaryColor: activeBrand.primaryColor }
    : (myBrand?.approvedSnapshot ?? null);
  const brandName = effectiveSnapshot?.systemName || "OPC 平台";
  const brandSub = isAdmin ? "管理后台" : "合伙人中心";
  const brandColor = effectiveSnapshot?.primaryColor ?? undefined;
  const brandLogo = effectiveSnapshot?.logoUrl ?? null;

  const visibleGroups = groups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.superOnly || isSuperAdmin),
  })).filter((group) => group.items.length > 0);
  const allItems = visibleGroups.flatMap((g) => g.items);
  const profilePath = isAdmin ? "/admin/profile" : "/partner/profile";
  const currentNav = allItems.find((item) =>
    location.pathname.startsWith(item.path),
  );
  const currentGroup = visibleGroups.find((group) =>
    group.items.some((item) => location.pathname.startsWith(item.path)),
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const root = document.documentElement;
    const isNeutral = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return luminance < 0.15 || luminance > 0.90
    }
    if (!isAdmin && brandColor && !isNeutral(brandColor)) {
      root.style.setProperty("--primary", brandColor);
      root.style.setProperty("--primary-foreground", "#ffffff");
      root.style.setProperty("--ring", brandColor);
    } else {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--ring");
    }
    return () => {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--ring");
    };
  }, [isAdmin, brandColor]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden"
          style={brandColor ? { backgroundColor: brandColor } : undefined}
        >
          {brandLogo ? (
            <img src={brandLogo} alt="logo" className="size-8 object-cover" />
          ) : (
            <Zap className="size-4" />
          )}
        </div>
        <div className="flex w-[168px] flex-col overflow-hidden">
          <span className="truncate text-sm font-semibold">{brandName}</span>
          <span className="truncate text-[10px] text-muted-foreground">
            {brandSub}
          </span>
        </div>
      </div>

      <Separator />

      <nav className="flex flex-col gap-3 p-3 flex-1 overflow-y-auto">
        <SidebarContent groups={visibleGroups} isSuperAdmin={isSuperAdmin} />
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 p-3">
        <Separator className="mb-2" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-3 text-muted-foreground"
                  onClick={() => setDark((d) => !d)}
                >
                  {dark ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                  <span className="text-[12px]">
                    {dark ? "浅色模式" : "深色模式"}
                  </span>
                </Button>
              }
            />
            <TooltipContent>切换主题</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          <span className="text-[12px]">退出登录</span>
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    const incentiveTabLabel = isAdmin ? "激励" : "红包";
    const mobileTabsPartner = [
      {
        label: "首页",
        icon: LayoutDashboard,
        path: "/partner/dashboard",
        match: ["/partner/dashboard"],
      },
      {
        label: "线索",
        icon: Search,
        path: "/partner/leads",
        match: ["/partner/leads", "/partner/evaluation"],
      },
      {
        label: incentiveTabLabel,
        icon: Gift,
        path: "/partner/red-packets",
        match: ["/partner/red-packets", "/partner/settlement"],
        raised: true,
      },
      {
        label: "跟进",
        icon: Briefcase,
        path: "/partner/crm",
        match: ["/partner/crm", "/partner/binding"],
      },
      {
        label: "更多",
        icon: MoreHorizontal,
        path: "",
        match: [
          "/partner/channel",
          "/partner/training",
          "/partner/aigc",
          "/partner/profile",
          "/partner/account-settings",
          "/partner/white-label",
        ],
      },
    ];
    const mobileTabsAdmin = [
      {
        label: "总览",
        icon: BarChart3,
        path: "/admin/dashboard",
        match: ["/admin/dashboard"],
      },
      {
        label: "线索",
        icon: Database,
        path: "/admin/leads",
        match: ["/admin/leads"],
      },
      {
        label: incentiveTabLabel,
        icon: Trophy,
        path: "/admin/incentives",
        match: ["/admin/incentives"],
        raised: true,
      },
      {
        label: "合伙人",
        icon: Users2,
        path: "/admin/partners",
        match: ["/admin/partners"],
      },
      {
        label: "更多",
        icon: MoreHorizontal,
        path: "",
        match: [
          "/admin/tracking",
          "/admin/accounts",
          "/admin/bindings",
          "/admin/white-label",
          "/admin/products",
          "/admin/training",
          "/admin/aigc",
          "/admin/settlements",
          "/admin/profile",
          "/admin/account-settings",
        ],
      },
    ];
    const mobileTabs = isAdmin ? mobileTabsAdmin : mobileTabsPartner;

    const primaryItems = mobileTabs.filter((tab) => tab.path);
    const currentPrimary = primaryItems.find((tab) =>
      tab.match.some((path) => location.pathname.startsWith(path)),
    );
    const isSecondaryRoute =
      !currentPrimary || currentPrimary.path !== currentNav?.path;
    const backTarget =
      currentPrimary?.path ??
      (isAdmin ? "/admin/dashboard" : "/partner/dashboard");

    return (
      <div className="flex h-full flex-col">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <header className="shrink-0 border-b border-border/60 bg-background/95 pt-safe-top backdrop-blur-xl">
            <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3">
              <div className="flex min-w-0 items-center gap-2">
                {isSecondaryRoute ? (
                  <button
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-accent"
                    onClick={() => navigate(backTarget)}
                    aria-label={`返回${currentPrimary?.label ?? "首页"}`}
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                ) : (
                  <SheetTrigger
                    render={
                      <button
                        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-accent"
                        aria-label="打开导航菜单"
                      >
                        <Menu className="size-5" />
                      </button>
                    }
                  />
                )}
                <div
                  className="flex size-7 items-center justify-center rounded-lg bg-primary overflow-hidden"
                  style={
                    brandColor ? { backgroundColor: brandColor } : undefined
                  }
                >
                  {brandLogo ? (
                    <img
                      src={brandLogo}
                      alt="logo"
                      className="size-7 object-cover"
                    />
                  ) : (
                    <Zap className="size-3.5 text-primary-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold tracking-tight">
                    {currentNav?.label ?? effectiveSnapshot?.systemName ?? "OPC"}
                  </span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {currentGroup?.title ?? brandSub}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => setDark((d) => !d)}
                  className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-accent"
                  aria-label={dark ? "切换到浅色模式" : "切换到深色模式"}
                >
                  {dark ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                </button>
                <button
                  onClick={() => navigate(profilePath)}
                  className="flex size-11 items-center justify-center rounded-full transition-transform active:scale-95"
                  aria-label="进入个人中心"
                >
                  <Avatar className="after:border-0">
                    <AvatarFallback className="bg-primary/10 text-[12px] font-semibold text-primary">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </div>
            </div>
          </header>

          <SheetContent
            side="bottom"
            className="max-h-[86dvh] overflow-y-auto rounded-t-2xl pb-8"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
            <div className="mb-4 grid grid-cols-2 gap-2">
              {primaryItems.map((item) => {
                const isActive = item.match.some((path) =>
                  location.pathname.startsWith(path),
                );
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "flex min-h-11 min-w-0 items-center gap-3 rounded-2xl border p-3 transition-colors",
                      isActive
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "border-border bg-card text-foreground hover:bg-muted",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <div className="min-w-0 text-left">
                      <p className="truncate text-[13px] font-semibold">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        主入口
                      </p>
                    </div>
                  </NavLink>
                );
              })}
            </div>

            <div className="space-y-4">
              {visibleGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <p className="px-1 text-[11px] font-medium text-muted-foreground">
                    {group.title}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setSheetOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 transition-colors",
                            isActive
                              ? "bg-primary/90 text-primary-foreground"
                              : "bg-muted/60 text-foreground hover:bg-muted",
                          )
                        }
                      >
                        <item.icon className="size-4 shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium">
                            {item.label}
                          </p>
                          <p className="truncate text-[10px] opacity-70">
                            {item.sub}
                          </p>
                        </div>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 px-3 py-3 text-[13px] font-medium text-destructive"
              >
                <LogOut className="size-4" />
                退出登录
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <main className="mobile-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-muted/25 p-3 pb-[calc(7rem+env(safe-area-inset-bottom))]">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="mx-auto flex h-[4.25rem] max-w-lg items-end justify-around px-2">
            {mobileTabs.map((tab) => {
              const isMore = !tab.path;
              const isRaised = "raised" in tab && tab.raised;
              const isActive = tab.match.some((path) =>
                location.pathname.startsWith(path),
              );

              if (isMore) {
                return (
                  <button
                    key="more"
                    className={cn(
                      "flex min-h-11 min-w-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                    onClick={() => setSheetOpen(true)}
                    aria-label="打开更多功能"
                  >
                    <tab.icon
                      className={cn("size-5", isActive && "scale-110")}
                    />
                    <span
                      className={cn("text-[10px]", isActive && "font-semibold")}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              }

              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={cn(
                    "flex min-h-11 min-w-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 transition-colors active:bg-muted",
                    isRaised && "-mt-5 px-2",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {isRaised ? (
                    <>
                      <span
                        className={cn(
                          "relative flex size-14 items-center justify-center overflow-hidden rounded-full text-white shadow-[0_14px_30px_rgba(37,99,235,0.24),0_4px_12px_rgba(15,23,42,0.10)] transition-transform before:absolute before:inset-x-4 before:top-2 before:h-3 before:rounded-full before:bg-white/35 before:blur-[6px] active:scale-95",
                          isActive
                            ? "bg-[linear-gradient(145deg,color-mix(in_oklab,var(--primary)_92%,white)_0%,var(--primary)_62%,color-mix(in_oklab,var(--primary)_92%,black)_100%)] shadow-[0_16px_32px_rgba(37,99,235,0.32),0_5px_14px_rgba(15,23,42,0.12)]"
                            : "bg-[linear-gradient(145deg,#f8fbff_0%,color-mix(in_oklab,var(--primary)_46%,white)_34%,color-mix(in_oklab,var(--primary)_78%,white)_100%)] shadow-[0_14px_30px_rgba(37,99,235,0.18),0_4px_12px_rgba(15,23,42,0.08)]",
                        )}
                      >
                        <tab.icon
                          className={cn(
                            "relative z-10 size-6 drop-shadow-sm",
                            isActive ? "text-white" : "text-primary",
                          )}
                        />
                      </span>
                      <span
                        className={cn(
                          "mt-1 text-[10px] font-semibold",
                          isActive ? "text-primary" : "text-foreground",
                        )}
                      >
                        {tab.label}
                      </span>
                    </>
                  ) : (
                    <>
                      <tab.icon
                        className={cn("size-5", isActive && "scale-110")}
                      />
                      <span
                        className={cn(
                          "text-[10px]",
                          isActive && "font-semibold",
                        )}
                      >
                        {tab.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      </div>
    );
  }

  return (
    <div className="flex h-svh overflow-hidden">
      <aside className="flex h-full w-[240px] shrink-0 flex-col border-r bg-muted/30">
        {sidebarInner}
      </aside>
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-15 shrink-0 items-center justify-between border-b px-5">
          <div className="flex items-center gap-2">
            {currentNav && (
              <>
                <currentNav.icon className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{currentNav.label}</span>
                <Badge variant="secondary" className="px-1.5 text-[9px]">
                  {currentNav.sub}
                </Badge>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(profilePath)}
              className="flex h-9 max-w-[220px] items-center gap-2 rounded-full bg-background px-2 py-1 text-left transition-colors hover:bg-muted"
              aria-label="进入个人中心"
            >
              <Avatar className="after:border-0">
                <AvatarFallback className="bg-primary/10 text-[12px] font-semibold text-primary">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[12px] font-medium leading-tight">
                  {user?.name}
                </span>
                <span className="truncate text-[10px] leading-tight text-muted-foreground">
                  {isAdmin ? "管理端" : user?.region}
                </span>
              </span>
              {isAdmin && (
                <Badge
                  variant="secondary"
                  className="shrink-0 px-1.5 text-[9px]"
                >
                  管理
                </Badge>
              )}
            </button>
          </div>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
