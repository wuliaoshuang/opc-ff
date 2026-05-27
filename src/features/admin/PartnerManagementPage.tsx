import { useState } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle2, KeyRound, PauseCircle, PlayCircle, Plus, Trash2, UserPlus, XCircle } from 'lucide-react'
import { getPartnerInviteCode } from '@/lib/invite-code'
import { formatListTime, sortByNewest } from '@/lib/time'
import { extractResourceKeywords, isRegionVisible, regionGroups } from '@/lib/v1-config'
import type { AccountStatus, AuthAccount, LeadGrade, PartnerPerformance, PartnerRelation, ResourceSurvey } from '@/types'

const gradeColors: Record<LeadGrade, string> = { S: 'text-fuchsia-600', A: 'text-emerald-600', B: 'text-blue-600', C: 'text-amber-600', D: 'text-red-600' }
const accountStatusLabels = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  disabled: '已停用',
}

const regionOptions = Array.from(new Set(Object.values(regionGroups).flat()))
const workTypes = ['企业主', '渠道商', '独立顾问', '行业协会', '政府机关', '其他']
const socialRoles = ['无', '人大代表', '政协委员', '协会理事', '商会副会长', '青联委员', '其他']
const resourceTypeOptions = ['行业协会', '上市公司关系', '金融机构', '园区资源', '政府资源', '设备科长', '能源管理部', '商会协会圈子']

type PartnerForm = {
  name: string
  phone: string
  username: string
  password: string
  region: string
  industry: string
  market: string
  workType: string
  relation: PartnerRelation
  parentPartnerId: string
  socialRole: string
  resourceTags: string
  keyPositions: string
  publicRoles: string
  associationCircles: string
  notes: string
  idCardMasked: string
}

function emptyPartnerForm(region = '上海'): PartnerForm {
  return {
    name: '',
    phone: '',
    username: '',
    password: 'OPC123456',
    region,
    industry: '综合能源',
    market: '综合能源',
    workType: '渠道商',
    relation: 'primary',
    parentPartnerId: '',
    socialRole: '无',
    resourceTags: '行业协会、园区资源',
    keyPositions: '',
    publicRoles: '',
    associationCircles: '',
    notes: '',
    idCardMasked: '',
  }
}

function splitTags(value: string) {
  return Array.from(new Set(value.split(/[、,，\s/]+/).map((item) => item.trim()).filter(Boolean)))
}

function makeResourceSurvey(form: Pick<PartnerForm, 'resourceTags' | 'keyPositions' | 'publicRoles' | 'associationCircles' | 'notes'>): ResourceSurvey {
  return {
    resourceTypes: splitTags(form.resourceTags),
    keyPositions: form.keyPositions.trim(),
    publicRoles: form.publicRoles.trim(),
    associationCircles: form.associationCircles.trim(),
    notes: form.notes.trim(),
  }
}

