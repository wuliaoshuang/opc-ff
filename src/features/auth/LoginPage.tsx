import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useStore } from '@/stores'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Zap, Loader2, MessageCircle, Smartphone, CheckCircle2, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const loginSchema = z.object({
  username: z.string().min(2, '请输入系统账号'),
  password: z.string().min(6, '请输入至少6位密码'),
})

type LoginFormData = z.infer<typeof loginSchema>

const features = [
  { title: 'AI 线索挖掘', desc: '智能匹配潜在项目，精准锁定高价值客户' },
  { title: '双维度评级', desc: '线索价值 + 资源匹配，科学量化每一条线索' },
  { title: 'CRM 跟进', desc: '阶梯式排他机制，确保业务推进高效有序' },
  { title: '激励结算', desc: '红包任务 + 分佣透明，让努力看得见回报' },
]

const channelConfigs = {
  dingtalk: {
    title: '钉钉消息入口接入',
    desc: '用于从钉钉工作通知、消息卡片或企业工作台免登进入 OPC。',
    applyUrl: 'https://open.dingtalk.com/',
    applyLabel: '打开钉钉开放平台',
    callback: 'https://your-domain.com/auth/dingtalk/callback',
    params: ['企业 CorpId', '应用 AppKey / Client ID', '应用 AppSecret / Client Secret', '免登回调地址', '消息卡片跳转地址'],
    steps: [
      '用企业管理员账号进入钉钉开放平台。',
      '创建企业内部应用，应用类型选择 H5 微应用/企业应用。',
      '配置应用首页地址和免登回调地址。',
      '开通通讯录身份读取权限，用免登 code 换用户身份。',
      '在工作通知或消息卡片里配置跳转到 OPC 的业务页面。',
    ],
    test: '从钉钉消息卡片点击进入，系统应自动识别手机号/unionId 并进入对应合伙人或管理员账号。',
  },
  wechat: {
    title: '微信小程序入口接入',
    desc: '用于移动端小程序访问 OPC，承载合伙人看板、项目跟进和任务提醒。',
    applyUrl: 'https://mp.weixin.qq.com/',
    applyLabel: '打开微信公众平台',
    callback: 'https://your-domain.com/auth/wechat-mini/session',
    params: ['小程序 AppID', '小程序 AppSecret', '服务器域名 request 合法域名', '业务域名/web-view 域名', '登录 code2Session 接口'],
    steps: [
      '在微信公众平台注册小程序并完成主体认证。',
      '进入开发管理获取 AppID，并生成 AppSecret。',
      '配置服务器域名和业务域名，域名必须 HTTPS 且已备案。',
      '小程序端调用 wx.login 获取 code，后端通过 code2Session 换 openid/session_key。',
      '把 openid/unionid 与 OPC 合伙人账号绑定，再进入移动端页面。',
    ],
    test: '从小程序打开 OPC，首次绑定手机号或账号；再次进入应自动识别身份并进入首页看板。',
  },
} as const

type ChannelKey = keyof typeof channelConfigs
type ChannelAction = 'simulate' | 'setup'

