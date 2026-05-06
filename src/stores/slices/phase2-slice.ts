import type { StateCreator } from 'zustand'
import type {
  CustomerBinding,
  TrainingResource,
  AigcTemplate,
  AigcHistory,
  RedPacketTask,
  CommissionRecord,
  IncentiveTask,
  SubPartner,
  BindingStage,
  BindingHistoryEntry,
  BindingType,
} from '@/types'
import {
  mockBindings,
  mockSubPartners,
  mockTrainingResources,
  mockAigcTemplates,
  mockAigcHistory,
  mockRedPacketTasks,
  mockCommissions,
  mockIncentiveTasks,
} from '@/mocks/data/phase2'

export interface Phase2Slice {
  bindings: CustomerBinding[]
  subPartners: SubPartner[]
  trainingResources: TrainingResource[]
  aigcTemplates: AigcTemplate[]
  aigcHistory: AigcHistory[]
  redPacketTasks: RedPacketTask[]
  commissions: CommissionRecord[]
  incentiveTasks: IncentiveTask[]
  addBinding: (binding: CustomerBinding) => void
  checkConflict: (customerName: string) => CustomerBinding | null
  addManualBinding: (customerName: string, industry: string, partnerId: string, partnerName: string) => { success: boolean; conflict?: CustomerBinding }
  advanceBindingStage: (id: string, action: string) => void
  releaseBinding: (id: string) => void
  fillContactInfo: (id: string, contactPerson: string, contactRole: string) => void
  applyOnlineMeeting: (id: string) => void
  addSubPartner: (sub: SubPartner) => void
  removeSubPartner: (id: string) => void
  updateSubPartnerStatus: (id: string, status: 'active' | 'inactive') => void
  reassignBinding: (id: string, partnerId: string, partnerName: string, operator?: string) => void
  extendBinding: (id: string, days: number, operator?: string) => void
  addTrainingResource: (resource: TrainingResource) => void
  updateTrainingResource: (id: string, patch: Partial<TrainingResource>) => void
  deleteTrainingResource: (id: string) => void
  addAigcTemplate: (template: AigcTemplate) => void
  updateAigcTemplate: (id: string, patch: Partial<AigcTemplate>) => void
  deleteAigcTemplate: (id: string) => void
  addAigcHistory: (item: AigcHistory) => void
  deleteAigcHistory: (id: string) => void
  toggleAigcExample: (id: string) => void
  claimRedPacket: (id: string, partnerId?: string, partnerName?: string) => void
  submitEvidence: (id: string, evidence: { images: string[]; description: string }) => void
  reviewRedPacket: (id: string, approved: boolean, note?: string) => void
  addIncentiveTask: (task: IncentiveTask) => void
  approveIncentiveTask: (id: string) => void
  closeIncentiveTask: (id: string) => void
  addCommission: (commission: CommissionRecord) => void
  updateCommission: (id: string, patch: Partial<CommissionRecord>) => void
  signProjectAndCreateCommissions: (params: {
    projectId: string
    projectName: string
    partnerId: string
    partnerName: string
    contractAmount: number
    shortTermRate: number
    longTermRate: number
  }) => void
}

const stageOrder: BindingStage[] = ['temporary', 'locked', 'exclusive']

