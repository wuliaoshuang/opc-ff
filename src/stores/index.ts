import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createAuthSlice, type AuthSlice } from './slices/auth-slice'
import { createLeadsSlice, type LeadsSlice } from './slices/leads-slice'
import { createCrmSlice, type CrmSlice } from './slices/crm-slice'
import { createAdminSlice, type AdminSlice } from './slices/admin-slice'
import { createUiSlice, type UiSlice } from './slices/ui-slice'
import { createPhase2Slice, type Phase2Slice } from './slices/phase2-slice'

export type StoreState = AuthSlice &
  LeadsSlice &
  CrmSlice &
  AdminSlice &
  UiSlice &
  Phase2Slice

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createLeadsSlice(...a),
      ...createCrmSlice(...a),
      ...createAdminSlice(...a),
      ...createUiSlice(...a),
      ...createPhase2Slice(...a),
    }),
    {
      name: 'opc-phase1-phase2-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accounts: state.accounts,
        leads: state.leads,
        projects: state.projects,
        adminLeads: state.adminLeads,
        partners: state.partners,
        whiteLabelConfigs: state.whiteLabelConfigs,
        products: state.products,
        bindings: state.bindings,
        subPartners: state.subPartners,
        trainingResources: state.trainingResources,
        aigcTemplates: state.aigcTemplates,
        aigcHistory: state.aigcHistory,
        redPacketTasks: state.redPacketTasks,
        commissions: state.commissions,
        incentiveTasks: state.incentiveTasks,
      }),
    },
  ),
)
