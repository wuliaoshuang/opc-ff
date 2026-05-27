import { useState, useCallback, useMemo } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { SubsectionTabs } from '@/components/shared/SubsectionTabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, FileText, MessageCircle, MessageSquareText, Upload, Video } from 'lucide-react'
import type { BusinessToolFile, CrmProject, PotentialLead, TrainingResource } from '@/types'

const categoryLabels: Record<TrainingResource['category'], string> = {
  process: '开发流程', knowledge: '专业知识', qa: '常见问题', script: '常用话术', ai: 'AI知识库',
}
const typeLabels: Record<TrainingResource['type'], string> = { doc: '文档', video: '视频', faq: 'FAQ' }
const toolCategoryLabels: Record<BusinessToolFile['category'], string> = {
  manual: '项目手册',
  material: '宣传资料',
  script: '话术生成',
  qa: '业务QA',
  course: '课程回顾',
}
const toolCategoryIcons = {
  manual: BookOpen,
  material: FileText,
  script: MessageSquareText,
  qa: MessageCircle,
  course: Video,
}

function projectStatusText(project: CrmProject) {
  const filing = project.filingStatus === 'pending'
    ? '备案待审'
    : project.filingStatus === 'approved'
      ? '备案已通过'
      : project.filingStatus === 'rejected'
        ? '备案已驳回'
        : '未备案'
  const exclusive = project.isExclusive && project.exclusiveEnd ? `排他中，至 ${project.exclusiveEnd}` : '未排他'
  return `${project.companyName} 已进入个人项目表单；${filing}；${exclusive}。`
}

function leadStatusText(lead: PotentialLead) {
  const applicant = lead.appliedBy ? `已有人申请：${lead.appliedBy}` : '无人申请'
  const exclusive = lead.status === 'exclusive' ? `排他至 ${lead.exclusiveUntil ?? '待同步'}` : '未排他'
  return `${lead.companyName} 在目标项目清单中；${applicant}；${exclusive}；评级 ${lead.grade ?? 'B'}。`
}

