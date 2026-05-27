import type { StateCreator } from 'zustand'
import type {
  AdminLeadRecord,
  PartnerPerformance,
  WhiteLabelConfig,
  ProductItem,
  BusinessToolFile,
} from '@/types'
import { mockAdminLeads, mockWhiteLabelConfigs, mockProducts } from '@/mocks/data/admin'
import { mockPartners } from '@/mocks/data/partners'

export interface AdminSlice {
  adminLeads: AdminLeadRecord[]
  partners: PartnerPerformance[]
  whiteLabelConfigs: Record<string, WhiteLabelConfig>
  products: ProductItem[]
  businessToolFiles: BusinessToolFile[]
  setAdminLeads: (leads: AdminLeadRecord[]) => void
  addAdminLead: (lead: AdminLeadRecord) => void
  updateAdminLead: (leadId: string, patch: Partial<AdminLeadRecord>) => void
  deleteAdminLead: (leadId: string) => void
  updateLeadAssignment: (leadId: string, partner: string) => void
  updateLeadAssignmentByCompany: (companyName: string, partner: string) => void
  releaseAdminLeadByCompany: (companyName: string) => void
  addPartnerPerformance: (partner: PartnerPerformance) => void
  updatePartnerPerformance: (partnerId: string, patch: Partial<PartnerPerformance>) => void
  removePartnerPerformance: (partnerId: string) => void
  addProduct: (product: ProductItem) => void
  updateProduct: (id: string, patch: Partial<ProductItem>) => void
  deleteProduct: (id: string) => void
  addBusinessToolFile: (file: BusinessToolFile) => void
  setPartnerWhiteLabelConfig: (partnerId: string, config: WhiteLabelConfig) => void
  deletePartnerWhiteLabelConfig: (partnerId: string) => void
  toggleProductStatus: (id: string) => void
}

export const createAdminSlice: StateCreator<AdminSlice> = (set) => ({
  adminLeads: mockAdminLeads,
  partners: mockPartners,
  whiteLabelConfigs: mockWhiteLabelConfigs,
  products: mockProducts,
  businessToolFiles: [
    { id: 'tool-001', title: '综合能源项目手册', category: 'manual', fileName: '综合能源项目手册.pdf', uploadedBy: '管理员', uploadedAt: '2026-05-01' },
    { id: 'tool-002', title: '首次拜访宣传资料', category: 'material', fileName: '首次拜访宣传资料.pptx', uploadedBy: '管理员', uploadedAt: '2026-05-02' },
    { id: 'tool-003', title: '设备科长沟通话术', category: 'script', fileName: '设备科长沟通话术.docx', uploadedBy: '管理员', uploadedAt: '2026-05-03' },
    { id: 'tool-004', title: '业务QA知识卡', category: 'qa', fileName: '业务QA知识卡.xlsx', uploadedBy: '管理员', uploadedAt: '2026-05-04' },
    { id: 'tool-005', title: '课程回顾：备案流程', category: 'course', fileName: '备案流程回顾.mp4', uploadedBy: '管理员', uploadedAt: '2026-05-05' },
  ],
  setAdminLeads: (leads) => set({ adminLeads: leads }),
  addAdminLead: (lead) =>
    set((state) => ({ adminLeads: [lead, ...state.adminLeads] })),
  updateAdminLead: (leadId, patch) =>
    set((state) => ({
      adminLeads: state.adminLeads.map((lead) =>
        lead.id === leadId
          ? { ...lead, ...patch, updatedAt: patch.updatedAt ?? new Date().toISOString().split('T')[0] }
          : lead,
      ),
    })),
  deleteAdminLead: (leadId) =>
    set((state) => ({
      adminLeads: state.adminLeads.filter((lead) => lead.id !== leadId),
    })),
  updateLeadAssignment: (leadId, partner) =>
    set((state) => ({
      adminLeads: state.adminLeads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              status: 'applied' as const,
              appliedBy: partner,
              assignedPartner: partner,
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : l,
      ),
    })),
  updateLeadAssignmentByCompany: (companyName, partner) =>
    set((state) => ({
      adminLeads: state.adminLeads.map((l) =>
        l.companyName === companyName
          ? {
              ...l,
              status: 'applied' as const,
              appliedBy: partner,
              assignedPartner: partner,
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : l,
      ),
    })),
  releaseAdminLeadByCompany: (companyName) =>
    set((state) => ({
      adminLeads: state.adminLeads.map((lead) =>
        lead.companyName === companyName
          ? {
              ...lead,
              status: 'available' as const,
              appliedBy: undefined,
              assignedPartner: undefined,
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : lead,
      ),
    })),
  addPartnerPerformance: (partner) =>
    set((state) => ({
      partners: state.partners.some((item) => item.partnerId === partner.partnerId)
        ? state.partners
        : [...state.partners, partner],
    })),
  updatePartnerPerformance: (partnerId, patch) =>
    set((state) => ({
      partners: state.partners.map((partner) =>
        partner.partnerId === partnerId ? { ...partner, ...patch } : partner,
      ),
    })),
  removePartnerPerformance: (partnerId) =>
    set((state) => ({
      partners: state.partners.filter((partner) => partner.partnerId !== partnerId),
    })),
  addProduct: (product) =>
    set((state) => ({ products: [product, ...state.products] })),
  updateProduct: (id, patch) =>
    set((state) => ({
      products: state.products.map((product) =>
        product.id === id ? { ...product, ...patch } : product,
      ),
    })),
  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((product) => product.id !== id),
    })),
  addBusinessToolFile: (file) =>
    set((state) => ({ businessToolFiles: [file, ...state.businessToolFiles] })),
  setPartnerWhiteLabelConfig: (partnerId, config) =>
    set((state) => ({
      whiteLabelConfigs: { ...state.whiteLabelConfigs, [partnerId]: config },
    })),
  deletePartnerWhiteLabelConfig: (partnerId) =>
    set((state) => {
      const rest = { ...state.whiteLabelConfigs }
      delete rest[partnerId]
      return { whiteLabelConfigs: rest }
    }),
  toggleProductStatus: (id) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id
          ? { ...p, status: p.status === 'active' ? 'inactive' as const : 'active' as const }
          : p,
      ),
    })),
})
