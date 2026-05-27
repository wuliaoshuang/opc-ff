import type { StateCreator } from 'zustand'
import type { CrmProject, ProjectStage, ContactPerson, FollowupLog, ProjectPhase16, FilingStatus } from '@/types'
import { mockCrmProjects } from '@/mocks/data/crm'
import { addDays } from '@/lib/v1-config'
import { projectPhase16Labels } from '@/types'

export interface CrmSlice {
  projects: CrmProject[]
  addProject: (project: CrmProject) => void
  deleteProject: (id: string) => void
  updateProjectStage: (id: string, stage: ProjectStage) => void
  updateProjectDetails: (id: string, patch: Partial<CrmProject>) => void
  updateProjectPhase16: (id: string, phase: ProjectPhase16, operator?: string) => void
  submitProjectFiling: (params: { leadId?: string; companyName: string; industry: string; partnerId: string; partnerName: string; note?: string }) => CrmProject
  reviewProjectFiling: (id: string, approved: boolean, note?: string) => void
  updateProjectReferrer: (id: string, partnerId: string, partnerName: string) => void
  updateContact: (id: string, contact: ContactPerson) => void
  fillContactAndAdvance: (id: string, contact: ContactPerson) => void
  requestOnlineMeeting: (id: string) => void
  confirmOnlineMeeting: (id: string) => void
  signProject: (id: string, note: string, contractAmount?: number) => void
  addFollowupLog: (id: string, log: FollowupLog) => void
  updateContactPerson: (id: string, contact: ContactPerson) => void
  releaseProjectByCompany: (companyName: string, reason?: string) => void
  updateProjectOwnerByCompany: (companyName: string, partnerId: string, partnerName: string, reason?: string) => void
}

