import { useState } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { CheckCircle2, PauseCircle, PlayCircle, Trash2, XCircle } from 'lucide-react'
import { getPartnerInviteCode } from '@/lib/invite-code'
import { formatListTime, sortByNewest } from '@/lib/time'
import type { AuthAccount, PartnerPerformance, LeadGrade } from '@/types'

const gradeColors: Record<LeadGrade, string> = { S: 'text-fuchsia-600', A: 'text-emerald-600', B: 'text-blue-600', C: 'text-amber-600', D: 'text-red-600' }
const accountStatusLabels = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  disabled: '已停用',
}

export default function PartnerManagementPage() {
  const partners = useStore((s) => s.partners)
  const subPartners = useStore((s) => s.subPartners)
  const adminLeads = useStore((s) => s.adminLeads)
  const projects = useStore((s) => s.projects)
  const bindings = useStore((s) => s.bindings)
  const commissions = useStore((s) => s.commissions)
  const accounts = useStore((s) => s.accounts)
  const reviewAccount = useStore((s) => s.reviewAccount)
  const disableAccount = useStore((s) => s.disableAccount)
  const updateAccount = useStore((s) => s.updateAccount)
  const removeAccount = useStore((s) => s.removeAccount)
  const addPartnerPerformance = useStore((s) => s.addPartnerPerformance)
  const updatePartnerPerformance = useStore((s) => s.updatePartnerPerformance)
  const removePartnerPerformance = useStore((s) => s.removePartnerPerformance)
  const addSubPartner = useStore((s) => s.addSubPartner)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<PartnerPerformance | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [editRegion, setEditRegion] = useState('')
  const [editIndustry, setEditIndustry] = useState('')
  const [editRating, setEditRating] = useState<LeadGrade>('C')

  const partnerAccounts = accounts.filter((account) => account.role === 'partner')
  const pendingAccounts = sortByNewest(partnerAccounts.filter((account) => account.status === 'pending'), (account) => account.submittedAt)
  const accountByPartnerId = new Map(partnerAccounts.map((account) => [account.id, account]))
  const enrichedPartners = partners.map((partner) => {
    const ownedProjects = projects.filter((project) => project.ownerPartnerId === partner.partnerId || project.ownerPartnerName === partner.partnerName)
    const ownedLeads = adminLeads.filter((lead) => lead.assignedPartner === partner.partnerName || lead.appliedBy === partner.partnerName)
    const ownedBindings = bindings.filter((binding) => binding.partnerId === partner.partnerId && binding.status === 'active')
    const ownedCommissions = commissions.filter((commission) => commission.partnerId === partner.partnerId)
    const settledCommission = ownedCommissions.filter((commission) => commission.status === 'settled').reduce((sum, item) => sum + item.amount, 0)
    const activeProjectCount = ownedProjects.filter((project) => !['released', 'signed'].includes(project.stage)).length
    const closedDeals = ownedProjects.filter((project) => project.stage === 'signed').length
    const autoRating: LeadGrade = closedDeals >= 3 || settledCommission >= 100000
      ? 'S'
      : activeProjectCount >= 3 || ownedBindings.length >= 4
        ? 'A'
        : ownedLeads.length >= 3
          ? 'B'
          : partner.rating
    return {
      ...partner,
      totalLeads: Math.max(partner.totalLeads, ownedLeads.length),
      activeProjects: Math.max(partner.activeProjects, activeProjectCount),
      closedDeals: Math.max(partner.closedDeals, closedDeals),
      totalCommission: Math.max(partner.totalCommission, settledCommission),
      rating: autoRating,
    }
  })

  const filtered = sortByNewest(enrichedPartners, (partner) => {
    const account = accountByPartnerId.get(partner.partnerId)
    return account?.reviewedAt ?? account?.submittedAt
  }).filter((p) => !search || p.partnerName.includes(search) || p.region.includes(search) || p.industry.includes(search))
  const selectedAccount = selected ? accountByPartnerId.get(selected.partnerId) : undefined

  const approve = (account: AuthAccount) => {
    const username = account.username ?? `opc${account.phone.slice(-4)}`
    reviewAccount(account.id, true, reviewNote || '资料完整，后台审核通过')
    updateAccount(account.id, {
      username,
      password: account.password ?? 'OPC123456',
      ownInviteCode: account.relation === 'primary'
        ? account.ownInviteCode ?? getPartnerInviteCode({ ...account, username })
        : account.ownInviteCode,
    })
    addPartnerPerformance({
      partnerId: account.id,
      partnerName: account.name,
      region: account.region,
      industry: account.industry,
      totalLeads: 0,
      activeProjects: 0,
      closedDeals: 0,
      totalCommission: 0,
      rating: 'C',
      accountStatus: 'approved',
    })
    if (account.relation === 'secondary') {
      const parent = account.parentPartnerId
        ? partners.find((partner) => partner.partnerId === account.parentPartnerId)
        : undefined
      addSubPartner({
        id: account.id,
        name: account.name,
        region: account.region,
        level: 2,
        parentId: account.parentPartnerId ?? parent?.partnerId ?? 'p-001',
        parentName: account.parentPartnerName ?? parent?.partnerName ?? '张伟',
        leads: 0,
        projects: 0,
        activeProjects: 0,
        totalCommission: 0,
        status: 'active',
        boundAt: new Date().toISOString().split('T')[0],
      })
    }
    setReviewNote('')
    toast.success(`已通过「${account.name}」的注册申请`)
  }

  const reject = (account: AuthAccount) => {
    reviewAccount(account.id, false, reviewNote || '资料不完整，请补充后重新提交')
    setReviewNote('')
    toast.warning(`已驳回「${account.name}」的注册申请`)
  }

  const openPartner = (partner: PartnerPerformance) => {
    setSelected(partner)
    setEditRegion(partner.region)
    setEditIndustry(partner.industry)
    setEditRating(partner.rating)
  }

  const savePartner = () => {
    if (!selected) return
    updatePartnerPerformance(selected.partnerId, { region: editRegion, industry: editIndustry, rating: editRating })
    updateAccount(selected.partnerId, { region: editRegion, industry: editIndustry })
    setSelected({ ...selected, region: editRegion, industry: editIndustry, rating: editRating })
    toast.success('合伙人资料已保存')
  }

  const toggleDisable = () => {
    if (!selected || !selectedAccount) return
    const disabled = selectedAccount.status !== 'disabled'
    disableAccount(selected.partnerId, disabled)
    updatePartnerPerformance(selected.partnerId, { accountStatus: disabled ? 'disabled' : 'approved' })
    toast.success(disabled ? '账号已停用，无法再登录' : '账号已启用')
  }

  const removePartner = () => {
    if (!selected) return
    removeAccount(selected.partnerId)
    removePartnerPerformance(selected.partnerId)
    setSelected(null)
    toast.warning('合伙人账号与绩效记录已删除')
  }

  return (
    <div>
      <PageHeader title="合伙人管理" description="审核注册、维护账号状态、查看绩效和下级团队" />
      <Input placeholder="搜索姓名或区域..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4" />

      {pendingAccounts.length > 0 && (
        <section className="mb-4 rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">待审核注册</p>
              <p className="text-[12px] text-muted-foreground">通过后账号才能登录，并同步进入合伙人绩效表</p>
            </div>
            <Badge variant="secondary">{pendingAccounts.length} 个待审</Badge>
          </div>
          <Input
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            placeholder="审核意见（选填，通过/驳回时写入账号记录）"
            className="mb-3"
          />
          <div className="space-y-3">
            {pendingAccounts.map((account) => (
              <div key={account.id} className="rounded-xl border p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{account.name}</p>
                      <Badge variant="outline">{account.relation === 'secondary' ? '二级合伙人' : '一级合伙人'}</Badge>
                      <Badge variant="secondary">{accountStatusLabels[account.status]}</Badge>
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      提交时间 {formatListTime(account.submittedAt)} · 联系电话 {account.phone} · {account.region} · {account.industry} · {account.market}
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-foreground">
                      审核通过后账号：{account.username ?? `opc${account.phone.slice(-4)}`} / 初始密码：{account.password ?? 'OPC123456'}
                    </p>
                    {account.relation === 'secondary' && (
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        邀请码 {account.inviteCode} · 上级合伙人 {account.parentPartnerName ?? account.parentPartnerId ?? '待匹配'}
                      </p>
                    )}
                    <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                      资源：{account.resourceTags.join('、')}；身份证：{account.idCardMasked}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" className="gap-1.5" onClick={() => approve(account)}>
                      <CheckCircle2 className="size-3.5" /> 通过
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => reject(account)}>
                      <XCircle className="size-3.5" /> 驳回
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <>
        <Card className="hidden md:block">
          <CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>姓名</TableHead><TableHead>区域</TableHead><TableHead>行业</TableHead>
                <TableHead>最新时间</TableHead><TableHead>线索数</TableHead><TableHead>活跃项目</TableHead><TableHead>成单</TableHead>
                <TableHead>佣金总额</TableHead><TableHead>评级</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.partnerId} className="cursor-pointer hover:bg-muted/50" onClick={() => openPartner(p)}>
                    <TableCell className="font-medium">{p.partnerName}</TableCell>
                    <TableCell>{p.region}</TableCell>
                    <TableCell>{p.industry}</TableCell>
                    <TableCell className="text-sm">{formatListTime(accountByPartnerId.get(p.partnerId)?.reviewedAt ?? accountByPartnerId.get(p.partnerId)?.submittedAt)}</TableCell>
                    <TableCell>{p.totalLeads}</TableCell>
                    <TableCell>{p.activeProjects}</TableCell>
                    <TableCell>{p.closedDeals}</TableCell>
                    <TableCell>¥{p.totalCommission.toLocaleString()}</TableCell>
                    <TableCell><span className={`font-bold ${gradeColors[p.rating]}`}>{p.rating}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="md:hidden space-y-3">
          {filtered.map((p) => (
            <Card key={p.partnerId} className="cursor-pointer" onClick={() => openPartner(p)}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{p.partnerName}</p>
                  <div className="flex items-center gap-2">
                    {accountByPartnerId.get(p.partnerId)?.status === 'disabled' && <Badge variant="destructive" className="text-[10px]">停用</Badge>}
                    <span className={`font-bold ${gradeColors[p.rating]}`}>{p.rating}级</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{p.region} · {p.industry} · 最新 {formatListTime(accountByPartnerId.get(p.partnerId)?.reviewedAt ?? accountByPartnerId.get(p.partnerId)?.submittedAt)}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>线索 {p.totalLeads}</span>
                  <span>项目 {p.activeProjects}</span>
                  <span>成单 {p.closedDeals}</span>
                </div>
                <div className="text-sm font-medium">佣金 ¥{p.totalCommission.toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </>

      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        {selected && (
          <SheetContent className="sm:max-w-md">
            <SheetHeader><SheetTitle>{selected.partnerName} — 详情</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={selectedAccount?.status === 'disabled' ? 'destructive' : 'secondary'}>
                  {selectedAccount ? accountStatusLabels[selectedAccount.status] : '绩效记录'}
                </Badge>
                {selectedAccount?.relation === 'secondary' && <Badge variant="outline">二级合伙人</Badge>}
                {selectedAccount?.relation === 'primary' && <Badge variant="outline">邀请码 {getPartnerInviteCode(selectedAccount)}</Badge>}
                {selectedAccount?.idCardVerified && <Badge variant="outline">实名格式已验证</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">登录账号</span><p className="font-medium">{selectedAccount?.username ?? selected.partnerId}</p></div>
                <div><span className="text-muted-foreground">联系电话</span><p className="font-medium">{selectedAccount?.phone ?? '—'}</p></div>
                <div><span className="text-muted-foreground">提交时间</span><p className="font-medium">{formatListTime(selectedAccount?.submittedAt)}</p></div>
                <div><span className="text-muted-foreground">审核时间</span><p className="font-medium">{formatListTime(selectedAccount?.reviewedAt)}</p></div>
                <div><span className="text-muted-foreground">区域</span><p className="font-medium">{selected.region}</p></div>
                <div><span className="text-muted-foreground">评级</span><p className={`font-bold ${gradeColors[selected.rating]}`}>{selected.rating}级</p></div>
                <div><span className="text-muted-foreground">线索</span><p className="font-medium">{selected.totalLeads}</p></div>
                <div><span className="text-muted-foreground">成单</span><p className="font-medium">{selected.closedDeals}</p></div>
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">编辑资料</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className="text-[12px] text-muted-foreground">区域</span>
                    <Input value={editRegion} onChange={(event) => setEditRegion(event.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[12px] text-muted-foreground">行业</span>
                    <Input value={editIndustry} onChange={(event) => setEditIndustry(event.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[12px] text-muted-foreground">后台评级</span>
                  <Select value={editRating} onValueChange={(value) => setEditRating(value as LeadGrade)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['S', 'A', 'B', 'C', 'D'] as LeadGrade[]).map((grade) => <SelectItem key={grade} value={grade}>{grade}级</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" className="w-full" onClick={savePartner}>保存资料</Button>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">下级合伙人</p>
                {subPartners.filter((s) => s.parentId === selected.partnerId).length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无下级合伙人</p>
                ) : (
                  <div className="space-y-2">
                    {sortByNewest(subPartners.filter((s) => s.parentId === selected.partnerId), (sp) => sp.boundAt).map((sp) => (
                      <div key={sp.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <div><span className="font-medium">{sp.name}</span><span className="text-muted-foreground ml-2">{sp.region}</span></div>
                        <Badge variant="outline">线索 {sp.leads} / 项目 {sp.projects}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="gap-1.5" onClick={toggleDisable} disabled={!selectedAccount}>
                  {selectedAccount?.status === 'disabled' ? <PlayCircle className="size-3.5" /> : <PauseCircle className="size-3.5" />}
                  {selectedAccount?.status === 'disabled' ? '启用账号' : '停用账号'}
                </Button>
                <Button variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={removePartner}>
                  <Trash2 className="size-3.5" /> 删除
                </Button>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  )
}
