import { useState, useCallback, useMemo } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrainingResource } from '@/types'

const categoryLabels: Record<TrainingResource['category'], string> = {
  process: '开发流程', knowledge: '专业知识', qa: '常见问题', script: '常用话术', ai: 'AI知识库',
}
const typeLabels: Record<TrainingResource['type'], string> = { doc: '文档', video: '视频', faq: 'FAQ' }

export default function TrainingPage() {
  const resources = useStore((s) => s.trainingResources)
  const [selected, setSelected] = useState<TrainingResource | null>(null)
  const [search, setSearch] = useState('')
  const [qaInput, setQaInput] = useState('')
  const [qaAnswer, setQaAnswer] = useState('')
  const [qaLoading, setQaLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<TrainingResource['category']>('process')

  const publishedResources = useMemo(() => resources
    .filter((r) => (r.status ?? 'published') === 'published')
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)), [resources])

  const filtered = (cat: string) => publishedResources.filter((r) =>
    r.category === cat && (!search || `${r.title}${r.summary}${r.content}`.includes(search))
  )

  const handleQa = useCallback(() => {
    if (!qaInput.trim()) return
    setQaLoading(true)
    setTimeout(() => {
      const matched = publishedResources.find((r) => `${r.title}${r.summary}${r.content}`.includes(qaInput.trim()))
      setQaAnswer(`关于"${qaInput}"的解答：\n\n${matched ? `参考资料：《${matched.title}》。${matched.summary}` : '当前知识库未命中完全匹配条目，以下为通用业务建议。'}\n\n1. 先确认客户用能现状、屋顶/负荷/设备痛点和决策链\n2. 用当地政策、同行案例和投资回收期降低首次沟通门槛\n3. 将客户动作沉淀到CRM，按30/60/180天规则推进\n4. 需要话术时可切换到“常用话术”分类复用模板`)
      setQaLoading(false)
    }, 2000)
  }, [qaInput, publishedResources])

  return (
    <div>
      <PageHeader title="培训系统" description="项目开发技巧、专业知识和AI答疑" />
      <Input placeholder="搜索培训资源..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm mb-4 w-full" />

      <div className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-muted/70 p-1 sm:grid-cols-3 lg:flex lg:w-fit lg:max-w-full lg:flex-wrap">
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveCategory(key as TrainingResource['category'])}
            className={cn(
              'min-w-0 rounded-xl px-2 py-2 text-center text-[12px] font-medium leading-tight transition-colors',
              activeCategory === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/70',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered(activeCategory).map((r) => (
          <Card key={r.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setSelected(r)}>
            <CardContent className="pt-4">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="text-sm font-medium leading-tight">{r.title}</h3>
                <Badge variant="outline" className="ml-2 shrink-0">{typeLabels[r.type]}</Badge>
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{r.summary}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-6" />
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><MessageCircle className="h-4 w-4" />AI 答疑</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="输入你的问题，例如：什么是综合能源服务？" value={qaInput} onChange={(e) => setQaInput(e.target.value)} />
            <Button onClick={handleQa} disabled={qaLoading} className="shrink-0">{qaLoading ? '思考中...' : 'AI 解答'}</Button>
          </div>
          {qaAnswer && <div className="rounded-md bg-muted p-4 text-sm whitespace-pre-line">{qaAnswer}</div>}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        {selected && (
          <DialogContent>
            <DialogHeader><DialogTitle>{selected.title}</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <div className="flex gap-2"><Badge variant="outline">{typeLabels[selected.type]}</Badge><Badge variant="secondary">{categoryLabels[selected.category]}</Badge></div>
              <p className="text-sm text-muted-foreground">{selected.summary}</p>
              <Separator />
              <div className="text-sm whitespace-pre-line">{selected.content}</div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
