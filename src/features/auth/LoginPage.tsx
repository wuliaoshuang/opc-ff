import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useStore } from '@/stores'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Zap, Loader2 } from 'lucide-react'
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

export default function LoginPage() {
  const navigate = useNavigate()
  const loginWithAccount = useStore((s) => s.loginWithAccount)
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const user = useStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<'partner' | 'admin'>('partner')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    if (isAuthenticated) {
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

  return (
    <>
      <style>{`
        @keyframes login-reveal {
          from { opacity: 0; transform: translateY(18px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>

      <div className="relative min-h-svh overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 size-80 rounded-full bg-indigo-400/20 blur-[120px] dark:bg-indigo-500/15" />
          <div className="absolute top-1/4 right-1/3 size-64 rounded-full bg-rose-400/15 blur-[100px] dark:bg-rose-500/10" />
          <div className="absolute -bottom-24 left-1/4 size-72 rounded-full bg-cyan-400/15 blur-[110px] dark:bg-cyan-500/10" />
          <div className="absolute top-2/3 right-1/6 size-48 rounded-full bg-amber-400/10 blur-[90px] dark:bg-amber-500/8" />
        </div>

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02] mix-blend-overlay dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex min-h-svh items-center justify-center p-4 sm:p-8">
          <div
            className="flex w-full max-w-[980px] flex-col overflow-hidden rounded-[2rem] border border-border/50 bg-background/60 shadow-2xl backdrop-blur-xl lg:flex-row"
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
                  <h1 className="text-lg font-bold">OPC 平台</h1>
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

                <p className="mt-8 text-center text-[11px] text-muted-foreground/50">
                  合伙人演示账号：zw001 / OPC123456
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
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
