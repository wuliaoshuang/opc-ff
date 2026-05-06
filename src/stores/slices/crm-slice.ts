import type { StateCreator } from 'zustand'
import type { CrmProject, ProjectStage, ContactPerson } from '@/types'
import { mockCrmProjects } from '@/mocks/data/crm'

export interface CrmSlice {
  projects: CrmProject[]
  addProject: (project: CrmProject) => void
  updateProjectStage: (id: string, stage: ProjectStage) => void
  updateContact: (id: string, contact: ContactPerson) => void
  fillContactAndAdvance: (id: string, contact: ContactPerson) => void
  requestOnlineMeeting: (id: string) => void
  releaseProjectByCompany: (companyName: string, reason?: string) => void
  updateProjectOwnerByCompany: (companyName: string, partnerId: string, partnerName: string, reason?: string) => void
}

export const createCrmSlice: StateCreator<CrmSlice> = (set) => ({
  projects: mockCrmProjects,
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
  updateProjectStage: (id, stage) =>
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== id) return p
        const now = new Date().toISOString().split('T')[0]
        return {
          ...p,
          stage,
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
        const exclusiveEnd = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
        return {
          ...p,
          stage: 'exclusive' as ProjectStage,
          exclusiveStart: now,
          exclusiveEnd,
          isExclusive: true,
          followupLogs: [
            ...p.followupLogs,
            { date: now, action: '线上接洽完成', result: `已进入180天排他保护期，保护至${exclusiveEnd}` },
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
