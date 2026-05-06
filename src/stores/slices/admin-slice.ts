import type { StateCreator } from 'zustand'
import type {
  AdminLeadRecord,
  PartnerPerformance,
  WhiteLabelConfig,
  ProductItem,
} from '@/types'
import { mockAdminLeads, mockWhiteLabelConfigs, mockProducts } from '@/mocks/data/admin'
import { mockPartners } from '@/mocks/data/partners'

export interface AdminSlice {
  adminLeads: AdminLeadRecord[]
  partners: PartnerPerformance[]
  whiteLabelConfigs: Record<string, WhiteLabelConfig>
  products: ProductItem[]
  setAdminLeads: (leads: AdminLeadRecord[]) => void
  updateLeadAssignment: (leadId: string, partner: string) => void
  updateLeadAssignmentByCompany: (companyName: string, partner: string) => void
  releaseAdminLeadByCompany: (companyName: string) => void
  addPartnerPerformance: (partner: PartnerPerformance) => void
  updatePartnerPerformance: (partnerId: string, patch: Partial<PartnerPerformance>) => void
  removePartnerPerformance: (partnerId: string) => void
  addProduct: (product: ProductItem) => void
  updateProduct: (id: string, patch: Partial<ProductItem>) => void
  deleteProduct: (id: string) => void
  setPartnerWhiteLabelConfig: (partnerId: string, config: WhiteLabelConfig) => void
  toggleProductStatus: (id: string) => void
}

export const createAdminSlice: StateCreator<AdminSlice> = (set) => ({
  adminLeads: mockAdminLeads,
  partners: mockPartners,
  whiteLabelConfigs: mockWhiteLabelConfigs,
  products: mockProducts,
  setAdminLeads: (leads) => set({ adminLeads: leads }),
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
  setPartnerWhiteLabelConfig: (partnerId, config) =>
    set((state) => ({
      whiteLabelConfigs: { ...state.whiteLabelConfigs, [partnerId]: config },
    })),
  toggleProductStatus: (id) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id
          ? { ...p, status: p.status === 'active' ? 'inactive' as const : 'active' as const }
          : p,
      ),
    })),
})
