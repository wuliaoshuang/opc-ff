import { useState } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { CheckCircle2, Search, Upload, XCircle, Zap } from 'lucide-react'
import type { WhiteLabelConfig } from '@/types'

const auditLabels: Record<WhiteLabelConfig['auditStatus'], string> = {
  draft: '未提交',
  pending: '审核中',
  approved: '已通过',
  rejected: '已驳回',
}

const auditVariant: Record<WhiteLabelConfig['auditStatus'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  pending: 'outline',
  approved: 'default',
  rejected: 'destructive',
}

export default function WhiteLabelPage() {
  const partners = useStore((s) => s.partners)
  const configs = useStore((s) => s.whiteLabelConfigs)
  const setPartnerConfig = useStore((s) => s.setPartnerWhiteLabelConfig)

  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<WhiteLabelConfig | null>(null)

  const filtered = partners.filter((p) =>
    p.partnerName.includes(search) || p.region.includes(search)
  )

  const handleSelect = (partnerId: string) => {
    const partnerName = partners.find((p) => p.partnerId === partnerId)?.partnerName ?? ''
    const existing = configs[partnerId] ?? {
      partnerId,
      partnerName,
      systemName: '',
      logoUrl: '',
      primaryColor: '#3730a3',
      contactEmail: '',
      auditStatus: 'draft' as const,
    }
    setSelectedId(partnerId)
    setForm({ ...existing })
  }

  const handleLogoUpload = (file?: File) => {
    if (!file || !form) return
    if (!file.type.startsWith('image/')) { toast.error('Logo 仅支持图片格式'); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) setForm((f) => f ? { ...f, logoUrl: String(e.target!.result) } : f)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!form || !selectedId) return
    if (!form.systemName.trim()) { toast.error('品牌名称不能为空'); return }
    const next: WhiteLabelConfig = {
      ...form,
      auditStatus: form.auditStatus === 'draft' ? 'pending' : form.auditStatus,
      auditNote: form.auditStatus === 'draft' ? '管理员已代为提交配置' : form.auditNote,
    }
    setPartnerConfig(selectedId, next)
    setForm(next)
    toast.success('配置已保存')
  }

  const handleAudit = (approved: boolean) => {
    if (!form || !selectedId) return
    const next: WhiteLabelConfig = {
      ...form,
      auditStatus: approved ? 'approved' : 'rejected',
      auditNote: approved
        ? '平台审核通过，品牌已生效'
        : '平台审核驳回，请检查品牌信息后重新提交',
      approvedSnapshot: approved
        ? { systemName: form.systemName, logoUrl: form.logoUrl, primaryColor: form.primaryColor }
        : form.approvedSnapshot,
    }
    setPartnerConfig(selectedId, next)
    setForm(next)
    toast[approved ? 'success' : 'error'](approved ? '已审核通过' : '已驳回')
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader title="贴牌配置" description="选择合伙人，查看或编辑其品牌配置" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        <Card className="rounded-2xl border-border/70 shadow-none lg:h-fit">
          <CardContent className="p-3">
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-[13px]"
                placeholder="搜索合伙人..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-0.5">
              {filtered.map((p) => {
                const cfg = configs[p.partnerId]
                const status = cfg?.auditStatus ?? 'draft'
                return (
                  <button
                    key={p.partnerId}
                    type="button"
                    onClick={() => handleSelect(p.partnerId)}
                    className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors ${
                      selectedId === p.partnerId
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">{p.partnerName}</p>
                        <p className="text-[11px] text-muted-foreground">{p.region}</p>
                      </div>
                      <Badge variant={auditVariant[status]} className="shrink-0 px-1.5 text-[10px]">
                        {auditLabels[status]}
                      </Badge>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {form && selectedId ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card className="rounded-2xl border-border/70 shadow-none">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {form.partnerName} 的品牌配置
                  </p>
                  <Badge variant={auditVariant[form.auditStatus]}>
                    {auditLabels[form.auditStatus]}
                  </Badge>
                </div>
                <Separator />

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">品牌名称</Label>
                  <Input
                    value={form.systemName}
                    onChange={(e) => setForm({ ...form, systemName: e.target.value })}
                    placeholder="如：张伟综合能源"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Logo URL</Label>
                  <Input
                    placeholder="https://example.com/logo.png"
                    value={form.logoUrl}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  />
                  <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-[13px] text-muted-foreground transition-colors hover:bg-muted/50">
                    <Upload className="size-4" />
                    上传本地 Logo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
                  </label>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">主色调</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded border"
                    />
                    <Input
                      value={form.primaryColor}
                      onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">联系邮箱</Label>
                  <Input
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    placeholder="partner@email.com"
                  />
                </div>

                {form.auditNote && (
                  <div className="rounded-lg bg-muted/50 p-3 text-[12px] text-muted-foreground">
                    {form.auditNote}
                  </div>
                )}

                <Button onClick={handleSave} className="w-full">保存配置</Button>

                {form.auditStatus === 'pending' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => handleAudit(false)}
                    >
                      <XCircle className="size-3.5" /> 驳回
                    </Button>
                    <Button className="gap-1.5" onClick={() => handleAudit(true)}>
                      <CheckCircle2 className="size-3.5" /> 审核通过
                    </Button>
                  </div>
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
                    <p className="mt-1 text-sm text-muted-foreground">{form.contactEmail || 'email'}</p>
                  </div>
                  <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: form.primaryColor }} />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="rounded-2xl border-border/70 shadow-none">
            <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                <Zap className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">选择合伙人</p>
                <p className="mt-1 text-xs text-muted-foreground">从左侧列表选择一位合伙人，查看或编辑其品牌配置</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
