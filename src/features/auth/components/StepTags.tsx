import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ResourceSurvey } from '@/types'

const resourceOptions = [
  '人大代表', '政协委员', '行业协会', '商学院', '协会圈子',
  '央企资源', '地方国企', '上市公司关系', '金融机构', '媒体资源',
]

interface Props {
  defaultValues?: { resources: string[]; survey?: ResourceSurvey }
  onSubmit: (resources: string[], survey: ResourceSurvey) => void
  onBack: () => void
  isSubmitting: boolean
}

export function StepTags({ defaultValues, onSubmit, onBack, isSubmitting }: Props) {
  const [selected, setSelected] = useState<string[]>(defaultValues?.resources ?? [])
  const [keyPositions, setKeyPositions] = useState(defaultValues?.survey?.keyPositions ?? '')
  const [publicRoles, setPublicRoles] = useState(defaultValues?.survey?.publicRoles ?? '')
  const [associationCircles, setAssociationCircles] = useState(defaultValues?.survey?.associationCircles ?? '')
  const [notes, setNotes] = useState(defaultValues?.survey?.notes ?? '')
  const [error, setError] = useState('')

  const toggle = (tag: string) => {
    setError('')
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const handleSubmit = () => {
    if (selected.length === 0) {
      setError('请至少选择一个资源标签')
      return
    }
    onSubmit(selected, {
      resourceTypes: selected,
      keyPositions,
      publicRoles,
      associationCircles,
      notes,
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>擅长资源类型（可多选）</Label>
        <div className="flex flex-wrap gap-2">
          {resourceOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                selected.includes(tag)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50',
              )}
            >
              {tag}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <div className="space-y-2">
        <Label>关键资源岗位</Label>
        <Input value={keyPositions} onChange={(event) => setKeyPositions(event.target.value)} placeholder="如：设备科长、能源管理部、园区管委会、采购负责人" />
      </div>
      <div className="space-y-2">
        <Label>人大/政协等公共职务经历</Label>
        <Input value={publicRoles} onChange={(event) => setPublicRoles(event.target.value)} placeholder="如：区政协委员、市人大代表、青联委员" />
      </div>
      <div className="space-y-2">
        <Label>商会/协会圈子</Label>
        <Input value={associationCircles} onChange={(event) => setAssociationCircles(event.target.value)} placeholder="如：节能协会、温州商会、EMBA同学会" />
      </div>
      <div className="space-y-2">
        <Label>资源补充说明</Label>
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="说明最擅长切入的行业、地区或客户角色" className="min-h-20" />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>上一步</Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? '提交中...' : '提交注册'}
        </Button>
      </div>
    </div>
  )
}
