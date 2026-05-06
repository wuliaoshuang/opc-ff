import { useState } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle2, Clock, Upload, XCircle, Zap } from 'lucide-react'
import type { WhiteLabelConfig } from '@/types'

const DEFAULT_COLOR = '#3730a3'

export default function PartnerWhiteLabelPage() {
  const user = useStore((s) => s.user)
  const configs = useStore((s) => s.whiteLabelConfigs)
  const setPartnerConfig = useStore((s) => s.setPartnerWhiteLabelConfig)

  if (!user) return null

  const existing = configs[user.id]
  const initial: WhiteLabelConfig = existing ?? {
    partnerId: user.id,
    partnerName: user.name,
    systemName: '',
    logoUrl: '',
    primaryColor: DEFAULT_COLOR,
    contactEmail: '',
    auditStatus: 'draft',
  }

  const [form, setForm] = useState<WhiteLabelConfig>(initial)
  const isPending = form.auditStatus === 'pending'

  const handleLogoUpload = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Logo 仅支持图片格式'); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) setForm((f) => ({ ...f, logoUrl: String(e.target!.result) }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!form.systemName.trim()) { toast.error('品牌名称不能为空'); return }
    if (!form.contactEmail.trim()) { toast.error('联系邮箱不能为空'); return }
    const next: WhiteLabelConfig = {
      ...form,
      partnerId: user.id,
      partnerName: user.name,
      auditStatus: 'pending',
      auditNote: '已提交平台审核，审核通过后品牌即可生效',
    }
    setPartnerConfig(user.id, next)
    setForm(next)
    toast.success('已提交审核，请耐心等待')
  }

  const statusBanner = {
    draft: { bg: 'bg-muted', text: 'text-muted-foreground', icon: null, msg: '尚未提交，填写品牌信息后点击"提交审核"' },
    pending: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', icon: Clock, msg: '审核中，平台将在1-3个工作日内完成审核' },
    approved: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle2, msg: '审核通过，品牌已生效' },
    rejected: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', icon: XCircle, msg: form.auditNote ?? '审核未通过，请修改后重新提交' },
  }[form.auditStatus]

  const StatusIcon = statusBanner.icon

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader title="品牌自定义" description="打造属于你的专属品牌形象，提交后等待平台审核" />

      <div className={`flex items-start gap-2.5 rounded-2xl p-3.5 ${statusBanner.bg}`}>
        {StatusIcon && <StatusIcon className={`mt-0.5 size-4 shrink-0 ${statusBanner.text}`} />}
        <p className={`text-[13px] leading-relaxed ${statusBanner.text}`}>{statusBanner.msg}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/70 shadow-none">
          <CardContent className="space-y-4 p-4">
            <p className="text-sm font-semibold">品牌设置</p>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">品牌名称</Label>
              <Input
                value={form.systemName}
                onChange={(e) => setForm({ ...form, systemName: e.target.value })}
                placeholder="如：张伟综合能源"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Logo</Label>
              <Input
                placeholder="https://example.com/logo.png"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                disabled={isPending}
              />
              {!isPending && (
                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-[13px] text-muted-foreground transition-colors hover:bg-muted/50">
                  <Upload className="size-4" />
                  上传本地 Logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">主色调</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded border disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isPending}
                />
                <Input
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="flex-1"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">联系邮箱</Label>
              <Input
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="your@email.com"
                disabled={isPending}
              />
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
              {isPending ? '审核中，无法修改' : '提交审核'}
            </Button>

            {form.auditStatus === 'rejected' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setForm((f) => ({ ...f, auditStatus: 'draft', auditNote: undefined }))}
              >
                重新编辑
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-none">
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-4">效果预览</p>
            <div
              className="rounded-2xl border p-6 text-center space-y-4"
              style={{ borderColor: `${form.primaryColor}33` }}
            >
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
                style={{ backgroundColor: form.primaryColor }}
              >
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="h-10 w-10 object-contain" />
                ) : (
                  <Zap className="h-8 w-8 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{form.systemName || '品牌名称'}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{form.contactEmail || 'your@email.com'}</p>
              </div>
              <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: form.primaryColor }} />
              <p className="text-[11px] text-muted-foreground">品牌预览效果</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
