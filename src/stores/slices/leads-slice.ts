import type { StateCreator } from 'zustand'
import type { PotentialLead, LeadEvalResult, FilingStatus } from '@/types'
import { mockLeads } from '@/mocks/data/leads'
import { addDays } from '@/lib/v1-config'

export interface LeadsSlice {
  leads: PotentialLead[]
  searchResults: PotentialLead[]
  evalResult: LeadEvalResult | null
  setLeads: (leads: PotentialLead[]) => void
  setSearchResults: (results: PotentialLead[]) => void
  setEvalResult: (result: LeadEvalResult | null) => void
  applyLead: (id: string, partnerName: string) => void
  followLead: (id: string, partnerName: string) => void
  updateLeadFiling: (id: string, status: FilingStatus, partnerName?: string) => void
  releaseLeadByCompany: (companyName: string) => void
  updateLeadNotes: (id: string, notes: Pick<PotentialLead, 'projectInfo' | 'businessInfo'>) => void
}

export const createLeadsSlice: StateCreator<LeadsSlice> = (set) => ({
  leads: mockLeads,
  searchResults: [],
  evalResult: null,
  setLeads: (leads) => set({ leads }),
  setSearchResults: (results) => set({ searchResults: results }),
  setEvalResult: (result) => set({ evalResult: result }),
  applyLead: (id, partnerName) =>
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === id ? { ...l, status: 'applied' as const, appliedBy: partnerName } : l,
      ),
      searchResults: state.searchResults.map((l) =>
        l.id === id ? { ...l, status: 'applied' as const, appliedBy: partnerName } : l,
      ),
    })),
  followLead: (id, partnerName) =>
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === id ? { ...l, status: 'followed' as const, appliedBy: partnerName } : l,
      ),
      searchResults: state.searchResults.map((l) =>
        l.id === id ? { ...l, status: 'followed' as const, appliedBy: partnerName } : l,
      ),
    })),
  updateLeadFiling: (id, status, partnerName) =>
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === id
          ? {
              ...lead,
              filingStatus: status,
              status: status === 'approved' ? 'exclusive' as const : status === 'pending' ? 'applied' as const : lead.status,
              appliedBy: partnerName ?? lead.appliedBy,
              exclusiveUntil: status === 'approved' ? addDays(60) : lead.exclusiveUntil,
            }
          : lead,
      ),
      searchResults: state.searchResults.map((lead) =>
        lead.id === id
          ? {
              ...lead,
              filingStatus: status,
              status: status === 'approved' ? 'exclusive' as const : status === 'pending' ? 'applied' as const : lead.status,
              appliedBy: partnerName ?? lead.appliedBy,
              exclusiveUntil: status === 'approved' ? addDays(60) : lead.exclusiveUntil,
            }
          : lead,
      ),
    })),
  releaseLeadByCompany: (companyName) =>
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.companyName === companyName
          ? { ...lead, status: 'available' as const, appliedBy: undefined }
          : lead,
      ),
      searchResults: state.searchResults.map((lead) =>
        lead.companyName === companyName
          ? { ...lead, status: 'available' as const, appliedBy: undefined }
          : lead,
      ),
    })),
  updateLeadNotes: (id, notes) =>
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? { ...l, ...notes } : l)),
      searchResults: state.searchResults.map((l) => (l.id === id ? { ...l, ...notes } : l)),
    })),
})
