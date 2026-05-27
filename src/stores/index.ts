import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createAuthSlice, seedAccounts, type AuthSlice } from './slices/auth-slice'
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

function mergeSeedAccounts(accounts: AuthSlice['accounts'] = []) {
  const mergedAccounts = accounts.map((account) => {
    const seed = seedAccounts.find((item) =>
      item.id === account.id || (!!account.username && item.username === account.username),
    )
    if (!seed) return account

    return {
      ...seed,
      ...account,
      username: account.username ?? seed.username,
      password: account.password ?? seed.password,
      adminLevel: account.adminLevel ?? seed.adminLevel,
      adminRegionGroup: account.adminRegionGroup ?? seed.adminRegionGroup,
      resourceKeywords: account.resourceKeywords ?? seed.resourceKeywords,
    }
  })

  const existingIds = new Set(mergedAccounts.map((account) => account.id))
  const existingUsernames = new Set(mergedAccounts.map((account) => account.username).filter(Boolean))
  const missingSeeds = seedAccounts.filter((account) =>
    !existingIds.has(account.id) && !existingUsernames.has(account.username),
  )
  return [...mergedAccounts, ...missingSeeds]
}

function mergePersistedUser(
  user: AuthSlice['user'],
  accounts: AuthSlice['accounts'],
) {
  if (!user) return user
  const account = accounts.find((item) => item.id === user.id)
  if (!account) return user

  return {
    ...user,
    adminLevel: user.adminLevel ?? account.adminLevel,
    adminRegionGroup: user.adminRegionGroup ?? account.adminRegionGroup,
  }
}

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
        businessToolFiles: state.businessToolFiles,
        bindings: state.bindings,
        subPartners: state.subPartners,
        trainingResources: state.trainingResources,
        aigcTemplates: state.aigcTemplates,
        aigcHistory: state.aigcHistory,
        redPacketTasks: state.redPacketTasks,
        commissions: state.commissions,
        incentiveTasks: state.incentiveTasks,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<StoreState> | undefined
        if (!persistedState) return current
        const accounts = mergeSeedAccounts(persistedState.accounts)
        return {
          ...current,
          ...persistedState,
          accounts,
          user: mergePersistedUser(persistedState.user ?? null, accounts),
        }
      },
    },
  ),
)
