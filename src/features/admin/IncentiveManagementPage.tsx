import { useState } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Eye, FilePlus2, Trash2 } from 'lucide-react'
import { formatListTime, latestOf, sortByNewest } from '@/lib/time'
import type { IncentiveTask, RedPacketTask } from '@/types'

const statusLabels: Record<IncentiveTask['status'], { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft: { label: '待审核', variant: 'outline' },
  published: { label: '已发布', variant: 'default' },
  closed: { label: '已关闭', variant: 'secondary' },
}

const emptyTaskForm = {
  name: '',
  projectName: '',
  amount: '',
  deadline: '',
  requirements: '',
}

export default function IncentiveManagementPage() {
  const tasks = useStore((s) => s.incentiveTasks)
  const partners = useStore((s) => s.partners)
  const commissions = useStore((s) => s.commissions)
  const redPacketTasks = useStore((s) => s.redPacketTasks)
  const addTask = useStore((s) => s.addIncentiveTask)
  const updateTask = useStore((s) => s.updateIncentiveTask)
  const deleteTask = useStore((s) => s.deleteIncentiveTask)
  const approve = useStore((s) => s.approveIncentiveTask)
  const closeIncentiveTask = useStore((s) => s.closeIncentiveTask)
  const reviewRedPacket = useStore((s) => s.reviewRedPacket)
  const [reviewTask, setReviewTask] = useState<IncentiveTask | null>(null)
  const [reviewEvidence, setReviewEvidence] = useState<RedPacketTask | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<IncentiveTask | null>(null)
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [taskSearch, setTaskSearch] = useState('')
  const [taskStatus, setTaskStatus] = useState<IncentiveTask['status'] | 'all'>('all')
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<IncentiveTask | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const totalPending = commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + c.amount, 0)
  const totalSettled = commissions.filter((c) => c.status === 'settled').reduce((s, c) => s + c.amount, 0)
  const sortedTasks = sortByNewest(tasks, (task) => task.createdAt ?? task.deadline).filter((task) => {
    const keywordHit = !taskSearch || `${task.name}${task.projectName}${task.requirements ?? ''}`.includes(taskSearch)
    const statusHit = taskStatus === 'all' || task.status === taskStatus
    return keywordHit && statusHit
  })
  const pendingEvidence = sortByNewest(
    redPacketTasks.filter((t) => t.status === 'evidence_submitted'),
    (task) => latestOf(task.evidence?.submittedAt, task.createdAt, task.deadline),
  )

  const handleApprove = () => {
    if (!reviewTask) return
    approve(reviewTask.id)
    toast.success(`「${reviewTask.name}」已审核通过并发布`)
    setReviewTask(null)
  }

  const handleReject = () => {
    if (!reviewTask) return
    closeIncentiveTask(reviewTask.id)
    toast.error(`「${reviewTask.name}」已拒绝发布并关闭`)
    setReviewTask(null)
  }

  const handleApproveEvidence = () => {
    if (!reviewEvidence) return
    reviewRedPacket(reviewEvidence.id, true, reviewNote || '审核通过')
    toast.success(`「${reviewEvidence.name}」已审核通过，红包已发放`)
    setReviewEvidence(null)
    setReviewNote('')
  }

  const handleRejectEvidence = () => {
    if (!reviewEvidence) return
    if (!reviewNote.trim()) {
      toast.error('请填写驳回原因')
      return
    }
    reviewRedPacket(reviewEvidence.id, false, reviewNote)
    toast.error(`「${reviewEvidence.name}」已驳回`)
    setReviewEvidence(null)
    setReviewNote('')
  }

  const openTaskEditor = (task?: IncentiveTask) => {
    setEditingTask(task ?? null)
    setTaskForm(task ? {
      name: task.name,
      projectName: task.projectName,
      amount: String(task.amount),
      deadline: task.deadline,
      requirements: task.requirements ?? '',
    } : { ...emptyTaskForm, deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] })
    setEditorOpen(true)
  }

  const saveTask = () => {
    const amount = Number(taskForm.amount)
    if (!taskForm.name.trim() || !taskForm.projectName.trim() || !taskForm.deadline || !Number.isFinite(amount) || amount <= 0) {
      toast.error('请补全任务名称、项目、金额和截止日期')
      return
    }
    const payload = {
      name: taskForm.name.trim(),
      projectName: taskForm.projectName.trim(),
      amount,
      deadline: taskForm.deadline,
      requirements: taskForm.requirements.trim() || '按任务要求完成项目推进动作，并上传可审核凭证。',
    }
    if (editingTask) {
      updateTask(editingTask.id, payload)
      toast.success('红包任务已更新')
    } else {
      addTask({
        id: `task-admin-${Date.now()}`,
        ...payload,
        applicantCount: 0,
        createdAt: new Date().toISOString(),
        status: 'draft',
        createdBy: 'platform',
      })
      toast.success('平台红包任务已创建，待发布')
    }
    setEditorOpen(false)
    setEditingTask(null)
    setTaskForm(emptyTaskForm)
  }

  const removeTask = (task: IncentiveTask) => {
    if (deleteConfirm !== task.name) {
      toast.error('请输入任务名称确认删除')
      return
    }
    deleteTask(task.id)
    setReviewTask(null)
    setDeleteTaskTarget(null)
    setDeleteConfirm('')
    toast.warning(`已删除「${task.name}」`)
  }

  const publishTask = (task: IncentiveTask) => {
    approve(task.id)
    toast.success(`「${task.name}」已发布到红包入口`)
  }

  const closeTask = (task: IncentiveTask) => {
    closeIncentiveTask(task.id)
    toast.warning(`「${task.name}」已关闭`)
  }

  return (
    <div>
      <PageHeader
        title="激励管理"
        description="管理红包任务和合伙人分佣"
        action={<Button size="sm" className="gap-1.5" onClick={() => openTaskEditor()}><FilePlus2 className="size-4" /> 新增红包任务</Button>}
      />

      <Card className="mb-6">
        <CardHeader className="pb-2"><CardTitle className="text-base">红包任务管理</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-3 grid gap-2 md:grid-cols-[1fr_180px]">
            <Input value={taskSearch} onChange={(event) => setTaskSearch(event.target.value)} placeholder="搜索任务、项目、要求" />
            <Select value={taskStatus} onValueChange={(value) => setTaskStatus(value as IncentiveTask['status'] | 'all')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">待审核</SelectItem>
                <SelectItem value="published">已发布</SelectItem>
                <SelectItem value="closed">已关闭</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="hidden md:block">
            <Table>
              <TableHeader><TableRow>
                <TableHead>任务名称</TableHead><TableHead>关联项目</TableHead><TableHead>奖励金额</TableHead>
                <TableHead>创建时间</TableHead><TableHead>申请数</TableHead><TableHead>发起方</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {sortedTasks.map((t) => {
                  const cfg = statusLabels[t.status]
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-muted-foreground">{t.projectName}</TableCell>
                      <TableCell className="font-mono">¥{t.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{formatListTime(t.createdAt ?? t.deadline)}</TableCell>
                      <TableCell>{t.applicantCount}</TableCell>
                      <TableCell><Badge variant="outline">{t.createdBy === 'platform' ? '平台' : '合伙人'}</Badge></TableCell>
                      <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => openTaskEditor(t)}>编辑</Button>
                          {t.status === 'draft' && (
                            <Button size="sm" variant="outline" onClick={() => publishTask(t)}>发布</Button>
                          )}
                          {t.status !== 'closed' && (
                            <Button size="sm" variant="outline" onClick={() => closeTask(t)}>关闭</Button>
                          )}
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => { setDeleteTaskTarget(t); setDeleteConfirm('') }}>删除</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3">
            {sortedTasks.map((t) => {
              const cfg = statusLabels[t.status]
              return (
                <Card key={t.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-sm">{t.name}</p>
                      <Badge variant={cfg.variant} className="text-[10px] shrink-0">{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{t.projectName} · 创建 {formatListTime(t.createdAt ?? t.deadline)}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground"><Badge variant="outline" className="text-[10px] mr-1">{t.createdBy === 'platform' ? '平台' : '合伙人'}</Badge> {t.applicantCount}人申请</span>
                      <span className="font-mono font-bold text-amber-600">¥{t.amount.toLocaleString()}</span>
                    </div>
                    {t.status === 'draft' && <Button size="sm" variant="outline" className="w-full mt-1" onClick={() => publishTask(t)}>发布任务</Button>}
                    {t.status !== 'closed' && <Button size="sm" variant="outline" className="w-full" onClick={() => closeTask(t)}>关闭任务</Button>}
                    <Button size="sm" variant="outline" className="w-full" onClick={() => openTaskEditor(t)}>编辑任务</Button>
                    <Button size="sm" variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => { setDeleteTaskTarget(t); setDeleteConfirm('') }}>删除任务</Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">红包凭证审核</CardTitle>
            <Badge variant="outline">{pendingEvidence.length} 条待审核</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {pendingEvidence.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">暂无待审核凭证</div>
          ) : (
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>任务名称</TableHead><TableHead>关联项目</TableHead><TableHead>奖励金额</TableHead>
                    <TableHead>提交时间</TableHead><TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingEvidence.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-muted-foreground">{t.projectName}</TableCell>
                      <TableCell className="font-mono text-amber-600">¥{t.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{t.evidence?.submittedAt}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => setReviewEvidence(t)}>
                          <Eye className="size-3.5" /> 审核
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {pendingEvidence.length > 0 && (
            <div className="md:hidden space-y-3 mt-4">
              {pendingEvidence.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-sm">{t.name}</p>
                      <span className="font-mono font-bold text-amber-600 shrink-0">¥{t.amount.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t.projectName} · {t.evidence?.submittedAt}</p>
                    <Button size="sm" variant="outline" className="w-full gap-1" onClick={() => setReviewEvidence(t)}>
                      <Eye className="size-3.5" /> 审核
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base">合伙人分佣总览</CardTitle>
            <div className="text-sm text-muted-foreground">待结算 ¥{totalPending.toLocaleString()} · 已结算 ¥{totalSettled.toLocaleString()}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <Table>
              <TableHeader><TableRow>
                <TableHead>合伙人</TableHead><TableHead>区域</TableHead><TableHead>累计佣金</TableHead>
                <TableHead>成单数</TableHead><TableHead>评级</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {partners.map((p) => (
                  <TableRow key={p.partnerId}>
                    <TableCell className="font-medium">{p.partnerName}</TableCell>
                    <TableCell>{p.region}</TableCell>
                    <TableCell className="font-mono">¥{p.totalCommission.toLocaleString()}</TableCell>
                    <TableCell>{p.closedDeals}</TableCell>
                    <TableCell><span className="font-bold">{p.rating}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-2">
            {partners.map((p) => (
              <div key={p.partnerId} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{p.partnerName}</p>
                  <p className="text-xs text-muted-foreground">{p.region} · {p.closedDeals}单</p>
                </div>
                <div className="text-right">
                  <span className="font-bold">{p.rating}</span>
                  <p className="text-xs font-mono">¥{p.totalCommission.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!reviewTask} onOpenChange={(open) => { if (!open) setReviewTask(null) }}>
        {reviewTask && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>审核红包任务</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2 text-[13px]">
                <div className="flex justify-between"><span className="text-muted-foreground">任务名称</span><span className="font-medium">{reviewTask.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">关联项目</span><span>{reviewTask.projectName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">奖励金额</span><span className="font-mono font-medium text-amber-600">¥{reviewTask.amount.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">创建时间</span><span>{formatListTime(reviewTask.createdAt ?? reviewTask.deadline)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">截止日期</span><span>{reviewTask.deadline}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">发起方</span><Badge variant="outline">{reviewTask.createdBy === 'platform' ? '平台' : '合伙人'}</Badge></div>
              </div>
              {reviewTask.requirements && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-1 text-[12px] font-medium">任务要求</p>
                  <p className="text-[12px] leading-relaxed text-muted-foreground">{reviewTask.requirements}</p>
                </div>
              )}
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[12px] font-medium mb-1">审核要点</p>
                <ul className="text-[11px] text-muted-foreground space-y-1">
                  <li>• 任务描述是否清晰，完成标准是否可量化</li>
                  <li>• 奖励金额是否在预算范围内</li>
                  <li>• 截止日期是否合理</li>
                </ul>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="mr-auto gap-1.5 text-destructive hover:text-destructive" onClick={() => { setDeleteTaskTarget(reviewTask); setDeleteConfirm('') }}>
                <Trash2 className="size-4" /> 删除
              </Button>
              <Button variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleReject}>
                <XCircle className="size-4" /> 拒绝
              </Button>
              <Button className="gap-1.5" onClick={handleApprove}>
                <CheckCircle2 className="size-4" /> 通过并发布
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!reviewEvidence} onOpenChange={(open) => { if (!open) { setReviewEvidence(null); setReviewNote('') } }}>
        {reviewEvidence && (
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>审核任务凭证</DialogTitle>
              <p className="text-[13px] text-muted-foreground mt-1">任务：{reviewEvidence.name}</p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div><span className="text-muted-foreground">关联项目：</span>{reviewEvidence.projectName}</div>
                <div><span className="text-muted-foreground">奖励金额：</span><span className="font-mono font-medium text-amber-600">¥{reviewEvidence.amount.toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">提交时间：</span>{reviewEvidence.evidence?.submittedAt}</div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-[13px] font-medium">现场照片</p>
                <div className="grid grid-cols-3 gap-3">
                  {reviewEvidence.evidence?.images.map((img, idx) => (
                    <img key={idx} src={img} alt="" className="w-full aspect-square object-cover rounded-lg border" />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[13px] font-medium">执行说明</p>
                <div className="rounded-lg bg-muted/50 p-3 text-[12px] leading-relaxed">
                  {reviewEvidence.evidence?.description}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-[13px]">审核意见（驳回时必填）</Label>
                <Textarea
                  placeholder="如审核通过可不填；如驳回请说明原因..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="min-h-[80px] resize-none text-[13px]"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleRejectEvidence}>
                <XCircle className="size-4" /> 驳回
              </Button>
              <Button className="gap-1.5" onClick={handleApproveEvidence}>
                <CheckCircle2 className="size-4" /> 通过并发放
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={editorOpen} onOpenChange={(open) => { setEditorOpen(open); if (!open) { setEditingTask(null); setTaskForm(emptyTaskForm) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingTask ? '编辑红包任务' : '新增红包任务'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={taskForm.name} onChange={(event) => setTaskForm({ ...taskForm, name: event.target.value })} placeholder="任务名称" />
            <Input value={taskForm.projectName} onChange={(event) => setTaskForm({ ...taskForm, projectName: event.target.value })} placeholder="关联项目/客户" />
            <div className="grid grid-cols-2 gap-3">
              <Input value={taskForm.amount} onChange={(event) => setTaskForm({ ...taskForm, amount: event.target.value })} placeholder="奖励金额" />
              <Input value={taskForm.deadline} onChange={(event) => setTaskForm({ ...taskForm, deadline: event.target.value })} placeholder="截止日期 YYYY-MM-DD" />
            </div>
            <Textarea value={taskForm.requirements} onChange={(event) => setTaskForm({ ...taskForm, requirements: event.target.value })} placeholder="任务要求与验收标准" className="min-h-24" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>取消</Button>
            <Button onClick={saveTask}>{editingTask ? '保存任务' : '创建任务'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTaskTarget} onOpenChange={(open) => { if (!open) { setDeleteTaskTarget(null); setDeleteConfirm('') } }}>
        {deleteTaskTarget && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>删除红包任务</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-[12px] leading-relaxed text-destructive">
                删除会同步移除合伙人端红包入口里的对应任务。请输入任务名称「{deleteTaskTarget.name}」确认删除。
              </div>
              <Input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder={deleteTaskTarget.name} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTaskTarget(null)}>取消</Button>
              <Button variant="destructive" onClick={() => removeTask(deleteTaskTarget)}>确认删除</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
