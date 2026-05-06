import type { StateCreator } from 'zustand'
import type { AuthAccount, User } from '@/types'
import { getPartnerInviteCode, normalizeInviteCode } from '@/lib/invite-code'

const adminAccount: AuthAccount = {
  id: 'admin-001',
  username: 'admin',
  password: 'OPC@2026',
  name: '管理员',
  phone: '18800000000',
  role: 'admin',
  region: '总部',
  industry: '综合能源',
  market: '平台管理',
  workType: '平台管理员',
  idCardVerified: true,
  resourceTags: ['平台运营', '审核管理'],
  relation: 'primary',
  status: 'approved',
  submittedAt: '2026-01-01T00:00:00.000Z',
  reviewedAt: '2026-01-01T00:00:00.000Z',
}

export const seedAccounts: AuthAccount[] = [
  adminAccount,
  {
    id: 'p-001',
    username: 'zw001',
    password: 'OPC123456',
    name: '张伟',
    phone: '13800000001',
    role: 'partner',
    region: '上海',
    industry: '综合能源',
    market: '综合能源',
    workType: '渠道商',
    idCardMasked: '310***********001X',
    idCardVerified: true,
    resourceTags: ['行业协会', '上市公司关系', '金融机构'],
    ownInviteCode: 'OPC-ZW001',
    relation: 'primary',
    status: 'approved',
    submittedAt: '2026-02-01T10:00:00.000Z',
    reviewedAt: '2026-02-01T15:30:00.000Z',
  },
]

export interface AuthSlice {
  user: User | null
  isAuthenticated: boolean
  accounts: AuthAccount[]
  login: (user: User) => void
  loginWithAccount: (username: string, password: string, role: 'partner' | 'admin') => { success: boolean; message?: string; user?: User }
  registerAccount: (account: AuthAccount) => { success: boolean; message?: string }
  resolveInviteCode: (inviteCode: string) => { success: boolean; message?: string; parent?: AuthAccount }
  updateAccount: (id: string, patch: Partial<AuthAccount>) => void
  reviewAccount: (id: string, approved: boolean, note?: string) => void
  disableAccount: (id: string, disabled: boolean) => void
  removeAccount: (id: string) => void
  logout: () => void
}

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  user: null,
  isAuthenticated: false,
  accounts: seedAccounts,
  login: (user) => set({ user, isAuthenticated: true }),
  loginWithAccount: (username, password, role) => {
    let result: { success: boolean; message?: string; user?: User } = { success: false, message: '账号不存在或角色不匹配' }
    set((state) => {
      const account = state.accounts.find((item) =>
        item.role === role && (
          item.username === username ||
          item.id === username ||
          (username === 'admin' && item.id === 'admin-001') ||
          (username === 'zw001' && item.id === 'p-001')
        ),
      )
      if (!account) return state
      const expectedPassword = account.password ?? (role === 'admin' ? 'OPC@2026' : 'OPC123456')
      if (expectedPassword !== password) {
        result = { success: false, message: '账号或密码不正确' }
        return state
      }
      if (account.status === 'pending') {
        result = { success: false, message: '账号正在审核中，请等待后台通过后再登录' }
        return state
      }
      if (account.status === 'rejected') {
        result = { success: false, message: account.reviewNote ? `账号审核未通过：${account.reviewNote}` : '账号审核未通过' }
        return state
      }
      if (account.status === 'disabled') {
        result = { success: false, message: '账号已被后台停用，请联系管理员' }
        return state
      }
      const user: User = {
        id: account.id,
        name: account.name,
        phone: account.phone,
        role: account.role,
        region: account.region,
        industry: account.industry,
      }
      result = { success: true, user }
      return { ...state, user, isAuthenticated: true }
    })
    return result
  },
  registerAccount: (account) => {
    let result: { success: boolean; message?: string } = { success: true }
    set((state) => {
      const exists = state.accounts.some((item) => item.phone === account.phone)
      if (exists) {
        result = { success: false, message: '该手机号已注册或正在审核' }
        return state
      }
      return { accounts: [...state.accounts, account] }
    })
    return result
  },
  resolveInviteCode: (inviteCode) => {
    const code = normalizeInviteCode(inviteCode)
    if (!code) return { success: true }

    const parent = get().accounts.find((account) =>
      account.role === 'partner' &&
      account.status === 'approved' &&
      account.relation === 'primary' &&
      getPartnerInviteCode(account) === code,
    )

    if (!parent) {
      return { success: false, message: '邀请码不存在或对应合伙人未通过审核' }
    }

    return { success: true, parent }
  },
  updateAccount: (id, patch) =>
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === id ? { ...account, ...patch } : account,
      ),
    })),
  reviewAccount: (id, approved, note) =>
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === id
          ? {
              ...account,
              status: approved ? 'approved' as const : 'rejected' as const,
              reviewedAt: new Date().toISOString(),
              reviewNote: note,
            }
          : account,
      ),
    })),
  disableAccount: (id, disabled) =>
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === id
          ? { ...account, status: disabled ? 'disabled' as const : 'approved' as const, reviewedAt: new Date().toISOString() }
          : account,
      ),
    })),
  removeAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.filter((account) => account.id !== id),
      user: state.user?.id === id ? null : state.user,
      isAuthenticated: state.user?.id === id ? false : state.isAuthenticated,
    })),
  logout: () => set({ user: null, isAuthenticated: false }),
})
