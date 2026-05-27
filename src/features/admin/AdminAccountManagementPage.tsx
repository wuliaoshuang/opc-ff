import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStore } from '@/stores'
import { regionGroups } from '@/lib/v1-config'
import { formatListTime, sortByNewest } from '@/lib/time'
import { cn } from '@/lib/utils'
import { KeyRound, Pencil, Plus, ShieldCheck, ShieldX, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AccountStatus, AuthAccount, RegionGroup } from '@/types'

const regionGroupOptions = Object.keys(regionGroups) as RegionGroup[]

const statusLabels = {
  pending: '待审核',
  approved: '已启用',
  rejected: '已驳回',
  disabled: '已停用',
}

function adminLevelLabel(account: AuthAccount) {
  return account.adminLevel === 'super_admin' ? '大管理员' : `${account.adminRegionGroup ?? account.region}区域管理员`
}

function emptyForm() {
  return {
    name: '',
    username: '',
    phone: '',
    password: 'OPC@2026',
    adminRegionGroup: '华东' as RegionGroup,
  }
}

export default function AdminAccountManagementPage() {
  const user = useStore((s) => s.user)
  const accounts = useStore((s) => s.accounts)
  const createAdminAccount = useStore((s) => s.createAdminAccount)
  const updateAccount = useStore((s) => s.updateAccount)
  const resetAccountPassword = useStore((s) => s.resetAccountPassword)
  const disableAccount = useStore((s) => s.disableAccount)
  const removeAccount = useStore((s) => s.removeAccount)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [selectedGroup, setSelectedGroup] = useState<RegionGroup | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<AuthAccount | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [resetting, setResetting] = useState<AuthAccount | null>(null)
  const [nextPassword, setNextPassword] = useState('OPC@2026')
  const [deleting, setDeleting] = useState<AuthAccount | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const adminAccounts = useMemo(() => (
    sortByNewest(
      accounts.filter((account) => account.role === 'admin'),
      (account) => account.reviewedAt ?? account.submittedAt,
    )
  ), [accounts])

  const visibleAdmins = selectedGroup === 'all'
    ? adminAccounts
    : adminAccounts.filter((account) => account.adminRegionGroup === selectedGroup)
  const filteredAdmins = visibleAdmins.filter((account) => {
    const keywordHit = !search || `${account.username ?? ''}${account.name}${account.phone}${account.adminRegionGroup ?? ''}${account.region}`.includes(search)
    const statusHit = statusFilter === 'all' || account.status === statusFilter
    return keywordHit && statusHit
  })
  const superAdminCount = adminAccounts.filter((account) => account.adminLevel === 'super_admin').length
  const regionAdminCount = adminAccounts.filter((account) => account.adminLevel === 'region_admin').length
  const activeAdminCount = adminAccounts.filter((account) => account.status === 'approved').length
  const disabledAdminCount = adminAccounts.filter((account) => account.status === 'disabled').length

  const canManage = user?.adminLevel === 'super_admin'

  const resetForm = () => setForm(emptyForm())
  const openEdit = (account: AuthAccount) => {
    if (account.adminLevel === 'super_admin') {
      toast.error('大管理员账号不在这里修改权限')
      return
    }
    setEditing(account)
    setEditForm({
      name: account.name,
      username: account.username ?? '',
      phone: account.phone,
      password: account.password ?? 'OPC@2026',
      adminRegionGroup: account.adminRegionGroup ?? '华东',
    })
  }

  const createRegionAdmin = () => {
    if (!form.name.trim() || !form.username.trim() || !form.phone.trim() || !form.password.trim()) {
      toast.error('请填写姓名、系统账号、手机号和初始密码')
      return
    }

    const now = new Date().toISOString()
    const account: AuthAccount = {
      id: `admin-${Date.now()}`,
      username: form.username.trim(),
      password: form.password.trim(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      role: 'admin',
      adminLevel: 'region_admin',
      adminRegionGroup: form.adminRegionGroup,
      region: form.adminRegionGroup,
      industry: '综合能源',
      market: '区域管理',
      workType: '区域管理员',
      idCardVerified: true,
      resourceTags: ['区域审核', '项目备案'],
      resourceKeywords: [form.adminRegionGroup, '区域审核', '项目备案'],
      relation: 'primary',
      status: 'approved',
      submittedAt: now,
      reviewedAt: now,
      reviewNote: '大管理员创建区域管理员账号',
    }

    const result = createAdminAccount(account)
    if (!result.success) {
      toast.error(result.message)
      return
    }
    setOpen(false)
    resetForm()
    toast.success(`已创建${form.adminRegionGroup}区域管理员账号`)
  }

  const toggleAdminStatus = (account: AuthAccount) => {
    if (account.adminLevel === 'super_admin') {
      toast.error('大管理员账号不能在原型中停用')
      return
    }
    const disabled = account.status !== 'disabled'
    disableAccount(account.id, disabled)
    toast.success(disabled ? '区域管理员已停用' : '区域管理员已启用')
  }

  const updateRegionGroup = (account: AuthAccount, group: RegionGroup) => {
    updateAccount(account.id, {
      adminRegionGroup: group,
      region: group,
      resourceKeywords: [group, '区域审核', '项目备案'],
    })
    toast.success(`已调整为${group}区域管理员`)
  }

  const saveAdminEdit = () => {
    if (!editing) return
    if (!editForm.name.trim() || !editForm.username.trim() || !editForm.phone.trim()) {
      toast.error('请填写姓名、系统账号和手机号')
      return
    }
    const usernameExists = accounts.some((account) => account.id !== editing.id && account.username === editForm.username.trim())
    if (usernameExists) {
      toast.error('系统账号已存在')
      return
    }
    const phoneExists = accounts.some((account) => account.id !== editing.id && account.phone === editForm.phone.trim())
    if (phoneExists) {
      toast.error('手机号已存在')
      return
    }
    updateAccount(editing.id, {
      name: editForm.name.trim(),
      username: editForm.username.trim(),
      phone: editForm.phone.trim(),
      adminRegionGroup: editForm.adminRegionGroup,
      region: editForm.adminRegionGroup,
      resourceKeywords: [editForm.adminRegionGroup, '区域审核', '项目备案'],
      reviewedAt: new Date().toISOString(),
      reviewNote: '大管理员编辑区域管理员账号',
    })
    setEditing(null)
    toast.success('区域管理员账号已更新')
  }

  const resetPassword = () => {
    if (!resetting) return
    const result = resetAccountPassword(resetting.id, nextPassword)
    if (!result.success) {
      toast.error(result.message)
      return
    }
    toast.success(`已重置「${resetting.name}」的登录密码`)
    setResetting(null)
  }

  const deleteAdmin = (account: AuthAccount) => {
    if (account.adminLevel === 'super_admin') {
      toast.error('大管理员账号不能删除')
      return
    }
    if (deleteConfirm !== account.username) {
      toast.error('请输入系统账号确认删除')
      return
    }
    removeAccount(account.id)
    setDeleting(null)
    setDeleteConfirm('')
    toast.warning('区域管理员账号已删除')
  }

  if (!canManage) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="账号管理"
          description="大管理员维护后台管理员账号，区域管理员只负责本区域审核与项目管理"
        />
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <ShieldX className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">当前账号无账号管理权限</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                账号创建、区域管理员启停、区域划分调整只开放给最大权限大管理员。当前{user?.adminRegionGroup ?? ''}区域管理员仅能处理本区域注册审核、项目备案和业务数据。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader
        title="账号管理"
        description="大管理员维护后台账号；四个区域管理员按区域划分数据权限"
        action={
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> 新增区域管理员
          </Button>
        }
      />

      <section className="grid grid-cols-3 gap-2 md:gap-4">
        {[
          { label: '大管理员', value: superAdminCount, helper: '最大权限' },
          { label: '区域管理员', value: regionAdminCount, helper: '四区划分' },
          { label: '启用/停用', value: `${activeAdminCount}/${disabledAdminCount}`, helper: '可登录/已停用' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border bg-card p-3">
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-bold">{item.value}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{item.helper}</p>
          </div>
        ))}
      </section>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">后台管理员账号</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">区域管理员只能看到对应区域数据；大管理员可查看和维护全部</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[220px_140px_140px]">
              <Input className="h-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索账号、姓名、手机号" />
              <Select value={selectedGroup} onValueChange={(value) => setSelectedGroup(value as RegionGroup | 'all')}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部区域</SelectItem>
                  {regionGroupOptions.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AccountStatus | 'all')}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="approved">已启用</SelectItem>
                  <SelectItem value="disabled">已停用</SelectItem>
                  <SelectItem value="pending">待审核</SelectItem>
                  <SelectItem value="rejected">已驳回</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hidden md:block">
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>账号</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>权限</TableHead>
                <TableHead>区域</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-mono text-[12px]">{account.username}</TableCell>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>
                    <Badge variant={account.adminLevel === 'super_admin' ? 'default' : 'outline'}>{adminLevelLabel(account)}</Badge>
                  </TableCell>
                  <TableCell>
                    {account.adminLevel === 'region_admin' ? (
                      <Select value={account.adminRegionGroup} onValueChange={(value) => updateRegionGroup(account, value as RegionGroup)}>
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {regionGroupOptions.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : '全部'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.status === 'approved' ? 'secondary' : account.status === 'disabled' ? 'destructive' : 'outline'}>
                      {statusLabels[account.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{formatListTime(account.reviewedAt ?? account.submittedAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" disabled={account.adminLevel === 'super_admin'} onClick={() => openEdit(account)}>
                        <Pencil className="size-3.5" /> 编辑
                      </Button>
                      <Button size="sm" variant="outline" disabled={account.adminLevel === 'super_admin'} onClick={() => { setResetting(account); setNextPassword('OPC@2026') }}>
                        <KeyRound className="size-3.5" /> 重置
                      </Button>
                      <Button size="sm" variant="outline" disabled={account.adminLevel === 'super_admin'} onClick={() => toggleAdminStatus(account)}>
                        {account.status === 'disabled' ? '启用' : '停用'}
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={account.adminLevel === 'super_admin'} onClick={() => { setDeleting(account); setDeleteConfirm('') }}>
                        <Trash2 className="size-3.5" /> 删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-3 md:hidden">
        {filteredAdmins.map((account) => (
          <Card key={account.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{account.name}</p>
                  <p className="mt-0.5 font-mono text-[12px] text-muted-foreground">{account.username}</p>
                </div>
                <Badge variant={account.adminLevel === 'super_admin' ? 'default' : 'outline'}>{adminLevelLabel(account)}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <span className="text-muted-foreground">状态</span>
                <span className={cn('font-medium', account.status === 'disabled' && 'text-destructive')}>{statusLabels[account.status]}</span>
              </div>
              {account.adminLevel === 'region_admin' && (
                <Select value={account.adminRegionGroup} onValueChange={(value) => updateRegionGroup(account, value as RegionGroup)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {regionGroupOptions.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" disabled={account.adminLevel === 'super_admin'} onClick={() => openEdit(account)}>
                  编辑
                </Button>
                <Button size="sm" variant="outline" disabled={account.adminLevel === 'super_admin'} onClick={() => { setResetting(account); setNextPassword('OPC@2026') }}>
                  重置密码
                </Button>
                <Button size="sm" variant="outline" disabled={account.adminLevel === 'super_admin'} onClick={() => toggleAdminStatus(account)}>
                  {account.status === 'disabled' ? '启用' : '停用'}
                </Button>
                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={account.adminLevel === 'super_admin'} onClick={() => { setDeleting(account); setDeleteConfirm('') }}>
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetForm() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              新增区域管理员
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>姓名</Label>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="姓名" />
              </div>
              <div className="space-y-1.5">
                <Label>手机号</Label>
                <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="手机号" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>系统账号</Label>
              <Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="系统账号，例如 east-admin-02" />
            </div>
            <div className="space-y-1.5">
              <Label>初始密码</Label>
              <Input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="初始密码" />
            </div>
            <div className="space-y-1.5">
              <Label>管理区域</Label>
              <Select value={form.adminRegionGroup} onValueChange={(value) => setForm({ ...form, adminRegionGroup: value as RegionGroup })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {regionGroupOptions.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl border bg-muted/35 p-3 text-[12px] leading-relaxed text-muted-foreground">
              新账号会立即启用，可登录后台；登录后只能查看所选区域的数据。大管理员账号不支持在此删除或停用。
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={createRegionAdmin}>创建账号</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>编辑区域管理员</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>姓名</Label>
                <Input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>手机号</Label>
                <Input value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>系统账号</Label>
              <Input value={editForm.username} onChange={(event) => setEditForm({ ...editForm, username: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>管理区域</Label>
              <Select value={editForm.adminRegionGroup} onValueChange={(value) => setEditForm({ ...editForm, adminRegionGroup: value as RegionGroup })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {regionGroupOptions.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
            <Button onClick={saveAdminEdit}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetting} onOpenChange={(open) => { if (!open) setResetting(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>重置管理员密码</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-[13px] text-muted-foreground">将为「{resetting?.name}」重置登录密码，保存后旧密码立即失效。</p>
            <Input value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} placeholder="请输入新密码，至少6位" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetting(null)}>取消</Button>
            <Button onClick={resetPassword}>确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => { if (!open) { setDeleting(null); setDeleteConfirm('') } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>删除区域管理员</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-[12px] leading-relaxed text-destructive">
              删除后该后台账号不能再登录。请输入系统账号「{deleting?.username}」确认删除。
            </div>
            <Input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder={deleting?.username} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>取消</Button>
            <Button variant="destructive" onClick={() => deleting && deleteAdmin(deleting)}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
