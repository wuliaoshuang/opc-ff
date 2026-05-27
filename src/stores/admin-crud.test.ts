import { createTestStore } from '@/test/create-test-store'
import type { AdminLeadRecord, CommissionRecord, CrmProject, CustomerBinding, IncentiveTask, ProductItem, TrainingResource, WhiteLabelConfig } from '@/types'

describe('后台管理 CRUD 基础能力', () => {
  it('线索管理支持后台新增、编辑和删除线索', () => {
    const store = createTestStore()
    const lead: AdminLeadRecord = {
      id: 'lead-test',
      companyName: '验收线索客户',
      industry: '制造业',
      region: '上海',
      isListed: false,
      revenue: '10亿',
      energyUsage: '年用电 3000 万度',
      aiMatchScore: 82,
      status: 'available',
      grade: 'B',
      projectInfo: '新建综合能源项目',
      businessInfo: '需补充商务信息',
      createdAt: '2026-05-26',
      updatedAt: '2026-05-26',
    }

    store.getState().addAdminLead(lead)
    expect(store.getState().adminLeads).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'lead-test', companyName: '验收线索客户' }),
    ]))

    store.getState().updateAdminLead('lead-test', { aiMatchScore: 91, assignedPartner: '张伟' })
    expect(store.getState().adminLeads.find((item) => item.id === 'lead-test')).toEqual(expect.objectContaining({
      aiMatchScore: 91,
      assignedPartner: '张伟',
    }))

    store.getState().deleteAdminLead('lead-test')
    expect(store.getState().adminLeads.some((item) => item.id === 'lead-test')).toBe(false)
  })

  it('总项目表支持新增、编辑和删除项目', () => {
    const store = createTestStore()
    const project: CrmProject = {
      id: 'crm-test',
      companyName: '验收项目客户',
      industry: '综合能源',
      ownerPartnerId: 'p-001',
      ownerPartnerName: '张伟',
      stage: 'applied',
      appliedAt: '2026-05-26',
      contactDeadline: '2026-06-25',
      meetingDeadline: '2026-07-25',
      isExclusive: false,
      isOverdue: false,
      source: 'manual',
      filingStatus: 'none',
      projectPhase16: 'lead_in',
      followupLogs: [],
    }

    store.getState().addProject(project)
    expect(store.getState().projects).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'crm-test', companyName: '验收项目客户' }),
    ]))

    store.getState().updateProjectDetails('crm-test', { industry: '节能改造', filingStatus: 'pending' })
    expect(store.getState().projects.find((item) => item.id === 'crm-test')).toEqual(expect.objectContaining({
      industry: '节能改造',
      filingStatus: 'pending',
    }))

    store.getState().deleteProject('crm-test')
    expect(store.getState().projects.some((item) => item.id === 'crm-test')).toBe(false)
  })

  it('激励任务支持后台新增、编辑、发布、关闭和删除', () => {
    const store = createTestStore()
    const task: IncentiveTask = {
      id: 'task-test',
      name: '验收红包任务',
      projectName: '验收项目',
      amount: 1888,
      applicantCount: 0,
      createdAt: '2026-05-26',
      status: 'draft',
      createdBy: 'platform',
      deadline: '2026-06-26',
      requirements: '上传拜访纪要',
    }

    store.getState().addIncentiveTask(task)
    store.getState().updateIncentiveTask('task-test', { amount: 2888, requirements: '上传现场照片' })
    expect(store.getState().incentiveTasks.find((item) => item.id === 'task-test')).toEqual(expect.objectContaining({
      amount: 2888,
      requirements: '上传现场照片',
    }))

    store.getState().approveIncentiveTask('task-test')
    expect(store.getState().incentiveTasks.find((item) => item.id === 'task-test')?.status).toBe('published')
    expect(store.getState().redPacketTasks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'rp-task-test', status: 'available' }),
    ]))

    store.getState().closeIncentiveTask('task-test')
    expect(store.getState().incentiveTasks.find((item) => item.id === 'task-test')?.status).toBe('closed')

    store.getState().deleteIncentiveTask('task-test')
    expect(store.getState().incentiveTasks.some((item) => item.id === 'task-test')).toBe(false)
    expect(store.getState().redPacketTasks.some((item) => item.id === 'rp-task-test')).toBe(false)
  })

  it('分佣结算支持新增、编辑、作废和删除记录', () => {
    const store = createTestStore()
    const commission: CommissionRecord = {
      id: 'comm-test',
      projectName: '验收项目',
      partnerId: 'p-001',
      amount: 3000,
      type: 'short_term',
      level: 'primary',
      status: 'pending',
      commissionRate: '人工调整',
      month: '2026-05',
      sourceType: 'manual_adjustment',
      reviewNote: '验收新增',
      operator: '管理员',
    }

    store.getState().addCommission(commission)
    store.getState().updateCommission('comm-test', { amount: 3600, reviewNote: '已编辑' })
    expect(store.getState().commissions.find((item) => item.id === 'comm-test')).toEqual(expect.objectContaining({
      amount: 3600,
      reviewNote: '已编辑',
    }))

    store.getState().voidCommission('comm-test', '验收作废')
    expect(store.getState().commissions.find((item) => item.id === 'comm-test')).toEqual(expect.objectContaining({
      status: 'voided',
      reviewNote: '验收作废',
    }))

    store.getState().deleteCommission('comm-test')
    expect(store.getState().commissions.some((item) => item.id === 'comm-test')).toBe(false)
  })

  it('产品货架支持新增、编辑、上下线和删除', () => {
    const store = createTestStore()
    const product: ProductItem = {
      id: 'prod-test',
      name: '验收服务',
      category: '核心业务',
      description: '用于验证后台产品货架 CRUD。',
      commissionRate: '3%',
      status: 'inactive',
      trainingLinked: true,
    }

    store.getState().addProduct(product)
    expect(store.getState().products).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'prod-test', name: '验收服务', status: 'inactive' }),
    ]))

    store.getState().updateProduct('prod-test', { name: '验收服务已编辑', commissionRate: '5%' })
    expect(store.getState().products.find((item) => item.id === 'prod-test')).toEqual(expect.objectContaining({
      name: '验收服务已编辑',
      commissionRate: '5%',
    }))

    store.getState().toggleProductStatus('prod-test')
    expect(store.getState().products.find((item) => item.id === 'prod-test')?.status).toBe('active')

    store.getState().deleteProduct('prod-test')
    expect(store.getState().products.some((item) => item.id === 'prod-test')).toBe(false)
  })

  it('培训内容支持新增、编辑和删除', () => {
    const store = createTestStore()
    const resource: TrainingResource = {
      id: 'tr-test',
      title: '验收培训',
      category: 'process',
      type: 'doc',
      summary: '验证培训内容 CRUD。',
      content: '后台新增后，合伙人端应能读取已发布内容。',
      status: 'draft',
      updatedAt: '2026-05-26',
      createdBy: '测试',
      sortOrder: 99,
    }

    store.getState().addTrainingResource(resource)
    expect(store.getState().trainingResources).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'tr-test', status: 'draft' }),
    ]))

    store.getState().updateTrainingResource('tr-test', { status: 'published', summary: '已发布到合伙人端' })
    expect(store.getState().trainingResources.find((item) => item.id === 'tr-test')).toEqual(expect.objectContaining({
      status: 'published',
      summary: '已发布到合伙人端',
    }))

    store.getState().deleteTrainingResource('tr-test')
    expect(store.getState().trainingResources.some((item) => item.id === 'tr-test')).toBe(false)
  })

  it('绑定管理支持新增、改派、延期和释放', () => {
    const store = createTestStore()
    const result = store.getState().addManualBinding('验收客户', '制造业', 'p-001', '张伟')
    const created = store.getState().bindings.find((binding) => binding.customerName === '验收客户')

    expect(result.success).toBe(true)
    expect(created).toEqual(expect.objectContaining({
      customerName: '验收客户',
      partnerId: 'p-001',
      stage: 'temporary',
      status: 'active',
    }))

    store.getState().reassignBinding(created!.id, 'p-002', '李明')
    expect(store.getState().bindings.find((binding) => binding.id === created!.id)).toEqual(expect.objectContaining({
      partnerId: 'p-002',
      partnerName: '李明',
    }))

    const beforeExtend = store.getState().bindings.find((binding) => binding.id === created!.id)!.expiredAt
    store.getState().extendBinding(created!.id, 30)
    expect(store.getState().bindings.find((binding) => binding.id === created!.id)!.expiredAt).not.toBe(beforeExtend)

    store.getState().releaseBinding(created!.id)
    expect(store.getState().bindings.find((binding) => binding.id === created!.id)).toEqual(expect.objectContaining({
      stage: 'released',
      status: 'inactive',
    }))
  })

  it('客户绑定控制台支持后台新增、编辑和删除绑定', () => {
    const store = createTestStore()
    const binding: CustomerBinding = {
      id: 'bind-crud-test',
      customerId: 'cust-crud-test',
      customerName: '绑定CRUD客户',
      industry: '制造业',
      partnerId: 'p-001',
      partnerName: '张伟',
      bindingType: 'manual',
      stage: 'temporary',
      status: 'active',
      boundAt: '2026-05-26',
      expiredAt: '2026-06-25',
      contactPerson: '王主任',
      contactRole: '能源负责人',
      linkedProjects: 0,
      history: [{ date: '2026-05-26', from: 'released', to: 'temporary', action: '后台新增客户绑定', operator: '管理员' }],
    }

    store.getState().addBinding(binding)
    expect(store.getState().bindings).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'bind-crud-test', customerName: '绑定CRUD客户' }),
    ]))

    store.getState().updateBinding('bind-crud-test', {
      industry: '节能改造',
      partnerId: 'p-002',
      partnerName: '李明',
      stage: 'locked',
      contactRole: '设备科长',
    })
    expect(store.getState().bindings.find((item) => item.id === 'bind-crud-test')).toEqual(expect.objectContaining({
      industry: '节能改造',
      partnerId: 'p-002',
      stage: 'locked',
      contactRole: '设备科长',
    }))
    expect(store.getState().bindings.find((item) => item.id === 'bind-crud-test')?.history.at(-1)).toEqual(expect.objectContaining({
      from: 'temporary',
      to: 'locked',
      operator: '管理员',
    }))

    store.getState().deleteBinding('bind-crud-test')
    expect(store.getState().bindings.some((item) => item.id === 'bind-crud-test')).toBe(false)
  })

  it('贴牌配置支持保存、审核状态更新和删除', () => {
    const store = createTestStore()
    const config: WhiteLabelConfig = {
      partnerId: 'p-white-label-test',
      partnerName: '贴牌验收合伙人',
      systemName: '贴牌验收系统',
      logoUrl: '',
      primaryColor: '#0f63ff',
      contactEmail: 'brand@example.com',
      auditStatus: 'pending',
      auditNote: '后台提交审核',
    }

    store.getState().setPartnerWhiteLabelConfig('p-white-label-test', config)
    expect(store.getState().whiteLabelConfigs['p-white-label-test']).toEqual(expect.objectContaining({
      systemName: '贴牌验收系统',
      auditStatus: 'pending',
    }))

    store.getState().setPartnerWhiteLabelConfig('p-white-label-test', {
      ...config,
      auditStatus: 'approved',
      auditNote: '审核通过',
      approvedSnapshot: {
        systemName: config.systemName,
        logoUrl: config.logoUrl,
        primaryColor: config.primaryColor,
      },
    })
    expect(store.getState().whiteLabelConfigs['p-white-label-test']).toEqual(expect.objectContaining({
      auditStatus: 'approved',
      auditNote: '审核通过',
      approvedSnapshot: expect.objectContaining({ primaryColor: '#0f63ff' }),
    }))

    store.getState().deletePartnerWhiteLabelConfig('p-white-label-test')
    expect(store.getState().whiteLabelConfigs['p-white-label-test']).toBeUndefined()
  })
})
