import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useStore } from '@/stores'
import { StepBasicInfo } from './components/StepBasicInfo'
import { StepIndustry } from './components/StepIndustry'
import { StepTags } from './components/StepTags'
import { normalizeInviteCode } from '@/lib/invite-code'
import type { AuthAccount } from '@/types'
import type { StepBasicData, StepIndustryData } from './schemas'

const stepLabels = ['基本信息', '行业信息', '资源标签'] as const

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const registerAccount = useStore((s) => s.registerAccount)
  const resolveInviteCode = useStore((s) => s.resolveInviteCode)
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [basicData, setBasicData] = useState<StepBasicData>()
  const [industryData, setIndustryData] = useState<StepIndustryData>()
  const [tagsData, setTagsData] = useState<string[]>([])
  const inviteCodeFromUrl = normalizeInviteCode(searchParams.get('inviteCode') ?? '')

  const handleBasic = useCallback((data: StepBasicData) => {
    const inviteCode = normalizeInviteCode(data.inviteCode)
    const result = resolveInviteCode(inviteCode)
    if (!result.success) {
      toast.error(result.message)
      return
    }
    setBasicData({ ...data, inviteCode })
    setStep(1)
  }, [resolveInviteCode])

  const handleIndustry = useCallback((data: StepIndustryData) => {
    setIndustryData(data)
    setStep(2)
  }, [])

  const handleSubmit = useCallback(
    (resources: string[]) => {
      setTagsData(resources)
      setIsSubmitting(true)
      setTimeout(() => {
        if (basicData && industryData) {
          const inviteResult = resolveInviteCode(basicData.inviteCode ?? '')
          if (!inviteResult.success) {
            setIsSubmitting(false)
            toast.error(inviteResult.message)
            return
          }
          const parent = inviteResult.parent
          const account: AuthAccount = {
            id: `p-reg-${Date.now()}`,
            password: 'OPC123456',
            name: basicData.name,
            phone: basicData.phone,
            role: 'partner',
            region: basicData.region,
            industry: industryData.industry,
            market: industryData.market,
            workType: basicData.workType,
            resourceTags: resources,
            idCardMasked: `${industryData.idCard.slice(0, 3)}***********${industryData.idCard.slice(-4)}`,
            idCardVerified: true,
            relation: parent ? 'secondary' : 'primary',
            inviteCode: parent ? basicData.inviteCode : undefined,
            parentPartnerId: parent?.id,
            parentPartnerName: parent?.name,
            status: 'pending',
            submittedAt: new Date().toISOString(),
          }
          const result = registerAccount(account)
          if (!result.success) {
            setIsSubmitting(false)
            toast.error(result.message)
            return
          }
          localStorage.setItem('opc-registration-draft', JSON.stringify(account))
        }
        setIsSubmitting(false)
        toast.success('注册申请已提交，请等待后台审核后登录')
        setTimeout(() => navigate('/login'), 2000)
      }, 1500)
    },
    [basicData, industryData, navigate, registerAccount, resolveInviteCode],
  )

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 size-80 rounded-full bg-indigo-400/20 blur-[120px] dark:bg-indigo-500/15" />
        <div className="absolute -bottom-24 left-1/4 size-72 rounded-full bg-cyan-400/15 blur-[110px] dark:bg-cyan-500/10" />
        <div className="absolute top-1/3 right-1/4 size-56 rounded-full bg-amber-400/10 blur-[90px] dark:bg-amber-500/8" />
      </div>

      <div className="relative z-10 flex min-h-svh items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-border/50 bg-background/60 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background">
              <Zap className="size-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">渠道合伙人注册</h1>
            <p className="max-w-xs text-center text-[12px] leading-relaxed text-muted-foreground">
              提交后进入后台合伙人审核，通过后生成系统账号用于登录。
            </p>

            <div className="flex items-center gap-2 pt-1">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full text-[11px] font-medium transition-colors',
                      i <= step ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {i + 1}
                  </div>
                  <span className={cn('text-[11px] hidden sm:inline', i <= step ? 'text-foreground' : 'text-muted-foreground')}>
                    {label}
                  </span>
                  {i < stepLabels.length - 1 && (
                    <div className={cn('h-px w-5 transition-colors', i < step ? 'bg-foreground' : 'bg-border')} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {step === 0 && <StepBasicInfo defaultValues={basicData ?? (inviteCodeFromUrl ? { inviteCode: inviteCodeFromUrl } : undefined)} onNext={handleBasic} />}
          {step === 1 && <StepIndustry defaultValues={industryData} onNext={handleIndustry} onBack={() => setStep(0)} />}
          {step === 2 && <StepTags defaultValues={tagsData} onSubmit={handleSubmit} onBack={() => setStep(1)} isSubmitting={isSubmitting} />}

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-5 w-full text-center text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            已有账号？返回登录
          </button>
        </div>
      </div>
    </div>
  )
}
