import { useState } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Copy, Link2, Plus, Ticket, TrendingUp, UserMinus, Users, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { getPartnerInviteCode } from '@/lib/invite-code'
import { formatListTime, sortByNewest } from '@/lib/time'
import type { SubPartner } from '@/types'

export default function SubPartnerPage() {
  const user = useStore((s) => s.user)
  const accounts = useStore((s) => s.accounts)
  const subPartners = useStore((s) => s.subPartners)
  const commissions = useStore((s) => s.commissions)
  const addSubPartner = useStore((s) => s.addSubPartner)
  const removeSubPartner = useStore((s) => s.removeSubPartner)
  const [addOpen, setAddOpen] = useState(false)
  const [detail, setDetail] = useState<SubPartner | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formRegion, setFormRegion] = useState('')

  const currentAccount = accounts.find((account) => account.id === user?.id)
  const inviteCode = currentAccount ? getPartnerInviteCode(currentAccount) : user ? getPartnerInviteCode(user) : ''
  const inviteLink = typeof window === 'undefined'
    ? ''
    : `${window.location.origin}${window.location.pathname}#/register?inviteCode=${encodeURIComponent(inviteCode)}`
  const mySubs = sortByNewest(subPartners.filter((s) => s.parentId === user?.id), (sub) => sub.boundAt)
  const active = mySubs.filter((s) => s.status === 'active')
  const pendingInvites = accounts.filter((account) =>
    account.role === 'partner' &&
    account.status === 'pending' &&
    account.parentPartnerId === user?.id,
  )
  const totalSubCommission = commissions
    .filter((c) => c.level === 'secondary' && mySubs.some((s) => s.id === c.partnerId) && c.status === 'settled')
    .reduce((sum, c) => sum + c.amount, 0)
  const pendingSubCommission = commissions
    .filter((c) => c.level === 'secondary' && mySubs.some((s) => s.id === c.partnerId) && c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0)

  const regions = ['上海浦东', '上海松江', '深圳南山', '成都高新', '杭州余杭', '广州番禺', '武汉光谷', '南京江宁', '长沙岳麓']

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label}已复制`)
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }

  const handleAdd = () => {
    if (!formName.trim()) { toast.error('请输入姓名'); return }
    if (!formRegion) { toast.error('请选择区域'); return }
    const sub: SubPartner = {
      id: `sp-${Date.now()}`,
      name: formName.trim(),
      region: formRegion,
      level: 2,
      parentId: user!.id,
      parentName: user!.name,
      leads: 0,
      projects: 0,
      activeProjects: 0,
      totalCommission: 0,
      status: 'active',
      boundAt: new Date().toISOString().split('T')[0],
    }
    addSubPartner(sub)
    toast.success(`已绑定二级合伙人「${formName}」`)
    setAddOpen(false); setFormName(''); setFormRegion('')
  }

  const handleRemove = (id: string) => {
    const sub = mySubs.find((s) => s.id === id)
    removeSubPartner(id)
    toast.warning(`已解除与「${sub?.name}」的绑定关系`)
    setConfirmRemove(null)
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader
        title="二级合伙人管理"
        description="发展和管理下级城市合伙人，查看团队分佣收益"
        action={<Button size="sm" className="gap-1.5" onClick={() => copyText(inviteCode, '邀请码')}><Copy className="size-4" /> 复制邀请码</Button>}
      />

      <section className="rounded-2xl border bg-card p-4 shadow-none">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">渠道团队</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">下级进展与分佣一起看</h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-[10px] text-muted-foreground">线索</p>
                <p className="mt-1 text-xl font-bold">{mySubs.reduce((sum, sub) => sum + sub.leads, 0)}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-[10px] text-muted-foreground">项目</p>
                <p className="mt-1 text-xl font-bold">{mySubs.reduce((sum, sub) => sum + sub.activeProjects, 0)}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-[10px] text-muted-foreground">待结算</p>
                <p className="mt-1 truncate text-xl font-bold">¥{pendingSubCommission.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-dashed bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
                  <Ticket className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">发展下级邀请码</p>
                  <p className="text-[11px] text-muted-foreground">下级注册填写后，审核通过自动归属到你名下</p>
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0">二级 {active.length}</Badge>
            </div>
            <div className="mt-3 rounded-lg bg-background px-3 py-2">
              <p className="text-[10px] text-muted-foreground">我的邀请码</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="truncate font-mono text-xl font-bold tracking-wider">{inviteCode}</p>
                <Button size="icon-sm" variant="ghost" aria-label="复制邀请码" onClick={() => copyText(inviteCode, '邀请码')}>
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => copyText(inviteLink, '注册链接')}>
                <Link2 className="size-3.5" /> 复制注册链接
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setAddOpen(true)}>
                <Plus className="size-3.5" /> 手动补录
              </Button>
            </div>
            {pendingInvites.length > 0 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                {pendingInvites.length} 个下级注册申请正在后台审核
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard title="下级合伙人数" value={active.length} icon={Users} />
        <StatCard title="下级已结算收益" value={`¥${totalSubCommission.toLocaleString()}`} icon={TrendingUp} />
        <StatCard title="下级待结算" value={`¥${pendingSubCommission.toLocaleString()}`} icon={TrendingUp} changeType="up" />
      </div>

      {mySubs.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <Users className="mx-auto size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">暂无下级合伙人</p>
            <p className="text-xs text-muted-foreground mt-1">复制邀请码发给下级，注册审核通过后自动加入团队</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden md:block">
            <CardContent className="pt-4">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>姓名</TableHead><TableHead>区域</TableHead><TableHead>绑定日期</TableHead>
                  <TableHead>线索数</TableHead><TableHead>项目数</TableHead><TableHead>分佣收益</TableHead>
                  <TableHead>状态</TableHead><TableHead>操作</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {mySubs.map((sub) => (
                    <TableRow key={sub.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetail(sub)}>
                      <TableCell className="font-medium">{sub.name}</TableCell>
                      <TableCell><span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{sub.region}</span></TableCell>
                      <TableCell className="text-sm">{formatListTime(sub.boundAt)}</TableCell>
                      <TableCell>{sub.leads}</TableCell>
                      <TableCell>{sub.activeProjects}/{sub.projects}</TableCell>
                      <TableCell className="font-mono text-sm">¥{sub.totalCommission.toLocaleString()}</TableCell>
                      <TableCell><Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>{sub.status === 'active' ? '活跃' : '已解绑'}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {sub.status === 'active' && (
                            <Button size="sm" variant="ghost" className="h-7 text-[11px] text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setConfirmRemove(sub.id) }}>
                              <UserMinus className="size-3" /> 解绑
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="space-y-3 md:hidden">
            {mySubs.map((sub) => (
              <Card key={sub.id} className="cursor-pointer rounded-2xl border-border/70 shadow-none" onClick={() => setDetail(sub)}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{sub.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="size-3" />{sub.region}</p>
                    </div>
                    <Badge variant={sub.status === 'active' ? 'default' : 'secondary'} className="text-[10px] shrink-0">{sub.status === 'active' ? '活跃' : '已解绑'}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>线索 {sub.leads}</span>
                    <span>项目 {sub.activeProjects}/{sub.projects}</span>
                    <span className="ml-auto font-mono font-medium">¥{sub.totalCommission.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground">绑定于 {formatListTime(sub.boundAt)}</span>
                    {sub.status === 'active' && (
                      <Button size="sm" variant="ghost" className="h-7 text-[11px] text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setConfirmRemove(sub.id) }}>
                        <UserMinus className="size-3" /> 解绑
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>手动补录二级合伙人</DialogTitle><DialogDescription>用于线下已确认关系的历史数据补录；新下级建议使用邀请码注册</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">姓名 *</Label>
              <Input placeholder="请输入下级合伙人姓名" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">负责区域 *</Label>
              <Select value={formRegion} onValueChange={(value) => value && setFormRegion(value)}>
                <SelectTrigger><SelectValue placeholder="选择负责区域" /></SelectTrigger>
                <SelectContent>
                  {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>取消</Button>
            <Button onClick={handleAdd}>确认绑定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmRemove} onOpenChange={(open) => { if (!open) setConfirmRemove(null) }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>确认解绑</DialogTitle><DialogDescription>解绑后该合伙人将不再是您的下级，其后续项目收益不再与您分佣</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>取消</Button>
            <Button variant="destructive" onClick={() => confirmRemove && handleRemove(confirmRemove)}>确认解绑</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(open) => { if (!open) setDetail(null) }}>
        {detail && (
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
            <DialogHeader><DialogTitle>{detail.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={detail.status === 'active' ? 'default' : 'secondary'}>{detail.status === 'active' ? '活跃' : '已解绑'}</Badge>
                <Badge variant="outline" className="text-[10px]">{detail.region}</Badge>
                <Badge variant="outline" className="text-[10px]">上级: {detail.parentName}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div><span className="text-muted-foreground">线索数</span><p className="font-medium">{detail.leads}</p></div>
                <div><span className="text-muted-foreground">项目数</span><p className="font-medium">{detail.activeProjects}/{detail.projects}</p></div>
                <div><span className="text-muted-foreground">累计分佣</span><p className="font-medium">¥{detail.totalCommission.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">绑定日期</span><p className="font-medium">{formatListTime(detail.boundAt)}</p></div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-[13px] font-medium">下级分佣记录</p>
                {commissions.filter((c) => c.partnerId === detail.id && c.level === 'secondary').length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">暂无分佣记录</p>
                ) : (
                  <div className="space-y-2">
                    {sortByNewest(commissions.filter((c) => c.partnerId === detail.id && c.level === 'secondary'), (c) => c.settledAt ?? c.month).slice(0, 5).map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-[12px]">
                        <div>
                          <p className="font-medium">{c.projectName}</p>
                          <p className="text-muted-foreground">{formatListTime(c.settledAt ?? c.month)} · {c.type === 'short_term' ? '短期' : '长期'} · {c.commissionRate}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-medium">¥{c.amount.toLocaleString()}</p>
                          <Badge variant={c.status === 'settled' ? 'default' : 'outline'} className="text-[10px]">{c.status === 'settled' ? '已结算' : '待结算'}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              {detail.status === 'active' && (
                <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => { handleRemove(detail.id); setDetail(null) }}>解除绑定</Button>
              )}
              <Button variant="outline" onClick={() => setDetail(null)}>关闭</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
