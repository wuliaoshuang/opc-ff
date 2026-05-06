import { useState } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CheckCircle2, Upload, XCircle, Zap } from 'lucide-react'

export default function WhiteLabelPage() {
  const config = useStore((s) => s.whiteLabelConfig)
  const setConfig = useStore((s) => s.setWhiteLabelConfig)
  const [form, setForm] = useState(config)

  const handleSave = () => {
    if (!form.systemName.trim()) { toast.error('系统名称不能为空'); return }
    setConfig({ ...form, auditStatus: 'pending', auditNote: '已提交平台审核，审核通过后面向本地OPC申请场景展示' })
    setForm((current) => ({ ...current, auditStatus: 'pending', auditNote: '已提交平台审核，审核通过后面向本地OPC申请场景展示' }))
    toast.success('贴牌配置已保存并提交审核')
  }

  const handleAudit = (approved: boolean) => {
    const next = {
      ...form,
      auditStatus: approved ? 'approved' as const : 'rejected' as const,
      auditNote: approved
        ? '平台审核通过，贴牌名称、Logo 和主色可用于本地OPC申请场景。'
        : '平台审核驳回，请检查系统命名、Logo 清晰度和联系信息后重新提交。',
    }
    setConfig(next)
    setForm(next)
    toast[approved ? 'success' : 'error'](approved ? '贴牌配置已审核通过' : '贴牌配置已驳回')
  }

  const handleLogoUpload = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Logo 仅支持图片格式')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) setForm({ ...form, logoUrl: String(event.target.result) })
    }
    reader.readAsDataURL(file)
  }

  const auditLabels = {
    draft: '草稿',
    pending: '审核中',
    approved: '已通过',
    rejected: '已驳回',
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader title="贴牌配置" description="自定义系统名称、Logo 和本地OPC品牌外观" />
      <section className="grid grid-cols-3 gap-2">
        {[
          { label: '审核状态', value: auditLabels[form.auditStatus] },
          { label: '系统名称', value: form.systemName || '未填写' },
          { label: '主色调', value: form.primaryColor },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border bg-card p-3">
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
            <p className="mt-1 truncate text-sm font-semibold">{item.value}</p>
          </div>
        ))}
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">品牌设置</CardTitle>
              <Badge variant={form.auditStatus === 'approved' ? 'default' : form.auditStatus === 'rejected' ? 'destructive' : 'outline'}>
                {auditLabels[form.auditStatus]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>系统名称</Label>
              <Input value={form.systemName} onChange={(e) => setForm({ ...form, systemName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input placeholder="https://example.com/logo.png" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
              <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-[13px] text-muted-foreground transition-colors hover:bg-muted/50">
                <Upload className="size-4" />
                上传本地 Logo
                <input type="file" accept="image/*" className="hidden" onChange={(event) => handleLogoUpload(event.target.files?.[0])} />
              </label>
            </div>
            <div className="space-y-2">
              <Label>主色调</Label>
              <div className="flex gap-2">
                <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="h-9 w-12 rounded border cursor-pointer" />
                <Input value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>联系邮箱</Label>
              <Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-[12px] text-muted-foreground">
              {form.auditNote ?? '贴牌仅开放给符合要求的城市合伙人，保存后进入平台审核。'}
            </div>
            <Button onClick={handleSave} className="w-full">保存配置</Button>
            {form.auditStatus === 'pending' && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => handleAudit(false)}>
                  <XCircle className="size-3.5" /> 驳回
                </Button>
                <Button className="gap-1.5" onClick={() => handleAudit(true)}>
                  <CheckCircle2 className="size-3.5" /> 审核通过
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">预览</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg border p-6 text-center space-y-4" style={{ borderColor: `${form.primaryColor}33` }}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl" style={{ backgroundColor: form.primaryColor }}>
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="h-10 w-10 object-contain" />
                ) : (
                  <Zap className="h-8 w-8 text-white" />
                )}
              </div>
              <h2 className="text-lg font-semibold">{form.systemName || '系统名称'}</h2>
              <p className="text-sm text-muted-foreground">{form.contactEmail}</p>
              <div className="h-2 rounded-full" style={{ backgroundColor: form.primaryColor }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
