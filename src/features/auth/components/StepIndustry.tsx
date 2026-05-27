import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { stepIndustrySchema, type StepIndustryData } from '../schemas'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const markets = ['综合能源', '光伏发电', '储能系统', '节能服务', '能效诊断', '碳管理']
const industries = ['制造业', '化工', '钢铁', '建材', '食品加工', '纺织', '电力', '农业', '新能源', '有色金属']

interface Props {
  defaultValues?: Partial<StepIndustryData>
  onNext: (data: StepIndustryData) => void
  onBack: () => void
}

export function StepIndustry({ defaultValues, onNext, onBack }: Props) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<StepIndustryData>({
    resolver: zodResolver(stepIndustrySchema),
    defaultValues,
  })

  const readFile = (field: 'businessCardUrl' | 'idCardImageUrl', file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) setValue(field, String(event.target.result), { shouldDirty: true })
    }
    reader.readAsDataURL(file)
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div className="space-y-2">
        <Label>从业市场</Label>
        <Select onValueChange={(v) => v && setValue('market', v)} defaultValue={defaultValues?.market}>
          <SelectTrigger><SelectValue placeholder="请选择从业市场" /></SelectTrigger>
          <SelectContent>
            {markets.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.market && <p className="text-sm text-destructive">{errors.market.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>所属行业</Label>
        <Select onValueChange={(v) => v && setValue('industry', v)} defaultValue={defaultValues?.industry}>
          <SelectTrigger><SelectValue placeholder="请选择所属行业" /></SelectTrigger>
          <SelectContent>
            {industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.industry && <p className="text-sm text-destructive">{errors.industry.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>身份证号</Label>
        <Input placeholder="请输入18位身份证号" maxLength={18} {...register('idCard')} />
        {errors.idCard && <p className="text-sm text-destructive">{errors.idCard.message}</p>}
        <p className="text-[11px] text-muted-foreground">原型内完成格式校验并标记为已验证，正式接入时替换为实名核验接口。</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>名片上传</Label>
          <Input type="file" accept="image/*" onChange={(event) => readFile('businessCardUrl', event.target.files?.[0])} />
          <p className="text-[11px] text-muted-foreground">原型仅保存本地预览</p>
        </div>
        <div className="space-y-2">
          <Label>身份证上传</Label>
          <Input type="file" accept="image/*" onChange={(event) => readFile('idCardImageUrl', event.target.files?.[0])} />
          <p className="text-[11px] text-muted-foreground">原型仅保存本地预览</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>上一步</Button>
        <Button type="submit" className="flex-1">下一步</Button>
      </div>
    </form>
  )
}
