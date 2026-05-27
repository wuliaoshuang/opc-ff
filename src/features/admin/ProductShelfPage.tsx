import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ProductItem } from '@/types'

export default function ProductShelfPage() {
  const navigate = useNavigate()
  const products = useStore((s) => s.products)
  const toggleStatus = useStore((s) => s.toggleProductStatus)
  const addProduct = useStore((s) => s.addProduct)
  const updateProduct = useStore((s) => s.updateProduct)
  const deleteProduct = useStore((s) => s.deleteProduct)
  const [detail, setDetail] = useState<ProductItem | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<ProductItem | null>(null)
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formRate, setFormRate] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formTrainingLinked, setFormTrainingLinked] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductItem['status'] | 'all'>('all')
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const filteredProducts = products.filter((product) => {
    const keywordHit = !search || `${product.name}${product.category}${product.description}${product.commissionRate}`.includes(search)
    const statusHit = statusFilter === 'all' || product.status === statusFilter
    return keywordHit && statusHit
  })

  const openEditor = (product?: ProductItem) => {
    setEditing(product ?? null)
    setFormName(product?.name ?? '')
    setFormCategory(product?.category ?? '核心业务')
    setFormRate(product?.commissionRate ?? '')
    setFormDesc(product?.description ?? '')
    setFormTrainingLinked(product?.trainingLinked ?? true)
    setEditorOpen(true)
  }

  const saveProduct = () => {
    if (!formName.trim()) {
      toast.error('请填写服务名称')
      return
    }
    if (!formCategory.trim()) {
      toast.error('请填写分类')
      return
    }
    if (!formRate.trim()) {
      toast.error('请填写佣金比例')
      return
    }
    const payload = {
      name: formName.trim(),
      category: formCategory.trim(),
      description: formDesc.trim() || '一二期核心能源服务配置项。',
      commissionRate: formRate.trim(),
      trainingLinked: formTrainingLinked,
    }
    if (editing) {
      updateProduct(editing.id, payload)
      setDetail((current) => current?.id === editing.id ? { ...current, ...payload } : current)
      toast.success('服务配置已更新')
    } else {
      addProduct({
        id: `prod-${Date.now()}`,
        ...payload,
        status: 'inactive',
      })
      toast.success('服务已新增，默认下线，确认后可上线')
    }
    setEditorOpen(false)
  }

  const removeProduct = (product: ProductItem) => {
    if (deleteConfirm !== product.name) {
      toast.error('请输入服务名称确认删除')
      return
    }
    deleteProduct(product.id)
    setDetail(null)
    setDeleteTarget(null)
    setDeleteConfirm('')
    toast.warning(`已删除「${product.name}」`)
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader
        title="产品货架"
        description="仅管理一二期可推广的核心能源服务，不扩展三期供应链项目"
        action={<Button size="sm" className="gap-1.5" onClick={() => openEditor()}><Plus className="size-4" /> 新增服务</Button>}
      />

      <section className="rounded-2xl border bg-card p-3">
        <div className="grid gap-2 md:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索服务、分类、说明、佣金" />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProductItem['status'] | 'all')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">上线</SelectItem>
              <SelectItem value="inactive">下线</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((p) => (
          <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetail(p)}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">{p.name}</h3>
                </div>
                <Badge variant={p.status === 'active' ? 'default' : 'outline'}>{p.status === 'active' ? '上线' : '下线'}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>佣金：{p.commissionRate}</span>
                <span>{p.category}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!detail} onOpenChange={(open) => { if (!open) setDetail(null) }}>
        {detail && (
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader><DialogTitle>{detail.name}</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <p>{detail.description}</p>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <span>分类：{detail.category}</span>
                <span>佣金比例：{detail.commissionRate}</span>
                <span>培训关联：{detail.trainingLinked ? '是' : '否'}</span>
                <span>状态：{detail.status === 'active' ? '上线' : '下线'}</span>
              </div>
              <Button variant="outline" className="w-full" onClick={() => { toggleStatus(detail.id); setDetail({ ...detail, status: detail.status === 'active' ? 'inactive' : 'active' }) }}>
                {detail.status === 'active' ? '下线产品' : '上线产品'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => openEditor(detail)}>
                编辑服务配置
              </Button>
              {detail.trainingLinked && (
                <Button variant="ghost" className="w-full text-[12px] text-muted-foreground" onClick={() => { setDetail(null); navigate('/partner/training') }}>
                  查看关联培训课程
                </Button>
              )}
              <Button variant="outline" className="w-full gap-1.5 text-destructive hover:text-destructive" onClick={() => { setDeleteTarget(detail); setDeleteConfirm('') }}>
                <Trash2 className="size-3.5" /> 删除服务
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirm('') } }}>
        {deleteTarget && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>删除服务配置</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-[12px] leading-relaxed text-destructive">
                删除后合伙人端产品货架不再展示该服务。请输入服务名称「{deleteTarget.name}」确认删除。
              </div>
              <Input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder={deleteTarget.name} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
              <Button variant="destructive" onClick={() => removeProduct(deleteTarget)}>确认删除</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑服务配置' : '新增服务配置'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[12px]">服务名称</Label>
              <Input value={formName} onChange={(event) => setFormName(event.target.value)} placeholder="如：能效诊断服务" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[12px]">分类</Label>
                <Input value={formCategory} onChange={(event) => setFormCategory(event.target.value)} placeholder="核心业务" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">佣金比例</Label>
                <Input value={formRate} onChange={(event) => setFormRate(event.target.value)} placeholder="3-5%" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">服务说明</Label>
              <Textarea
                value={formDesc}
                onChange={(event) => setFormDesc(event.target.value)}
                className="min-h-24 resize-none text-[13px]"
                placeholder="说明服务范围、推广口径和一二期业务边界"
              />
            </div>
            <label className="flex items-center justify-between rounded-xl border p-3 text-[13px]">
              <span>
                <span className="block font-medium">关联培训课程</span>
                <span className="text-[11px] text-muted-foreground">开启后合伙人可从服务详情跳转培训资料</span>
              </span>
              <input
                type="checkbox"
                checked={formTrainingLinked}
                onChange={(event) => setFormTrainingLinked(event.target.checked)}
                className="size-4 accent-primary"
              />
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditorOpen(false)}>取消</Button>
            <Button onClick={saveProduct}>{editing ? '保存修改' : '新增服务'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
