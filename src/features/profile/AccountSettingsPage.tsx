import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

export default function AccountSettingsPage() {
  const navigate = useNavigate()
  const user = useStore((s) => s.user)
  const accounts = useStore((s) => s.accounts)
  const updateAccount = useStore((s) => s.updateAccount)
  const login = useStore((s) => s.login)

  const account = accounts.find((a) => a.id === user?.id)

  const [info, setInfo] = useState({
    name: account?.name ?? '',
    phone: account?.phone ?? '',
    region: account?.region ?? '',
    industry: account?.industry ?? '',
  })

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  if (!user || !account) return null

  const handleSaveInfo = () => {
    if (!info.name.trim()) { toast.error('姓名不能为空'); return }
    if (!/^1\d{10}$/.test(info.phone)) { toast.error('请输入正确的11位手机号'); return }
    if (!info.region.trim()) { toast.error('负责区域不能为空'); return }
    if (!info.industry.trim()) { toast.error('主营行业不能为空'); return }
    updateAccount(user.id, { name: info.name, phone: info.phone, region: info.region, industry: info.industry })
    login({ ...user, name: info.name, phone: info.phone, region: info.region, industry: info.industry })
    toast.success('基础信息已保存')
  }

  const handleSavePwd = () => {
    const expected = account.password ?? (account.role === 'admin' ? 'OPC@2026' : 'OPC123456')
    if (pwd.current !== expected) { toast.error('原密码不正确'); return }
    if (pwd.next.length < 6) { toast.error('新密码至少6位'); return }
    if (pwd.next !== pwd.confirm) { toast.error('两次密码不一致'); return }
    updateAccount(user.id, { password: pwd.next })
    setPwd({ current: '', next: '', confirm: '' })
    toast.success('密码已修改，下次登录生效')
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader title="账号设置" description="修改你的个人信息与登录密码" />

      <Card className="rounded-2xl border-border/70 shadow-none">
        <CardContent className="p-4 space-y-4">
          <p className="text-sm font-semibold">基础信息</p>
          <Separator />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">姓名</Label>
              <Input value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} placeholder="请输入姓名" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">手机号</Label>
              <Input value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} placeholder="11位手机号" maxLength={11} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">负责区域</Label>
              <Input value={info.region} onChange={(e) => setInfo({ ...info, region: e.target.value })} placeholder="如：上海、北京" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">主营行业</Label>
              <Input value={info.industry} onChange={(e) => setInfo({ ...info, industry: e.target.value })} placeholder="如：综合能源、光伏储能" />
            </div>
          </div>
          <Button className="w-full" onClick={handleSaveInfo}>保存基础信息</Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70 shadow-none">
        <CardContent className="p-4 space-y-4">
          <p className="text-sm font-semibold">修改密码</p>
          <Separator />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">原密码</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={pwd.current}
                  onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                  placeholder="请输入原密码"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">新密码</Label>
              <div className="relative">
                <Input
                  type={showNext ? 'text' : 'password'}
                  value={pwd.next}
                  onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                  placeholder="至少6位"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNext((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNext ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">确认新密码</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={pwd.confirm}
                  onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                  placeholder="再次输入新密码"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleSavePwd}>修改密码</Button>
        </CardContent>
      </Card>

      <Button
        variant="ghost"
        className="w-full text-muted-foreground"
        onClick={() => navigate(-1)}
      >
        返回
      </Button>
    </div>
  )
}
