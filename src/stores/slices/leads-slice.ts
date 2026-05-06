import type { StateCreator } from 'zustand'
import type { PotentialLead, LeadEvalResult } from '@/types'
import { mockLeads } from '@/mocks/data/leads'

export interface LeadsSlice {
  leads: PotentialLead[]
  searchResults: PotentialLead[]
  evalResult: LeadEvalResult | null
  setLeads: (leads: PotentialLead[]) => void
  setSearchResults: (results: PotentialLead[]) => void
  setEvalResult: (result: LeadEvalResult | null) => void
  applyLead: (id: string, partnerName: string) => void
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
