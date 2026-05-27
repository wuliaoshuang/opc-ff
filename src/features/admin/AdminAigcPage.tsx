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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { CopyCheck, FilePlus2, History, Sparkles, Star, Trash2 } from 'lucide-react'
import { formatListTime, sortByNewest } from '@/lib/time'
import type { AigcHistory, AigcTemplate } from '@/types'

const typeLabels: Record<AigcTemplate['type'], string> = {
  policy: '政策解读',
  case: '案例讲解',
  opportunity: '行业机会',
}

const statusLabels = {
  draft: '草稿',
  active: '启用',
  archived: '停用',
}

type TemplateForm = Pick<AigcTemplate, 'title' | 'type' | 'promptTemplate' | 'outputStructure' | 'status'>

const emptyForm: TemplateForm = {
  title: '',
  type: 'policy',
  promptTemplate: '',
  outputStructure: '',
  status: 'active',
}

export default function AdminAigcPage() {
  const templates = useStore((s) => s.aigcTemplates)
  const history = useStore((s) => s.aigcHistory)
  const addTemplate = useStore((s) => s.addAigcTemplate)
  const updateTemplate = useStore((s) => s.updateAigcTemplate)
  const deleteTemplate = useStore((s) => s.deleteAigcTemplate)
  const deleteHistory = useStore((s) => s.deleteAigcHistory)
  const toggleExample = useStore((s) => s.toggleAigcExample)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<AigcTemplate | null>(null)
  const [form, setForm] = useState<TemplateForm>(emptyForm)
  const [typeFilter, setTypeFilter] = useState<'all' | AigcTemplate['type']>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | AigcTemplate['status']>('all')
  const [deleteTarget, setDeleteTarget] = useState<AigcTemplate | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const filteredTemplates = useMemo(() => sortByNewest(templates, (item) => item.updatedAt).filter((item) => {
    const typeHit = typeFilter === 'all' || item.type === typeFilter
    const statusHit = statusFilter === 'all' || item.status === statusFilter
    return typeHit && statusHit
  }), [templates, typeFilter, statusFilter])

  const activeCount = templates.filter((item) => item.status === 'active').length
  const missingTypes = (Object.keys(typeLabels) as AigcTemplate['type'][]).filter((type) =>
    !templates.some((item) => item.type === type && item.status === 'active'),
  )
  const exampleCount = history.filter((item) => item.isExample).length

  const openEditor = (template?: AigcTemplate) => {
    if (template) {
      setEditing(template)
      setForm({
        title: template.title,
        type: template.type,
        promptTemplate: template.promptTemplate,
        outputStructure: template.outputStructure,
        status: template.status,
      })
    } else {
      setEditing(null)
      setForm(emptyForm)
    }
    setEditorOpen(true)
  }

  const save = () => {
    if (!form.title.trim() || !form.promptTemplate.trim() || !form.outputStructure.trim()) {
      toast.error('请补全标题、提示词模板和输出结构')
      return
    }
    const now = new Date().toISOString().split('T')[0]
    if (editing) {
      updateTemplate(editing.id, { ...form, updatedAt: now })
      toast.success('AIGC模板已更新，合伙人端生成规则同步生效')
    } else {
      addTemplate({ id: `tpl-admin-${Date.now()}`, ...form, updatedAt: now })
      toast.success('AIGC模板已创建')
    }
    setEditorOpen(false)
    setEditing(null)
  }

  const removeTemplate = (template: AigcTemplate) => {
    if (deleteConfirm !== template.title) {
      toast.error('请输入模板标题确认删除')
      return
    }
    deleteTemplate(template.id)
    setDeleteTarget(null)
    setDeleteConfirm('')
    setEditorOpen(false)
    setEditing(null)
    toast.warning('模板已删除')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="AIGC模板管理"
        description="管理政策解读、案例讲解、行业机会的生成结构和历史样例"
        action={<Button size="sm" className="gap-1.5" onClick={() => openEditor()}><FilePlus2 className="size-4" /> 新增模板</Button>}
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard title="启用模板" value={activeCount} icon={Sparkles} />
        <StatCard title="缺失类型" value={missingTypes.length} icon={CopyCheck} changeType={missingTypes.length ? 'down' : 'neutral'} />
        <StatCard title="精选样例" value={exampleCount} icon={Star} />
      </div>

      <section className="rounded-2xl border bg-card p-3">
        <div className="grid gap-2 md:grid-cols-[220px_180px]">
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as 'all' | AigcTemplate['type'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {Object.entries(typeLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | AigcTemplate['status'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="archived">停用</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {missingTypes.length > 0 && (
          <p className="mt-2 text-xs text-amber-600">缺少启用模板：{missingTypes.map((type) => typeLabels[type]).join('、')}</p>
        )}
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="space-y-3 lg:col-span-2">
          {filteredTemplates.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{item.title}</p>
                      <Badge variant={item.status === 'active' ? 'default' : 'outline'}>{statusLabels[item.status]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{typeLabels[item.type]} · 更新 {formatListTime(item.updatedAt)}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openEditor(item)}>编辑</Button>
                </div>
                <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="mb-1 font-medium">提示词模板</p>
                    <p className="line-clamp-3 text-muted-foreground">{item.promptTemplate}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="mb-1 font-medium">输出结构</p>
                    <p className="whitespace-pre-line text-muted-foreground">{item.outputStructure}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="h-fit">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">生成历史审查</p>
              <History className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {sortByNewest(history, (item) => item.createdAt).slice(0, 8).map((item: AigcHistory) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.keyword}</p>
                      <p className="text-xs text-muted-foreground">{typeLabels[item.type]} · {formatListTime(item.createdAt)}</p>
                    </div>
                    {item.isExample && <Badge variant="secondary" className="shrink-0">样例</Badge>}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 flex-1" onClick={() => toggleExample(item.id)}>{item.isExample ? '取消样例' : '设为样例'}</Button>
                    <Button size="sm" variant="outline" className="h-8 text-destructive hover:text-destructive" onClick={() => { deleteHistory(item.id); toast.warning('历史内容已删除') }}><Trash2 className="size-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={editorOpen} onOpenChange={(open) => { setEditorOpen(open); if (!open) { setEditing(null); setForm(emptyForm) } }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>{editing ? '编辑AIGC模板' : '新增AIGC模板'}</SheetTitle></SheetHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>模板标题</Label>
              <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>内容类型</Label>
                <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as AigcTemplate['type'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>状态</Label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as AigcTemplate['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="archived">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>提示词模板</Label>
              <Textarea rows={5} value={form.promptTemplate} onChange={(event) => setForm({ ...form, promptTemplate: event.target.value })} placeholder="使用 {{keyword}} 作为合伙人输入占位符" />
            </div>
            <div className="space-y-1.5">
              <Label>输出结构</Label>
              <Textarea rows={6} value={form.outputStructure} onChange={(event) => setForm({ ...form, outputStructure: event.target.value })} placeholder="每行一个输出模块" />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              <Button className="w-full" onClick={save}>保存模板</Button>
              <Button variant="outline" className="text-destructive hover:text-destructive" disabled={!editing} onClick={() => { if (editing) { setDeleteTarget(editing); setDeleteConfirm('') } }}>删除模板</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirm('') } }}>
        {deleteTarget && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>删除AIGC模板</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-[12px] leading-relaxed text-destructive">
                删除后合伙人端将无法使用该生成规则。请输入模板标题「{deleteTarget.title}」确认删除。
              </div>
              <Input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder={deleteTarget.title} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
              <Button variant="destructive" onClick={() => removeTemplate(deleteTarget)}>确认删除</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
