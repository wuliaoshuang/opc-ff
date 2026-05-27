import { createStore } from 'zustand/vanilla'
import { createAdminSlice } from '@/stores/slices/admin-slice'
import { createAuthSlice } from '@/stores/slices/auth-slice'
import { createCrmSlice } from '@/stores/slices/crm-slice'
import { createLeadsSlice } from '@/stores/slices/leads-slice'
import { createPhase2Slice } from '@/stores/slices/phase2-slice'
import { createUiSlice } from '@/stores/slices/ui-slice'
import type { StoreState } from '@/stores'

export function createTestStore() {
  return createStore<StoreState>()((...a) => ({
    ...createAuthSlice(...a),
    ...createLeadsSlice(...a),
    ...createCrmSlice(...a),
    ...createAdminSlice(...a),
    ...createUiSlice(...a),
    ...createPhase2Slice(...a),
  }))
}
