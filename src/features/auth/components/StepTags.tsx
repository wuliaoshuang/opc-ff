import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const resourceOptions = [
  '人大代表', '政协委员', '行业协会', '商学院', '协会圈子',
  '央企资源', '地方国企', '上市公司关系', '金融机构', '媒体资源',
]

interface Props {
  defaultValues?: string[]
  onSubmit: (resources: string[]) => void
  onBack: () => void
  isSubmitting: boolean
}

export function StepTags({ defaultValues = [], onSubmit, onBack, isSubmitting }: Props) {
  const [selected, setSelected] = useState<string[]>(defaultValues)
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
    onSubmit(selected)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>特定资源标签（可多选）</Label>
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
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>上一步</Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? '提交中...' : '提交注册'}
        </Button>
      </div>
    </div>
  )
}
