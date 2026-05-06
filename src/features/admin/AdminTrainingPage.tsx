import { useMemo, useState } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { BookOpen, Eye, FilePlus2, Library, Search, Trash2 } from 'lucide-react'
import { formatListTime, sortByNewest } from '@/lib/time'
import type { TrainingResource } from '@/types'

const categoryLabels: Record<TrainingResource['category'], string> = {
  process: '开发流程',
  knowledge: '专业知识',
  qa: '常见QA',
  script: '资料话术',
  ai: 'AI知识库',
}

const typeLabels: Record<TrainingResource['type'], string> = {
  doc: '文档',
  video: '视频',
  faq: 'FAQ',
}

const statusLabels = {
  draft: '草稿',
  published: '已发布',
  archived: '已下架',
}

type ResourceForm = Pick<TrainingResource, 'title' | 'category' | 'type' | 'summary' | 'content' | 'status'>

const emptyForm: ResourceForm = {
  title: '',
  category: 'process',
  type: 'doc',
  summary: '',
  content: '',
  status: 'published',
}

export default function AdminTrainingPage() {
  const resources = useStore((s) => s.trainingResources)
  const addResource = useStore((s) => s.addTrainingResource)
  const updateResource = useStore((s) => s.updateTrainingResource)
  const deleteResource = useStore((s) => s.deleteTrainingResource)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'all' | TrainingResource['category']>('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<TrainingResource | null>(null)
  const [form, setForm] = useState<ResourceForm>(emptyForm)

  const normalized = useMemo(() => resources.map((item, index) => ({
    ...item,
    status: item.status ?? 'published' as const,
    updatedAt: item.updatedAt ?? '2026-05-06',
    createdBy: item.createdBy ?? '系统',
    sortOrder: item.sortOrder ?? index + 1,
  })), [resources])

  const filtered = useMemo(() => sortByNewest(normalized, (item) => item.updatedAt).filter((item) => {
    const keywordHit = !search || `${item.title}${item.summary}${item.content}`.includes(search)
    const categoryHit = category === 'all' || item.category === category
    return keywordHit && categoryHit
  }), [normalized, search, category])

  const openEditor = (resource?: TrainingResource) => {
    if (resource) {
      setEditing(resource)
      setForm({
        title: resource.title,
        category: resource.category,
        type: resource.type,
        summary: resource.summary,
        content: resource.content,
        status: resource.status ?? 'published',
      })
    } else {
      setEditing(null)
      setForm(emptyForm)
    }
    setEditorOpen(true)
  }

  const save = () => {
    if (!form.title.trim() || !form.summary.trim() || !form.content.trim()) {
      toast.error('请补全标题、摘要和正文')
      return
    }
    const now = new Date().toISOString().split('T')[0]
    if (editing) {
      updateResource(editing.id, { ...form, updatedAt: now, createdBy: editing.createdBy ?? '管理员' })
      toast.success('培训内容已更新，合伙人端同步生效')
    } else {
      addResource({ id: `tr-admin-${Date.now()}`, ...form, updatedAt: now, createdBy: '管理员', sortOrder: resources.length + 1 })
      toast.success('培训内容已创建')
    }
    setEditing(null)
    setEditorOpen(false)
  }

  const publishCount = normalized.filter((item) => item.status === 'published').length
  const draftCount = normalized.filter((item) => item.status === 'draft').length
  const aiCount = normalized.filter((item) => item.category === 'ai' && item.status === 'published').length

  return (
    <div className="space-y-5">
      <PageHeader
        title="培训内容管理"
        description="管理开发流程、专业知识、QA、话术资料和AI知识库"
        action={<Button size="sm" className="gap-1.5" onClick={() => openEditor()}><FilePlus2 className="size-4" /> 新增内容</Button>}
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard title="已发布" value={publishCount} icon={BookOpen} />
        <StatCard title="草稿" value={draftCount} icon={FilePlus2} />
        <StatCard title="AI知识" value={aiCount} icon={Library} />
      </div>

      <section className="rounded-2xl border bg-card p-3">
        <div className="grid gap-2 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="搜索标题、摘要、正文" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Select value={category} onValueChange={(value) => setCategory(value as 'all' | TrainingResource['category'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {Object.entries(categoryLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        {filtered.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.title}</p>
                    <Badge variant={item.status === 'published' ? 'default' : 'outline'}>{statusLabels[item.status]}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>
                </div>
                <Badge variant="secondary" className="shrink-0">{categoryLabels[item.category]}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{typeLabels[item.type]} · 更新 {formatListTime(item.updatedAt)} · {item.createdBy}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => openEditor(item)}><Eye className="size-3.5" /> 编辑</Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1 text-destructive hover:text-destructive" onClick={() => { deleteResource(item.id); toast.warning('培训内容已删除') }}><Trash2 className="size-3.5" /> 删除</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={editorOpen} onOpenChange={(open) => { setEditorOpen(open); if (!open) { setEditing(null); setForm(emptyForm) } }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>{editing ? '编辑培训内容' : '新增培训内容'}</SheetTitle></SheetHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>标题</Label>
              <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="例如：项目现场拜访SOP" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>分类</Label>
                <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as TrainingResource['category'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(categoryLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>类型</Label>
                <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as TrainingResource['type'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>发布状态</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as TrainingResource['status'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">发布到合伙人端</SelectItem>
                  <SelectItem value="draft">保存为草稿</SelectItem>
                  <SelectItem value="archived">下架隐藏</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>摘要</Label>
              <Textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>正文 / 资料内容</Label>
              <Textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={8} />
            </div>
            <Separator />
            <Button className="w-full" onClick={save}>保存并同步</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