export const createCrmSlice: StateCreator<CrmSlice> = (set) => ({
  projects: mockCrmProjects,
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
    })),
  updateProjectDetails: (id, patch) =>
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id ? { ...project, ...patch } : project,
      ),
    })),
  updateProjectPhase16: (id, phase, operator = '管理员') =>
    set((state) => ({
      projects: state.projects.map((project) => {
        if (project.id !== id) return project
        const now = new Date().toISOString().split('T')[0]
        return {
          ...project,
          projectPhase16: phase,
          followupLogs: [
            ...project.followupLogs,
            { date: now, action: '更新16阶段进度', result: `${operator}将项目推进至${projectPhase16Labels[phase]}` },
          ],
        }
      }),
    })),
  submitProjectFiling: (params) => {
    const now = new Date().toISOString().split('T')[0]
    const contactDeadline = addDays(30)
    const meetingDeadline = addDays(60)
    const project: CrmProject = {
      id: `crm-filing-${Date.now()}`,
      leadId: params.leadId,
      companyName: params.companyName,
      industry: params.industry,
      ownerPartnerId: params.partnerId,
      ownerPartnerName: params.partnerName,
      referrerPartnerId: params.partnerId,
      referrerPartnerName: params.partnerName,
      stage: 'applied',
      appliedAt: now,
      contactDeadline,
      meetingDeadline,
      isExclusive: false,
      isOverdue: false,
      source: 'filing',
      filingStatus: 'pending',
      filingSubmittedAt: now,
      filingNote: params.note,
      projectPhase16: 'filing_review',
      bindingTags: ['备案'],
      followupLogs: [
        { date: now, action: '提交项目备案', result: params.note || '等待后台管理员审核' },
      ],
    }
    set((state) => ({ projects: [project, ...state.projects] }))
    return project
  },
  reviewProjectFiling: (id, approved, note) =>
    set((state) => ({
      projects: state.projects.map((project) => {
        if (project.id !== id) return project
        const now = new Date().toISOString().split('T')[0]
        const exclusiveEnd = addDays(60)
        const filingStatus: FilingStatus = approved ? 'approved' : 'rejected'
        return {
          ...project,
          filingStatus,
          filingReviewedAt: now,
          filingNote: note,
          stage: approved ? 'exclusive' : project.stage,
          projectPhase16: approved ? 'priority_exclusive' : 'filing_review',
          exclusiveStart: approved ? now : project.exclusiveStart,
          exclusiveEnd: approved ? exclusiveEnd : project.exclusiveEnd,
          isExclusive: approved,
          bindingTags: Array.from(new Set([...(project.bindingTags ?? []), '备案' as const])),
          followupLogs: [
            ...project.followupLogs,
            { date: now, action: approved ? '备案审核通过' : '备案审核驳回', result: approved ? `进入2个月优先排他期，保护至 ${exclusiveEnd}` : (note || '请补充资料后重新提交') },
          ],
        }
      }),
    })),
  updateProjectReferrer: (id, partnerId, partnerName) =>
    set((state) => ({
      projects: state.projects.map((project) => {
        if (project.id !== id) return project
        const now = new Date().toISOString().split('T')[0]
        return {
          ...project,
          referrerPartnerId: partnerId,
          referrerPartnerName: partnerName,
          ownerPartnerId: project.ownerPartnerId ?? partnerId,
          ownerPartnerName: project.ownerPartnerName ?? partnerName,
          followupLogs: [
            ...project.followupLogs,
            { date: now, action: '后台编辑推荐人绑定', result: `推荐人调整为 ${partnerName}` },
          ],
        }
      }),
    })),
  updateProjectStage: (id, stage) =>
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== id) return p
        const now = new Date().toISOString().split('T')[0]
        return {
          ...p,
          stage,
          projectPhase16: stage === 'signed' ? 'signed_execute' : stage === 'exclusive' ? 'priority_exclusive' : p.projectPhase16,
          isExclusive: stage === 'exclusive' ? true : stage === 'signed' || stage === 'released' ? false : p.isExclusive,
          isOverdue: stage === 'signed' ? false : p.isOverdue,
          followupLogs: [
            ...p.followupLogs,
            { date: now, action: '后台更新项目阶段', result: `项目阶段更新为 ${stage}` },
          ],
        }
      }),
    })),
  updateContact: (id, contact) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, contactPerson: contact } : p,
      ),
    })),
  fillContactAndAdvance: (id, contact) =>
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== id || p.stage !== 'applied') return p
        const now = new Date().toISOString().split('T')[0]
        return {
          ...p,
          stage: 'contact_filled' as ProjectStage,
          contactPerson: contact,
          followupLogs: [
            ...p.followupLogs,
            { date: now, action: '填写对接人信息', result: `${contact.name}（${contact.role}）已确认` },
          ],
        }
      }),
    })),
  requestOnlineMeeting: (id) =>
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== id || p.stage !== 'contact_filled') return p
        const now = new Date().toISOString().split('T')[0]
        return {
          ...p,
          stage: 'online_meeting' as ProjectStage,
          followupLogs: [
            ...p.followupLogs,
            { date: now, action: '申请线上接洽', result: '已提交申请，等待平台安排' },
          ],
        }
      }),
    })),
  confirmOnlineMeeting: (id) =>
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== id) return p
        const now = new Date().toISOString().split('T')[0]
        const exclusiveEnd = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
        return {
          ...p,
          stage: 'exclusive' as ProjectStage,
          projectPhase16: 'priority_exclusive',
          exclusiveStart: now,
          exclusiveEnd,
          isExclusive: true,
          followupLogs: [
            ...p.followupLogs,
            { date: now, action: '线上接洽完成', result: `已进入180天排他保护期，保护至 ${exclusiveEnd}` },
          ],
        }
      }),
    })),
  signProject: (id, note, contractAmount) =>
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== id) return p
        const now = new Date().toISOString().split('T')[0]
        return {
          ...p,
          stage: 'signed' as ProjectStage,
          projectPhase16: 'signed_execute',
          contractAmount,
          isExclusive: false,
          isOverdue: false,
          followupLogs: [
            ...p.followupLogs,
            {
              date: now,
              action: '确认签单',
              result: note || (contractAmount ? `项目已签单，合同金额¥${contractAmount.toLocaleString()}，进入结算流程` : '项目已签单，进入结算流程'),
            },
          ],
        }
      }),
    })),
  addFollowupLog: (id, log) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, followupLogs: [...p.followupLogs, log] } : p,
      ),
    })),
  updateContactPerson: (id, contact) =>
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== id) return p
        const now = new Date().toISOString().split('T')[0]
        return {
          ...p,
          contactPerson: contact,
          followupLogs: [
            ...p.followupLogs,
            { date: now, action: '更新对接人信息', result: `${contact.name}（${contact.role}）信任度${contact.trustLevel}/决策度${contact.decisionLevel}` },
          ],
        }
      }),
    })),
  releaseProjectByCompany: (companyName, reason = '客户绑定已释放，项目同步回到公海') =>
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.companyName !== companyName || p.stage === 'signed' || p.stage === 'released') return p
        const now = new Date().toISOString().split('T')[0]
        return {
          ...p,
          stage: 'released' as ProjectStage,
          isExclusive: false,
          isOverdue: true,
          followupLogs: [
            ...p.followupLogs,
            { date: now, action: '释放归属', result: reason },
          ],
        }
      }),
    })),
  updateProjectOwnerByCompany: (companyName, partnerId, partnerName, reason = '后台客户绑定调整归属') =>
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.companyName !== companyName || p.stage === 'signed' || p.stage === 'released') return p
        const now = new Date().toISOString().split('T')[0]
        return {
          ...p,
          ownerPartnerId: partnerId,
          ownerPartnerName: partnerName,
          followupLogs: [
            ...p.followupLogs,
            { date: now, action: '后台调整项目归属', result: `${reason}：${partnerName}` },
          ],
        }
      }),
    })),
})