export default function LoginPage() {
  const navigate = useNavigate()
  const loginWithAccount = useStore((s) => s.loginWithAccount)
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const user = useStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<'partner' | 'admin'>('partner')
  const [loading, setLoading] = useState(false)
  const [channel, setChannel] = useState<ChannelKey | null>(null)
  const [channelAction, setChannelAction] = useState<ChannelAction>('simulate')
  const channelRedirectRef = useRef<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    if (isAuthenticated) {
      const channelRedirect = channelRedirectRef.current
      if (channelRedirect) {
        channelRedirectRef.current = null
        navigate(channelRedirect)
        return
      }
      navigate(user?.role === 'admin' ? '/admin/dashboard' : '/partner/dashboard')
    }
  }, [isAuthenticated, navigate, user?.role])

  useEffect(() => {
    setValue('username', activeTab === 'admin' ? 'admin' : 'zw001')
    setValue('password', activeTab === 'admin' ? 'OPC@2026' : 'OPC123456')
  }, [activeTab, setValue])

  const onSubmit = (data: LoginFormData) => {
    setLoading(true)
    setTimeout(() => {
      const result = loginWithAccount(data.username, data.password, activeTab)
      if (!result.success) {
        toast.error(result.message)
      } else {
        toast.success(`欢迎回来，${result.user?.name}`)
      }
      setLoading(false)
    }, 600)
  }

  const openChannel = (nextChannel: ChannelKey, action: ChannelAction = 'simulate') => {
    setChannel(nextChannel)
    setChannelAction(action)
  }

  const simulateChannelLogin = (nextChannel: ChannelKey) => {
    const targetPath = nextChannel === 'dingtalk'
      ? '/partner/red-packets?from=dingtalk-message&task=rp-003'
      : '/partner/dashboard?from=wechat-mini'
    channelRedirectRef.current = targetPath
    const result = loginWithAccount('zw001', 'OPC123456', 'partner')
    if (!result.success) {
      channelRedirectRef.current = null
      toast.error(result.message)
      return
    }
    toast.success(nextChannel === 'dingtalk' ? '已模拟钉钉消息跳转免登' : '已模拟微信小程序授权登录')
  }

  return (
    <>
      <style>{`
        @keyframes login-reveal {
          from { opacity: 0; transform: translateY(18px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>

      <div className="relative min-h-svh overflow-x-hidden bg-background">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.12),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.10),transparent_30%)]" />

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02] mix-blend-overlay dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex min-h-svh items-start justify-center overflow-y-auto p-4 py-8 sm:p-8 lg:items-center">
          <div
            className="flex w-full max-w-[980px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/92 shadow-xl backdrop-blur-xl lg:flex-row"
            style={{ animation: 'login-reveal 0.8s cubic-bezier(.22,1,.36,1) both', animationDelay: '0.1s' }}
          >
            <div className="relative hidden w-1/2 flex-col justify-between bg-foreground/[0.03] p-10 lg:flex">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-foreground text-background">
                    <Zap className="size-4" />
                  </div>
                  <span className="text-base font-semibold tracking-wide">OPC 平台</span>
                </div>

                <h1 className="mt-10 text-[clamp(1.8rem,2.2vw,2.5rem)] leading-[1.2] font-extrabold tracking-tight">
                  综合能源{'\n'}城市合伙人平台
                </h1>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  AI 驱动的智能线索挖掘与项目管理系统，助力合伙人高效拓展综合能源业务
                </p>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-3">
                {features.map(({ title, desc }) => (
                  <div key={title} className="rounded-xl border border-foreground/5 bg-background/40 p-4 backdrop-blur-sm">
                    <p className="text-[13px] font-medium">{title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex w-full flex-col p-8 lg:w-1/2 lg:p-10">
              <div className="mx-auto my-auto w-full max-w-[360px] py-4">
                <div className="mb-6 flex flex-col items-center gap-3 lg:hidden">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background">
                    <Zap className="size-6" />
                  </div>
                  <h1 className="text-lg font-bold">综合能源城市合伙人平台</h1>
                </div>

                <div className="hidden flex-col items-center pb-6 lg:flex">
                  <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-foreground/5 dark:bg-foreground/10">
                    <Zap className="size-6 text-foreground/80" />
                  </div>
                  <h2 className="text-center text-xl font-bold tracking-tight">欢迎回来</h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">登录以继续管理您的业务</p>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'partner' | 'admin')}>
                  <TabsList className="mb-5 grid h-10 w-full grid-cols-2 rounded-lg bg-foreground/5">
                    <TabsTrigger value="partner" className="rounded-md text-[13px]">合伙人</TabsTrigger>
                    <TabsTrigger value="admin" className="rounded-md text-[13px]">管理员</TabsTrigger>
                  </TabsList>
                  <TabsContent value="partner" className="focus-visible:outline-none">
                    <LoginFormFields
                      onSubmit={handleSubmit(onSubmit)}
                      register={register}
                      errors={errors}
                      loading={loading}
                    />
                  </TabsContent>
                  <TabsContent value="admin" className="focus-visible:outline-none">
                    <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-50 p-3 text-[12px] text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                      后台账号：<span className="font-semibold">admin</span>，密码：<span className="font-semibold">OPC@2026</span>
                    </div>
                    <LoginFormFields
                      onSubmit={handleSubmit(onSubmit)}
                      register={register}
                      errors={errors}
                      loading={loading}
                    />
                  </TabsContent>
                </Tabs>

                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="mt-5 w-full text-center text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  没有账号？立即注册
                </button>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button type="button" variant="outline" className="gap-1.5" onClick={() => openChannel('dingtalk')}>
                    <MessageCircle className="size-4" /> 钉钉消息入口
                  </Button>
                  <Button type="button" variant="outline" className="gap-1.5" onClick={() => openChannel('wechat')}>
                    <Smartphone className="size-4" /> 小程序入口
                  </Button>
                </div>

                <p className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground/70">
                  合伙人演示账号：zw001 / OPC123456；华东区域管理员：east-admin / OPC@2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChannelAccessDialog
        action={channelAction}
        channel={channel}
        onOpenChange={(open) => !open && setChannel(null)}
        onSetup={() => setChannelAction('setup')}
        onSimulate={() => channel && simulateChannelLogin(channel)}
      />
    </>
  )
}

function ChannelAccessDialog({
  action,
  channel,
  onOpenChange,
  onSetup,
  onSimulate,
}: {
  action: ChannelAction
  channel: ChannelKey | null
  onOpenChange: (open: boolean) => void
  onSetup: () => void
  onSimulate: () => void
}) {
  const config = channel ? channelConfigs[channel] : null
  if (!config) return null

  const copyCallback = async () => {
    await navigator.clipboard.writeText(config.callback)
    toast.success('回调地址已复制')
  }

  return (
    <Dialog open={!!channel} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{config.title}</DialogTitle>
            <Badge variant="secondary">{action === 'simulate' ? '原型可测试' : '待正式联调'}</Badge>
          </div>
          <DialogDescription>{config.desc}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {action === 'simulate' && (
            <section className="rounded-xl border bg-muted/25 p-3">
              <p className="text-[13px] font-medium">原型验收动作</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                {channel === 'dingtalk'
                  ? '模拟用户从钉钉消息卡片点击红包任务提醒，免登进入对应业务入口。'
                  : '模拟用户从微信小程序授权进入移动端 OPC 首页看板。'}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button className="gap-1.5" onClick={onSimulate}>
                  {channel === 'dingtalk' ? <MessageCircle className="size-4" /> : <Smartphone className="size-4" />}
                  模拟进入系统
                </Button>
                <Button variant="outline" className="gap-1.5" onClick={onSetup}>
                  <ExternalLink className="size-4" /> 查看申请配置
                </Button>
              </div>
            </section>
          )}

          {action === 'setup' && <section className="rounded-xl border bg-muted/25 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium">申请入口</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  需要企业/主体管理员登录平台创建应用，拿到参数后交给开发接入。
                </p>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.open(config.applyUrl, '_blank', 'noopener,noreferrer')}>
                <ExternalLink className="size-3.5" /> {config.applyLabel}
              </Button>
            </div>
          </section>}

          {action === 'setup' && <section>
            <p className="mb-2 text-[13px] font-medium">需要申请/配置的参数</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {config.params.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border p-2 text-[12px]">
                  <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </section>}

          {action === 'setup' && <section>
            <p className="mb-2 text-[13px] font-medium">建议回调地址</p>
            <div className="flex items-center gap-2 rounded-lg border bg-background p-2">
              <code className="min-w-0 flex-1 truncate text-[12px]">{config.callback}</code>
              <Button size="sm" variant="ghost" className="gap-1.5" onClick={copyCallback}>
                <Copy className="size-3.5" /> 复制
              </Button>
            </div>
          </section>}

          {action === 'setup' && <Separator />}

          {action === 'setup' && <section>
            <p className="mb-2 text-[13px] font-medium">实施步骤</p>
            <ol className="space-y-2">
              {config.steps.map((step, index) => (
                <li key={step} className="flex gap-2 text-[12px] leading-relaxed text-muted-foreground">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>}

          <section className="rounded-xl border border-amber-500/20 bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
            <p className="font-medium">验收口径</p>
            <p className="mt-1">{config.test}</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LoginFormFields({
  onSubmit,
  register,
  errors,
  loading,
}: {
  onSubmit: () => void
  register: ReturnType<typeof useForm<LoginFormData>>['register']
  errors: ReturnType<typeof useForm<LoginFormData>>['formState']['errors']
  loading: boolean
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-[13px] font-medium">系统账号</Label>
        <Input placeholder="请输入后台分配的系统账号" className="h-10 bg-background/50" {...register('username')} />
        {errors.username && <p className="text-[12px] text-destructive">{errors.username.message}</p>}
      </div>
      <div className="space-y-2">
        <Label className="text-[13px] font-medium">密码</Label>
        <Input placeholder="请输入密码" type="password" className="h-10 bg-background/50" {...register('password')} />
        {errors.password && <p className="text-[12px] text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="mt-2 h-11 w-full gap-2 text-[14px] font-medium" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        登录
      </Button>
    </form>
  )
}