export const createPhase2Slice: StateCreator<Phase2Slice> = (set, get) => ({
  bindings: mockBindings,
  subPartners: mockSubPartners,
  trainingResources: mockTrainingResources,
  aigcTemplates: mockAigcTemplates,
  aigcHistory: mockAigcHistory,
  redPacketTasks: mockRedPacketTasks,
  commissions: mockCommissions,
  incentiveTasks: mockIncentiveTasks,

  checkConflict: (customerName) => {
    const found = get().bindings.find(
      (b) => b.customerName === customerName && b.stage !== 'released' && b.status === 'active',
    )
    return found ?? null
  },

  addBinding: (binding) =>
    set((state) => ({ bindings: [...state.bindings, binding] })),

  addManualBinding: (customerName, industry, partnerId, partnerName) => {
    const conflict = get().checkConflict(customerName)
    if (conflict) return { success: false, conflict }

    const now = new Date()
    const expired = new Date(now)
    expired.setDate(expired.getDate() + 30)

    const newBinding: CustomerBinding = {
      id: `bind-${Date.now()}`,
      customerId: `cust-${Date.now()}`,
      customerName,
      industry,
      partnerId,
      partnerName,
      bindingType: 'manual' as BindingType,
      stage: 'temporary' as BindingStage,
      status: 'active',
      boundAt: now.toISOString().split('T')[0],
      expiredAt: expired.toISOString().split('T')[0],
      linkedProjects: 0,
      history: [{ date: now.toISOString().split('T')[0], from: 'released' as BindingStage, to: 'temporary' as BindingStage, action: '主动登记私有资源', operator: partnerName }],
    }

    set((state) => ({ bindings: [...state.bindings, newBinding] }))
    return { success: true }
  },

  advanceBindingStage: (id, action) =>
    set((state) => ({
      bindings: state.bindings.map((b) => {
        if (b.id !== id || b.stage === 'released') return b
        const idx = stageOrder.indexOf(b.stage)
        if (idx >= stageOrder.length - 1) return b
        const next = stageOrder[idx + 1]
        const now = new Date().toISOString().split('T')[0]
        const entry: BindingHistoryEntry = { date: now, from: b.stage, to: next, action, operator: b.partnerName }

        let newExpired = b.expiredAt
        if (next === 'locked') {
          const d = new Date(); d.setDate(d.getDate() + 60); newExpired = d.toISOString().split('T')[0]
        } else if (next === 'exclusive') {
          const d = new Date(); d.setDate(d.getDate() + 180); newExpired = d.toISOString().split('T')[0]
        }

        return { ...b, stage: next, expiredAt: newExpired, history: [...b.history, entry] }
      }),
    })),

  releaseBinding: (id) =>
    set((state) => ({
      bindings: state.bindings.map((b) => {
        if (b.id !== id) return b
        const now = new Date().toISOString().split('T')[0]
        const entry: BindingHistoryEntry = { date: now, from: b.stage, to: 'released' as BindingStage, action: '未达成阶段目标，自动释放', operator: 'b.partnerName' }
        return { ...b, stage: 'released' as BindingStage, status: 'inactive' as const, history: [...b.history, entry] }
      }),
    })),

  reassignBinding: (id, partnerId, partnerName, operator = '管理员') =>
    set((state) => ({
      bindings: state.bindings.map((b) => {
        if (b.id !== id || b.stage === 'released') return b
        const now = new Date().toISOString().split('T')[0]
        return {
          ...b,
          partnerId,
          partnerName,
          history: [
            ...b.history,
            { date: now, from: b.stage, to: b.stage, action: `后台调整归属为${partnerName}`, operator },
          ],
        }
      }),
    })),

  extendBinding: (id, days, operator = '管理员') =>
    set((state) => ({
      bindings: state.bindings.map((b) => {
        if (b.id !== id || b.stage === 'released') return b
        const base = new Date(b.expiredAt)
        base.setDate(base.getDate() + days)
        const now = new Date().toISOString().split('T')[0]
        return {
          ...b,
          expiredAt: base.toISOString().split('T')[0],
          history: [
            ...b.history,
            { date: now, from: b.stage, to: b.stage, action: `后台延长保护期${days}天`, operator },
          ],
        }
      }),
    })),

  fillContactInfo: (id, contactPerson: string, contactRole: string) =>
    set((state) => ({
      bindings: state.bindings.map((b) => {
        if (b.id !== id || b.stage !== 'temporary') return b
        const now = new Date().toISOString().split('T')[0]
        const entry: BindingHistoryEntry = {
          date: now, from: 'temporary' as BindingStage, to: 'locked' as BindingStage,
          action: `补全对接人信息：${contactPerson}（${contactRole}）`,
          operator: b.partnerName,
        }
        const d = new Date(); d.setDate(d.getDate() + 60)
        return { ...b, stage: 'locked' as BindingStage, expiredAt: d.toISOString().split('T')[0], contactPerson, contactRole, history: [...b.history, entry] }
      }),
    })),

  applyOnlineMeeting: (id) =>
    set((state) => ({
      bindings: state.bindings.map((b) => {
        if (b.id !== id || b.stage !== 'locked') return b
        const now = new Date().toISOString().split('T')[0]
        const entry: BindingHistoryEntry = {
          date: now, from: 'locked' as BindingStage, to: 'locked' as BindingStage,
          action: '申请线上接洽，等待平台确认',
          operator: b.partnerName,
        }
        return { ...b, history: [...b.history, entry] }
      }),
    })),

  addAigcHistory: (item) =>
    set((state) => ({ aigcHistory: [item, ...state.aigcHistory] })),
  deleteAigcHistory: (id) =>
    set((state) => ({ aigcHistory: state.aigcHistory.filter((item) => item.id !== id) })),
  toggleAigcExample: (id) =>
    set((state) => ({
      aigcHistory: state.aigcHistory.map((item) =>
        item.id === id ? { ...item, isExample: !item.isExample } : item,
      ),
    })),
  addTrainingResource: (resource) =>
    set((state) => ({ trainingResources: [resource, ...state.trainingResources] })),
  updateTrainingResource: (id, patch) =>
    set((state) => ({
      trainingResources: state.trainingResources.map((item) =>
        item.id === id ? { ...item, ...patch, updatedAt: patch.updatedAt ?? new Date().toISOString().split('T')[0] } : item,
      ),
    })),
  deleteTrainingResource: (id) =>
    set((state) => ({ trainingResources: state.trainingResources.filter((item) => item.id !== id) })),
  addAigcTemplate: (template) =>
    set((state) => ({ aigcTemplates: [template, ...state.aigcTemplates] })),
  updateAigcTemplate: (id, patch) =>
    set((state) => ({
      aigcTemplates: state.aigcTemplates.map((item) =>
        item.id === id ? { ...item, ...patch, updatedAt: patch.updatedAt ?? new Date().toISOString().split('T')[0] } : item,
      ),
    })),
  deleteAigcTemplate: (id) =>
    set((state) => ({ aigcTemplates: state.aigcTemplates.filter((item) => item.id !== id) })),
  claimRedPacket: (id, partnerId, partnerName) =>
    set((state) => ({
      redPacketTasks: state.redPacketTasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'executing' as const,
              claimedById: partnerId,
              claimedByName: partnerName,
              claimedAt: new Date().toISOString().split('T')[0],
            }
          : t,
      ),
    })),
  submitEvidence: (id, evidence) =>
    set((state) => ({
      redPacketTasks: state.redPacketTasks.map((t) =>
        t.id === id
          ? { ...t, status: 'evidence_submitted' as const, evidence: { ...evidence, submittedAt: new Date().toISOString().split('T')[0] }, reviewNote: undefined }
          : t,
      ),
    })),
  reviewRedPacket: (id, approved, note) =>
    set((state) => {
      const task = state.redPacketTasks.find((t) => t.id === id)
      const now = new Date().toISOString().split('T')[0]
      const alreadyRecorded = state.commissions.some((commission) => commission.id === `rp-comm-${id}`)
      return {
        redPacketTasks: state.redPacketTasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status: approved ? 'paid' as const : 'rejected' as const,
                paidAt: approved ? now : t.paidAt,
                reviewNote: note,
              }
            : t,
        ),
        commissions: approved && task && task.claimedById && !alreadyRecorded
          ? [
              {
                id: `rp-comm-${id}`,
                projectName: task.projectName,
                partnerId: task.claimedById,
                amount: task.amount,
                type: 'short_term' as const,
                level: 'primary' as const,
                status: 'settled' as const,
                settledAt: now,
                paidAt: now,
                commissionRate: '红包任务',
                month: now.slice(0, 7),
                sourceType: 'red_packet' as const,
                reviewNote: note,
                operator: '管理员',
              },
              ...state.commissions,
            ]
          : state.commissions,
      }
    }),
  addIncentiveTask: (task) =>
    set((state) => ({ incentiveTasks: [...state.incentiveTasks, task] })),
  approveIncentiveTask: (id) =>
    set((state) => ({
      incentiveTasks: state.incentiveTasks.map((t) =>
        t.id === id ? { ...t, status: 'published' as const } : t,
      ),
      redPacketTasks: state.incentiveTasks.some((t) => t.id === id)
        ? [
            ...state.redPacketTasks,
            ...state.incentiveTasks
              .filter((t) => t.id === id && t.status === 'draft')
              .map((t) => ({
                id: `rp-${t.id}`,
                name: t.name,
                projectName: t.projectName,
                amount: t.amount,
                description: '合伙人发起，经平台审核后发布的红包任务',
                requirements: t.requirements ?? '按任务要求完成项目推进动作，并上传现场照片、沟通纪要或其他可审核凭证。',
                createdAt: t.createdAt ?? new Date().toISOString(),
                deadline: t.deadline,
                status: 'available' as const,
                createdBy: t.createdBy === 'platform' ? 'platform' as const : 'partner' as const,
              })),
          ]
        : state.redPacketTasks,
    })),
  closeIncentiveTask: (id) =>
    set((state) => ({
      incentiveTasks: state.incentiveTasks.map((task) =>
        task.id === id ? { ...task, status: 'closed' as const } : task,
      ),
    })),
  addCommission: (commission) =>
    set((state) => ({ commissions: [commission, ...state.commissions] })),
  updateCommission: (id, patch) =>
    set((state) => ({
      commissions: state.commissions.map((commission) =>
        commission.id === id ? { ...commission, ...patch } : commission,
      ),
    })),
  addSubPartner: (sub) =>
    set((state) => ({ subPartners: [...state.subPartners, sub] })),
  removeSubPartner: (id) =>
    set((state) => ({ subPartners: state.subPartners.filter((s) => s.id !== id) })),
  updateSubPartnerStatus: (id, status) =>
    set((state) => ({
      subPartners: state.subPartners.map((s) =>
        s.id === id ? { ...s, status } : s,
      ),
    })),
  signProjectAndCreateCommissions: ({ projectId, projectName, partnerId, partnerName, contractAmount, shortTermRate, longTermRate }) =>
    set((state) => {
      const now = new Date().toISOString().split('T')[0]
      const month = now.slice(0, 7)
      const shortTermAmount = Math.round(contractAmount * shortTermRate)
      const longTermAmount = Math.round(contractAmount * longTermRate)

      const newCommissions: CommissionRecord[] = [
        // 一级短期佣金
        {
          id: `comm-sign-${projectId}-short`,
          projectName,
          projectId,
          partnerId,
          amount: shortTermAmount,
          type: 'short_term',
          level: 'primary',
          status: 'pending',
          commissionRate: `${(shortTermRate * 100).toFixed(0)}%`,
          month,
          sourceType: 'project',
          reviewNote: '签单自动生成',
          operator: '管理员',
        },
        // 一级长期佣金
        {
          id: `comm-sign-${projectId}-long`,
          projectName,
          projectId,
          partnerId,
          amount: longTermAmount,
          type: 'long_term',
          level: 'primary',
          status: 'pending',
          commissionRate: `${(longTermRate * 100).toFixed(0)}%`,
          month,
          sourceType: 'project',
          reviewNote: '签单自动生成',
          operator: '管理员',
        },
      ]

      // 二级分佣：遍历该合伙人名下的活跃二级合伙人
      const activeSubPartners = state.subPartners.filter(
        (s) => s.parentId === partnerId && s.status === 'active',
      )
      for (const sub of activeSubPartners) {
        const secondaryRate = shortTermRate * 0.3 // 二级佣金为一级短期的 30%
        newCommissions.push({
          id: `comm-sign-${projectId}-sub-${sub.id}`,
          projectName,
          projectId,
          partnerId: sub.id,
          amount: Math.round(contractAmount * secondaryRate),
          type: 'short_term',
          level: 'secondary',
          parentPartnerId: partnerId,
          parentPartnerName: partnerName,
          status: 'pending',
          commissionRate: `${(secondaryRate * 100).toFixed(1)}%`,
          month,
          sourceType: 'project',
          reviewNote: '签单自动生成',
          operator: '管理员',
        })
      }

      return { commissions: [...newCommissions, ...state.commissions] }
    }),
})
