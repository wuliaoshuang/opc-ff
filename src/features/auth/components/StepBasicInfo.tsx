import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { stepBasicSchema, type StepBasicData } from '../schemas'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const regions = ['北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '南京', '长沙', '青岛', '大连', '珠海']
const workTypes = ['企业主', '渠道商', '独立顾问', '行业协会', '政府机关', '其他']

interface Props {
  defaultValues?: Partial<StepBasicData>
  onNext: (data: StepBasicData) => void
}

export function StepBasicInfo({ defaultValues, onNext }: Props) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<StepBasicData>({
    resolver: zodResolver(stepBasicSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div className="space-y-2">
        <Label>姓名</Label>
        <Input placeholder="请输入姓名" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>手机号</Label>
        <Input placeholder="请输入11位手机号" {...register('phone')} />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>区域</Label>
        <Select onValueChange={(v) => v && setValue('region', v)} defaultValue={defaultValues?.region}>
          <SelectTrigger><SelectValue placeholder="请选择区域" /></SelectTrigger>
          <SelectContent>
            {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.region && <p className="text-sm text-destructive">{errors.region.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>工作类型</Label>
        <Select onValueChange={(v) => v && setValue('workType', v)} defaultValue={defaultValues?.workType}>
          <SelectTrigger><SelectValue placeholder="请选择工作类型" /></SelectTrigger>
          <SelectContent>
            {workTypes.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.workType && <p className="text-sm text-destructive">{errors.workType.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>邀请码（选填）</Label>
        <Input placeholder="如有一级合伙人邀请码请填写" {...register('inviteCode')} />
        <p className="text-[11px] text-muted-foreground">填写后会先校验上级合伙人，通过审核后自动成为其二级合伙人</p>
        {errors.inviteCode && <p className="text-sm text-destructive">{errors.inviteCode.message}</p>}
      </div>
      <Button type="submit" className="w-full">下一步</Button>
    </form>
  )
}