export default function PartnerManagementPage() {
  const partners = useStore((s) => s.partners)
  const subPartners = useStore((s) => s.subPartners)
  const adminLeads = useStore((s) => s.adminLeads)
  const projects = useStore((s) => s.projects)
  const bindings = useStore((s) => s.bindings)
  const commissions = useStore((s) => s.commissions)
  const accounts = useStore((s) => s.accounts)
  const user = useStore((s) => s.user)
  const reviewAccount = useStore((s) => s.reviewAccount)
  const disableAccount = useStore((s) => s.disableAccount)
  const updateAccount = useStore((s) => s.updateAccount)
  const createPartnerAccount = useStore((s) => s.createPartnerAccount)
  const resetAccountPassword = useStore((s) => s.resetAccountPassword)
  const removeAccount = useStore((s) => s.removeAccount)
  const addPartnerPerformance = useStore((s) => s.addPartnerPerformance)
  const updatePartnerPerformance = useStore((s) => s.updatePartnerPerformance)
  const removePartnerPerformance = useStore((s) => s.removePartnerPerformance)
  const addSubPartner = useStore((s) => s.addSubPartner)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all')
  const [relationFilter, setRelationFilter] = useState<PartnerRelation | 'all'>('all')
  const [selected, setSelected] = useState<PartnerPerformance | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [editRegion, setEditRegion] = useState('')
  const [editIndustry, setEditIndustry] = useState('')
  const [editRating, setEditRating] = useState<LeadGrade>('C')
  const [createOpen, setCreateOpen] = useState(false)
  const [partnerForm, setPartnerForm] = useState(() => emptyPartnerForm(
    user?.adminLevel === 'region_admin'
      ? regionGroups[user.adminRegionGroup ?? '华东'][0]
      : '上海',
  ))
  const [resetOpen, setResetOpen] = useState(false)
  const [nextPassword, setNextPassword] = useState('OPC123456')
  const [confirmDelete, setConfirmDelete] = useState('')

  const canSeeRegion = (region: string) => user?.adminLevel !== 'region_admin' || isRegionVisible(user.adminRegionGroup, region)
  const availableRegions = user?.adminLevel === 'region_admin'
    ? regionGroups[user.adminRegionGroup ?? '华东']
    : regionOptions
  const partnerAccounts = accounts.filter((account) => account.role === 'partner' && canSeeRegion(account.region))
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
  }).filter((p) => canSeeRegion(p.region)).filter((p) => {
    const account = accountByPartnerId.get(p.partnerId)
    const keywordHit = !search || `${p.partnerName}${p.region}${p.industry}${account?.phone ?? ''}${account?.username ?? ''}${account?.resourceKeywords?.join('') ?? ''}`.includes(search)
    const statusHit = statusFilter === 'all' || (account?.status ?? p.accountStatus) === statusFilter
    const relationHit = relationFilter === 'all' || account?.relation === relationFilter
    return keywordHit && statusHit && relationHit
  })
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

  const approveAllPending = () => {
    pendingAccounts.forEach((account) => {
      const username = account.username ?? `opc${account.phone.slice(-4)}`
      reviewAccount(account.id, true, reviewNote || '批量审核通过')
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
    })
    setReviewNote('')
    toast.success(`已批量通过 ${pendingAccounts.length} 个注册申请`)
  }

  const openCreate = () => {
    setPartnerForm(emptyPartnerForm(availableRegions[0] ?? '上海'))
    setCreateOpen(true)
  }

  const saveNewPartner = () => {
    if (!partnerForm.name.trim() || !partnerForm.phone.trim() || !partnerForm.username.trim() || !partnerForm.password.trim()) {
      toast.error('请填写姓名、手机号、登录账号和初始密码')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(partnerForm.phone.trim())) {
      toast.error('请输入正确的11位手机号')
      return
    }
    if (!canSeeRegion(partnerForm.region)) {
      toast.error('区域管理员不能创建本区域外的合伙人')
      return
    }
    if (partnerForm.relation === 'secondary' && !partnerForm.parentPartnerId) {
      toast.error('二级合伙人必须选择上级一级合伙人')
      return
    }

    const now = new Date().toISOString()
    const parent = partnerForm.parentPartnerId
      ? partners.find((partner) => partner.partnerId === partnerForm.parentPartnerId)
      : undefined
    const resourceSurvey = makeResourceSurvey(partnerForm)
    const socialRole = partnerForm.socialRole === '无' ? '' : partnerForm.socialRole.trim()
    const resourceTags = splitTags(partnerForm.resourceTags)
    const id = `p-admin-${Date.now()}`
    const account: AuthAccount = {
      id,
      username: partnerForm.username.trim(),
      password: partnerForm.password.trim(),
      name: partnerForm.name.trim(),
      phone: partnerForm.phone.trim(),
      role: 'partner',
      region: partnerForm.region,
      industry: partnerForm.industry.trim() || '综合能源',
      market: partnerForm.market.trim() || '综合能源',
      workType: partnerForm.workType,
      socialRole,
      idCardMasked: partnerForm.idCardMasked.trim() || undefined,
      idCardVerified: !!partnerForm.idCardMasked.trim(),
      resourceTags,
      resourceSurvey,
      resourceKeywords: extractResourceKeywords({
        region: partnerForm.region,
        industry: partnerForm.industry,
        socialRole,
        resourceTags,
        resourceSurvey,
      }),
      ownInviteCode: partnerForm.relation === 'primary' ? `OPC-${partnerForm.username.trim().toUpperCase()}` : undefined,
      inviteCode: partnerForm.relation === 'secondary' && parent
        ? getPartnerInviteCode({ id: parent.partnerId, username: parent.partnerId, name: parent.partnerName } as AuthAccount)
        : undefined,
      relation: partnerForm.relation,
      status: 'approved',
      submittedAt: now,
      reviewedAt: now,
      reviewNote: '后台直接创建合伙人账号',
      parentPartnerId: parent?.partnerId,
      parentPartnerName: parent?.partnerName,
    }

    const result = createPartnerAccount(account)
    if (!result.success) {
      toast.error(result.message)
      return
    }
    addPartnerPerformance({
      partnerId: id,
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
    if (partnerForm.relation === 'secondary' && parent) {
      addSubPartner({
        id,
        name: account.name,
        region: account.region,
        level: 2,
        parentId: parent.partnerId,
        parentName: parent.partnerName,
        leads: 0,
        projects: 0,
        activeProjects: 0,
        totalCommission: 0,
        status: 'active',
        boundAt: now.split('T')[0],
      })
    }
    setCreateOpen(false)
    toast.success(`已新增合伙人「${account.name}」`)
  }

  const openPartner = (partner: PartnerPerformance) => {
    setSelected(partner)
    setEditRegion(partner.region)
    setEditIndustry(partner.industry)
    setEditRating(partner.rating)
  }

  const savePartner = () => {
    if (!selected) return
    if (!canSeeRegion(editRegion)) {
      toast.error('区域管理员不能把合伙人调整到本区域外')
      return
    }
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

  const resetPassword = () => {
    if (!selected) return
    const result = resetAccountPassword(selected.partnerId, nextPassword)
    if (!result.success) {
      toast.error(result.message)
      return
    }
    setResetOpen(false)
    toast.success(`已重置「${selected.partnerName}」的登录密码`)
  }

  const removePartner = () => {
    if (!selected) return
    if (confirmDelete !== selected.partnerName) {
      toast.error('请输入合伙人姓名确认删除')
      return
    }
    removeAccount(selected.partnerId)
    removePartnerPerformance(selected.partnerId)
    setConfirmDelete('')
    setSelected(null)
    toast.warning('合伙人账号与绩效记录已删除')
  }

  return (
    <div>
      <PageHeader
        title="合伙人管理"
        description="审核注册、维护账号状态、查看绩效和下级团队"
        action={<Button size="sm" className="gap-1.5" onClick={openCreate}><UserPlus className="size-4" /> 新增合伙人</Button>}
      />
      {user?.adminLevel === 'region_admin' && (
        <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-[12px] text-blue-700 dark:text-blue-300">
          当前为原型配置的区域管理员视角，仅展示{user.adminRegionGroup}范围内的注册与项目数据。
        </div>
      )}
      <section className="mb-4 rounded-2xl border bg-card p-3">
        <div className="grid gap-2 md:grid-cols-[1fr_160px_160px]">
          <Input placeholder="搜索姓名、手机号、账号、区域、行业、关键词" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AccountStatus | 'all')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="approved">已通过</SelectItem>
              <SelectItem value="pending">待审核</SelectItem>
              <SelectItem value="rejected">已驳回</SelectItem>
              <SelectItem value="disabled">已停用</SelectItem>
            </SelectContent>
          </Select>
          <Select value={relationFilter} onValueChange={(value) => setRelationFilter(value as PartnerRelation | 'all')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部层级</SelectItem>
              <SelectItem value="primary">一级合伙人</SelectItem>
              <SelectItem value="secondary">二级合伙人</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {pendingAccounts.length > 0 && (
        <section className="mb-4 rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">待审核注册</p>
              <p className="text-[12px] text-muted-foreground">通过后账号才能登录，并同步进入合伙人绩效表</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="secondary">{pendingAccounts.length} 个待审</Badge>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={approveAllPending}>
                <CheckCircle2 className="size-3.5" /> 全部通过
              </Button>
            </div>
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
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      社会职务：{account.socialRole || '未填写'} · 名片：{account.businessCardUrl ? '已上传' : '未上传'} · 身份证图片：{account.idCardImageUrl ? '已上传' : '未上传'}
                    </p>
                    {account.resourceSurvey && (
                      <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                        调研：岗位 {account.resourceSurvey.keyPositions || '—'}；圈子 {account.resourceSurvey.associationCircles || '—'}；经历 {account.resourceSurvey.publicRoles || '—'}
                      </p>
                    )}
                    <p className="mt-1 text-[12px] font-medium text-foreground">
                      审核通过后账号：{account.username ?? `opc${account.phone.slice(-4)}`} / 初始密码：{account.password ?? 'OPC123456'}
                    </p>
                    {account.relation === 'secondary' && (
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        邀请码 {account.inviteCode} · 上级合伙人 {account.parentPartnerName ?? account.parentPartnerId ?? '待匹配'}
                      </p>
                    )}
                    <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                      资源：{account.resourceTags.join('、')}；关键词：{account.resourceKeywords?.join('、') || '待生成'}；身份证：{account.idCardMasked}
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
                <div><span className="text-muted-foreground">社会职务</span><p className="font-medium">{selectedAccount?.socialRole || '—'}</p></div>
                <div><span className="text-muted-foreground">关键词</span><p className="font-medium">{selectedAccount?.resourceKeywords?.slice(0, 3).join('、') || '—'}</p></div>
              </div>
              {selectedAccount?.resourceSurvey && (
                <div className="rounded-xl border bg-muted/30 p-3 text-[12px] leading-relaxed">
                  <p className="font-medium text-foreground">资源调研</p>
                  <p className="mt-1 text-muted-foreground">关键岗位：{selectedAccount.resourceSurvey.keyPositions || '—'}</p>
                  <p className="text-muted-foreground">人大/政协等经历：{selectedAccount.resourceSurvey.publicRoles || '—'}</p>
                  <p className="text-muted-foreground">商会/协会圈子：{selectedAccount.resourceSurvey.associationCircles || '—'}</p>
                  <p className="text-muted-foreground">说明：{selectedAccount.resourceSurvey.notes || '—'}</p>
                </div>
              )}
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">编辑资料</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className="text-[12px] text-muted-foreground">区域</span>
                    <Select value={editRegion} onValueChange={(value) => { if (value) setEditRegion(value) }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {availableRegions.map((region) => <SelectItem key={region} value={region}>{region}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
                <Button variant="outline" className="gap-1.5" onClick={() => { setNextPassword('OPC123456'); setResetOpen(true) }} disabled={!selectedAccount}>
                  <KeyRound className="size-3.5" /> 重置密码
                </Button>
              </div>
              <div className="space-y-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-[12px] font-medium text-destructive">删除合伙人</p>
                <Input
                  value={confirmDelete}
                  onChange={(event) => setConfirmDelete(event.target.value)}
                  placeholder={`输入「${selected.partnerName}」确认删除`}
                />
                <Button variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={removePartner}>
                  <Trash2 className="size-3.5" /> 删除
                </Button>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setPartnerForm(emptyPartnerForm(availableRegions[0] ?? '上海')) }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-primary" />
              新增合伙人账号
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>姓名</Label>
                <Input value={partnerForm.name} onChange={(event) => setPartnerForm({ ...partnerForm, name: event.target.value })} placeholder="合伙人姓名" />
              </div>
              <div className="space-y-1.5">
                <Label>手机号</Label>
                <Input value={partnerForm.phone} onChange={(event) => setPartnerForm({ ...partnerForm, phone: event.target.value })} placeholder="11位手机号" />
              </div>
              <div className="space-y-1.5">
                <Label>登录账号</Label>
                <Input value={partnerForm.username} onChange={(event) => setPartnerForm({ ...partnerForm, username: event.target.value })} placeholder="例如 sh-partner-01" />
              </div>
              <div className="space-y-1.5">
                <Label>初始密码</Label>
                <Input value={partnerForm.password} onChange={(event) => setPartnerForm({ ...partnerForm, password: event.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>层级</Label>
                <Select value={partnerForm.relation} onValueChange={(value) => setPartnerForm({ ...partnerForm, relation: value as PartnerRelation })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">一级合伙人</SelectItem>
                    <SelectItem value="secondary">二级合伙人</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>区域</Label>
                <Select value={partnerForm.region} onValueChange={(value) => { if (value) setPartnerForm({ ...partnerForm, region: value }) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableRegions.map((region) => <SelectItem key={region} value={region}>{region}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>工作类型</Label>
                <Select value={partnerForm.workType} onValueChange={(value) => { if (value) setPartnerForm({ ...partnerForm, workType: value }) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {workTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {partnerForm.relation === 'secondary' && (
              <div className="space-y-1.5">
                <Label>上级一级合伙人</Label>
                <Select value={partnerForm.parentPartnerId} onValueChange={(value) => { if (value) setPartnerForm({ ...partnerForm, parentPartnerId: value }) }}>
                  <SelectTrigger><SelectValue placeholder="选择上级合伙人" /></SelectTrigger>
                  <SelectContent>
                    {enrichedPartners
                      .filter((partner) => canSeeRegion(partner.region) && accountByPartnerId.get(partner.partnerId)?.relation !== 'secondary')
                      .map((partner) => <SelectItem key={partner.partnerId} value={partner.partnerId}>{partner.partnerName} · {partner.region}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>从业市场</Label>
                <Input value={partnerForm.market} onChange={(event) => setPartnerForm({ ...partnerForm, market: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>所属行业</Label>
                <Input value={partnerForm.industry} onChange={(event) => setPartnerForm({ ...partnerForm, industry: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>社会职务</Label>
                <Select value={partnerForm.socialRole} onValueChange={(value) => { if (value) setPartnerForm({ ...partnerForm, socialRole: value }) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {socialRoles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>资源标签</Label>
              <Input
                value={partnerForm.resourceTags}
                onChange={(event) => setPartnerForm({ ...partnerForm, resourceTags: event.target.value })}
                placeholder={resourceTypeOptions.join('、')}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>关键资源岗位</Label>
                <Input value={partnerForm.keyPositions} onChange={(event) => setPartnerForm({ ...partnerForm, keyPositions: event.target.value })} placeholder="设备科长、能源管理部、园区招商负责人" />
              </div>
              <div className="space-y-1.5">
                <Label>人大/政协/协会经历</Label>
                <Input value={partnerForm.publicRoles} onChange={(event) => setPartnerForm({ ...partnerForm, publicRoles: event.target.value })} placeholder="人大、政协、协会等" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>商会协会圈子</Label>
              <Input value={partnerForm.associationCircles} onChange={(event) => setPartnerForm({ ...partnerForm, associationCircles: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>资源说明</Label>
              <Textarea value={partnerForm.notes} onChange={(event) => setPartnerForm({ ...partnerForm, notes: event.target.value })} className="min-h-20 resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label>身份证脱敏号（选填）</Label>
              <Input value={partnerForm.idCardMasked} onChange={(event) => setPartnerForm({ ...partnerForm, idCardMasked: event.target.value })} placeholder="310***********001X" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={saveNewPartner}>创建并开通</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>重置登录密码</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-[13px] text-muted-foreground">
              将为「{selected?.partnerName}」设置新的后台登录密码，保存后旧密码立即失效。
            </p>
            <Input value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} placeholder="请输入新密码，至少6位" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>取消</Button>
            <Button onClick={resetPassword}>确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
