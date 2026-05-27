import { createTestStore } from '@/test/create-test-store'
import { isRegionVisible } from '@/lib/v1-config'
import type { AuthAccount } from '@/types'

function makeRegionAdmin(overrides: Partial<AuthAccount> = {}): AuthAccount {
  const now = '2026-05-26T00:00:00.000Z'
  return {
    id: 'admin-test',
    username: 'qa-region-admin',
    password: 'OPC@2026',
    name: '验收区域管理员',
    phone: '18800009999',
    role: 'admin',
    adminLevel: 'region_admin',
    adminRegionGroup: '华东',
    region: '华东',
    industry: '综合能源',
    market: '区域管理',
    workType: '区域管理员',
    idCardVerified: true,
    resourceTags: ['区域审核', '项目备案'],
    resourceKeywords: ['华东', '区域审核', '项目备案'],
    relation: 'primary',
    status: 'approved',
    submittedAt: now,
    reviewedAt: now,
    ...overrides,
  }
}

describe('后台管理员账号权限', () => {
  it('内置一个最大权限大管理员和四个区域管理员账号', () => {
    const store = createTestStore()
    const adminAccounts = store.getState().accounts.filter((account) => account.role === 'admin')

    expect(adminAccounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ username: 'admin', adminLevel: 'super_admin' }),
        expect.objectContaining({ username: 'east-admin', adminLevel: 'region_admin', adminRegionGroup: '华东' }),
        expect.objectContaining({ username: 'south-admin', adminLevel: 'region_admin', adminRegionGroup: '华南' }),
        expect.objectContaining({ username: 'north-admin', adminLevel: 'region_admin', adminRegionGroup: '华北' }),
        expect.objectContaining({ username: 'central-west-admin', adminLevel: 'region_admin', adminRegionGroup: '华中西' }),
      ]),
    )
  })

  it('最大权限大管理员登录后保留 super_admin 权限', () => {
    const store = createTestStore()
    const result = store.getState().loginWithAccount('admin', 'OPC@2026', 'admin')

    expect(result.success).toBe(true)
    expect(store.getState().user).toEqual(expect.objectContaining({
      role: 'admin',
      adminLevel: 'super_admin',
    }))
  })

  it('区域管理员可以登录，但只带自己的区域权限', () => {
    const store = createTestStore()
    const result = store.getState().loginWithAccount('east-admin', 'OPC@2026', 'admin')

    expect(result.success).toBe(true)
    expect(store.getState().user).toEqual(expect.objectContaining({
      role: 'admin',
      adminLevel: 'region_admin',
      adminRegionGroup: '华东',
    }))
  })

  it('创建区域管理员会拦截重复系统账号和手机号', () => {
    const store = createTestStore()
    const first = store.getState().createAdminAccount(makeRegionAdmin())
    const duplicateUsername = store.getState().createAdminAccount(makeRegionAdmin({
      id: 'admin-test-2',
      phone: '18800008888',
    }))
    const duplicatePhone = store.getState().createAdminAccount(makeRegionAdmin({
      id: 'admin-test-3',
      username: 'qa-region-admin-3',
    }))

    expect(first.success).toBe(true)
    expect(duplicateUsername).toEqual({ success: false, message: '系统账号已存在' })
    expect(duplicatePhone).toEqual({ success: false, message: '手机号已存在' })
  })

  it('后台可创建合伙人账号并拦截重复账号和手机号', () => {
    const store = createTestStore()
    const partner: AuthAccount = {
      id: 'partner-admin-created',
      username: 'created-partner',
      password: 'OPC123456',
      name: '后台新增合伙人',
      phone: '13900009999',
      role: 'partner',
      region: '上海',
      industry: '综合能源',
      market: '综合能源',
      workType: '渠道商',
      idCardVerified: false,
      resourceTags: ['行业协会', '园区资源'],
      resourceSurvey: {
        resourceTypes: ['行业协会', '园区资源'],
        keyPositions: '能源管理部',
        publicRoles: '协会理事',
        associationCircles: '上海节能协会',
        notes: '后台创建验收',
      },
      relation: 'primary',
      status: 'approved',
      submittedAt: '2026-05-26T00:00:00.000Z',
      reviewedAt: '2026-05-26T00:00:00.000Z',
    }

    expect(store.getState().createPartnerAccount(partner)).toEqual({ success: true })
    expect(store.getState().accounts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'partner-admin-created',
        role: 'partner',
        status: 'approved',
        resourceKeywords: expect.arrayContaining(['上海', '综合能源', '行业协会', '能源管理部']),
      }),
    ]))

    expect(store.getState().createPartnerAccount({ ...partner, id: 'partner-dup-username', phone: '13900008888' })).toEqual({
      success: false,
      message: '系统账号已存在',
    })
    expect(store.getState().createPartnerAccount({ ...partner, id: 'partner-dup-phone', username: 'created-partner-2' })).toEqual({
      success: false,
      message: '手机号已存在',
    })
  })

  it('后台重置密码后旧密码失效，新密码可登录', () => {
    const store = createTestStore()
    const result = store.getState().resetAccountPassword('admin-east', 'NewPass2026')

    expect(result).toEqual({ success: true })
    expect(store.getState().loginWithAccount('east-admin', 'OPC@2026', 'admin')).toEqual({
      success: false,
      message: '账号或密码不正确',
    })
    expect(store.getState().loginWithAccount('east-admin', 'NewPass2026', 'admin').success).toBe(true)
  })

  it('store 层保护最大权限大管理员不能被停用或删除', () => {
    const store = createTestStore()
    store.getState().loginWithAccount('admin', 'OPC@2026', 'admin')

    store.getState().disableAccount('admin-001', true)
    expect(store.getState().accounts.find((account) => account.id === 'admin-001')).toEqual(expect.objectContaining({
      adminLevel: 'super_admin',
      status: 'approved',
    }))

    store.getState().removeAccount('admin-001')
    expect(store.getState().accounts.find((account) => account.id === 'admin-001')).toEqual(expect.objectContaining({
      username: 'admin',
      adminLevel: 'super_admin',
    }))
    expect(store.getState().isAuthenticated).toBe(true)
    expect(store.getState().user).toEqual(expect.objectContaining({ id: 'admin-001' }))
  })

  it('停用区域管理员后不能再登录，重新启用后可以登录', () => {
    const store = createTestStore()
    store.getState().disableAccount('admin-east', true)

    expect(store.getState().loginWithAccount('east-admin', 'OPC@2026', 'admin')).toEqual({
      success: false,
      message: '账号已被后台停用，请联系管理员',
    })

    store.getState().disableAccount('admin-east', false)

    expect(store.getState().loginWithAccount('east-admin', 'OPC@2026', 'admin').success).toBe(true)
  })

  it('区域可见性按四个区域组隔离', () => {
    expect(isRegionVisible('华东', '上海')).toBe(true)
    expect(isRegionVisible('华东', '杭州')).toBe(true)
    expect(isRegionVisible('华东', '北京')).toBe(false)
    expect(isRegionVisible('华南', '深圳')).toBe(true)
    expect(isRegionVisible('华北', '大连')).toBe(true)
    expect(isRegionVisible('华中西', '成都')).toBe(true)
  })
})