export default function TrainingPage() {
  const resources = useStore((s) => s.trainingResources)
  const businessToolFiles = useStore((s) => s.businessToolFiles)
  const addBusinessToolFile = useStore((s) => s.addBusinessToolFile)
  const projects = useStore((s) => s.projects)
  const leads = useStore((s) => s.leads)
  const user = useStore((s) => s.user)
  const [selected, setSelected] = useState<TrainingResource | null>(null)
  const [search, setSearch] = useState('')
  const [qaInput, setQaInput] = useState('')
  const [qaAnswer, setQaAnswer] = useState('')
  const [qaLoading, setQaLoading] = useState(false)
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantAnswer, setAssistantAnswer] = useState('')
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadCategory, setUploadCategory] = useState<BusinessToolFile['category']>('manual')
  const [activeCategory, setActiveCategory] = useState<TrainingResource['category']>('process')

  const publishedResources = useMemo(() => resources
    .filter((r) => (r.status ?? 'published') === 'published')
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)), [resources])

  const filtered = (cat: string) => publishedResources.filter((r) =>
    r.category === cat && (!search || `${r.title}${r.summary}${r.content}`.includes(search))
  )
  const toolGroups = Object.entries(toolCategoryLabels).map(([category, label]) => ({
    category: category as BusinessToolFile['category'],
    label,
    files: businessToolFiles.filter((file) => file.category === category),
  }))

  const handleQa = useCallback(() => {
    if (!qaInput.trim()) return
    setQaLoading(true)
    setTimeout(() => {
      const matched = publishedResources.find((r) => `${r.title}${r.summary}${r.content}`.includes(qaInput.trim()))
      setQaAnswer(`关于"${qaInput}"的解答：\n\n${matched ? `参考资料：《${matched.title}》。${matched.summary}` : '当前知识库未命中完全匹配条目，以下为通用业务建议。'}\n\n1. 先确认客户用能现状、屋顶/负荷/设备痛点和决策链\n2. 用当地政策、同行案例和投资回收期降低首次沟通门槛\n3. 将客户动作沉淀到CRM，按30/60/180天规则推进\n4. 需要话术时可切换到"常用话术"分类复用模板`)
      setQaLoading(false)
    }, 2000)
  }, [qaInput, publishedResources])

  const handleAssistantCheck = useCallback(() => {
    const keyword = assistantInput.trim()
    if (!keyword) return
    const matchedProjects = projects.filter((project) => project.companyName.includes(keyword))
    const matchedLeads = leads.filter((lead) => lead.companyName.includes(keyword))
    if (matchedProjects.length === 0 && matchedLeads.length === 0) {
      setAssistantAnswer(`未找到「${keyword}」的跟进、备案或排他记录。建议先到目标项目清单检索，再选择跟进或一键备案。`)
      return
    }
    setAssistantAnswer([
      `「${keyword}」查询结果：`,
      ...matchedProjects.map(projectStatusText),
      ...matchedLeads.filter((lead) => !matchedProjects.some((project) => project.leadId === lead.id)).map(leadStatusText),
    ].join('\n'))
  }, [assistantInput, leads, projects])

  const handleToolUpload = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      addBusinessToolFile({
        id: `tool-upload-${Date.now()}`,
        title: uploadTitle.trim() || file.name.replace(/\.[^.]+$/, ''),
        category: uploadCategory,
        fileName: file.name,
        dataUrl: event.target?.result ? String(event.target.result) : undefined,
        uploadedBy: user?.name ?? '合伙人',
        uploadedAt: new Date().toISOString().split('T')[0],
      })
      setUploadTitle('')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="业务工具箱" description="项目手册、宣传资料、话术生成、业务QA、课程回顾和业务助理" />

      <section className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Upload className="size-4" /> 工具箱文件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
              <div className="space-y-1.5">
                <Label>文件标题</Label>
                <Input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} placeholder="不填则使用文件名" />
              </div>
              <div className="space-y-1.5">
                <Label>分类</Label>
                <Select value={uploadCategory} onValueChange={(value) => setUploadCategory((value ?? 'manual') as BusinessToolFile['category'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(toolCategoryLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Input type="file" onChange={(event) => handleToolUpload(event.target.files?.[0])} />
                <p className="mt-1 text-[11px] text-muted-foreground">前端原型仅保存本地 mock 文件元数据和预览数据。</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {toolGroups.map((group) => {
                const Icon = toolCategoryIcons[group.category]
                return (
                  <div key={group.category} className="rounded-xl border bg-muted/20 p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-primary" />
                      <p className="text-sm font-semibold">{group.label}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{group.files.length} 份资料</p>
                    <div className="mt-3 space-y-1.5">
                      {group.files.slice(0, 2).map((file) => (
                        <p key={file.id} className="truncate text-[12px] text-muted-foreground">{file.title}</p>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><MessageCircle className="size-4" /> 业务助理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input placeholder="输入项目名称，判断是否已有跟进/备案/排他" value={assistantInput} onChange={(event) => setAssistantInput(event.target.value)} />
              <Button onClick={handleAssistantCheck} className="shrink-0">查询</Button>
            </div>
            {assistantAnswer && <div className="whitespace-pre-line rounded-xl bg-muted p-3 text-sm leading-relaxed">{assistantAnswer}</div>}
          </CardContent>
        </Card>
      </section>

      <section>
        <PageHeader title="知识库资料" description="项目开发技巧、专业知识和AI答疑" />
        <Input placeholder="搜索培训资源..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 w-full max-w-sm" />
      </section>

      <SubsectionTabs
        active={activeCategory}
        onChange={(v) => setActiveCategory(v as TrainingResource['category'])}
        tabs={Object.entries(categoryLabels).map(([key, label]) => ({
          value: key,
          label,
          count: filtered(key).length,
        }))}
      />

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
