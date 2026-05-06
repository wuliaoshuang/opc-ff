import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { CrmProject } from '@/types'

const schema = z.object({
  companyName: z.string().min(2, '请输入公司名称'),
  industry: z.string().min(1, '请选择行业'),
  contactName: z.string().optional(),
  contactRole: z.string().optional(),
  contactPhone: z.string().optional(),
  note: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const industries = ['制造业', '化工', '钢铁', '建材', '食品加工', '纺织', '电力', '农业', '新能源', '有色金属']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (project: CrmProject) => void
}

export function AddProjectDialog({ open, onOpenChange, onSubmit }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const handle = (data: FormData) => {
    setSubmitting(true)
    const now = new Date().toISOString().split('T')[0]
    const oneMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    const twoMonth = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]

    const project: CrmProject = {
      id: `crm-${Date.now()}`,
      companyName: data.companyName,
      industry: data.industry,
      stage: data.contactName ? 'contact_filled' : 'applied',
      appliedAt: now,
      contactDeadline: oneMonth,
      meetingDeadline: twoMonth,
      isExclusive: false,
      isOverdue: false,
      source: 'manual',
      contactPerson: data.contactName ? {
        name: data.contactName,
        role: data.contactRole ?? '',
        phone: data.contactPhone ?? '',
        trustLevel: 5,
        decisionLevel: 5,
      } : undefined,
      followupLogs: [
        { date: now, action: '主动登记项目', result: data.note || '等待对接' },
        ...(data.contactName ? [{ date: now, action: '填写对接人', result: `${data.contactName}（${data.contactRole ?? '未知角色'}）` }] : []),
      ],
    }

    setTimeout(() => {
      onSubmit(project)
      setSubmitting(false)
      reset()
      onOpenChange(false)
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>主动登记新项目</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handle)} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[13px]">公司名称 *</Label>
            <Input placeholder="输入目标公司名称" className="h-10" {...register('companyName')} />
            {errors.companyName && <p className="text-[12px] text-destructive">{errors.companyName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-[13px]">所属行业 *</Label>
            <Select onValueChange={(v) => v && setValue('industry', String(v))}>
              <SelectTrigger className="h-10"><SelectValue placeholder="选择行业" /></SelectTrigger>
              <SelectContent>{industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
            {errors.industry && <p className="text-[12px] text-destructive">{errors.industry.message}</p>}
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-[12px] font-medium text-muted-foreground">对接人信息（可选，填写后自动跳过申请阶段）</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">姓名</Label>
                <Input placeholder="对接人姓名" className="h-9 text-[13px]" {...register('contactName')} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">角色</Label>
                <Input placeholder="如：设备科长" className="h-9 text-[13px]" {...register('contactRole')} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">电话</Label>
              <Input placeholder="对接人电话" className="h-9 text-[13px]" {...register('contactPhone')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">备注</Label>
            <Input placeholder="项目背景或备忘" className="h-10" {...register('note')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin mr-1.5" />}
              登记项目
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
