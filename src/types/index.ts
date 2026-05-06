// Auth
export interface User {
  id: string
  name: string
  phone: string
  role: 'partner' | 'admin'
  region: string
  industry: string
}

export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'disabled'
export type PartnerRelation = 'primary' | 'secondary'

export interface AuthAccount extends User {
  username?: string
  password?: string
  market?: string
  workType?: string
  idCardMasked?: string
  idCardVerified: boolean
  resourceTags: string[]
  ownInviteCode?: string
  inviteCode?: string
  relation: PartnerRelation
  status: AccountStatus
  submittedAt: string
  reviewedAt?: string
  reviewNote?: string
  parentPartnerId?: string
  parentPartnerName?: string
}

// Leads
export type LeadStatus = 'available' | 'applied' | 'followed' | 'exclusive'
export type LeadGrade = 'S' | 'A' | 'B' | 'C' | 'D'

export interface PotentialLead {
  id: string
  companyName: string
  industry: string
  region: string
  isListed: boolean
  revenue: string
  energyUsage: string
  newProjectSize?: string
  newProjectProgress?: string
  aiMatchScore: number
  status: LeadStatus
  appliedBy?: string
  projectInfo: string
  businessInfo: string
}

export interface LeadSearchParams {
  industry?: string
  region?: string
  keyword?: string
  resources?: string[]
}

// Lead Scoring
export interface LeadValueScore {
  isListed: number
  revenueScale: number
  energyUsage: number
  newProjectSize: number
  newProjectProgress: number
  total: number
}

export interface PartnerMatchScore {
  contactRole: number
  trustLevel: number
  decisionLevel: number
  total: number
}

export interface LeadEvalResult {
  leadId?: string
  companyName: string
  leadValue: LeadValueScore
  partnerMatch: PartnerMatchScore
  overallGrade: LeadGrade
  suggestions: string[]
}

// CRM
export type ProjectStage =
  | 'applied'
  | 'contact_filled'
  | 'online_meeting'
  | 'exclusive'
  | 'signed'
  | 'released'

export interface ContactPerson {
  name: string
  role: string
  phone: string
  trustLevel: number
  decisionLevel: number
}

export interface FollowupLog {
  date: string
  action: string
  result: string
}

export interface CrmProject {
  id: string
  leadId?: string
  companyName: string
  industry: string
  ownerPartnerId?: string
  ownerPartnerName?: string
  stage: ProjectStage
  contactPerson?: ContactPerson
  appliedAt: string
  contactDeadline: string
  meetingDeadline: string
  exclusiveStart?: string
  exclusiveEnd?: string
  isExclusive: boolean
  isOverdue: boolean
  source: 'manual' | 'lead'
  contractAmount?: number
  followupLogs: FollowupLog[]
}

// Admin
export interface AdminLeadRecord extends PotentialLead {
  assignedPartner?: string
  createdAt: string
  updatedAt: string
}

export interface WhiteLabelConfig {
  partnerId?: string
  partnerName?: string
  systemName: string
  logoUrl: string
  primaryColor: string
  contactEmail: string
  auditStatus: 'draft' | 'pending' | 'approved' | 'rejected'
  auditNote?: string
  approvedSnapshot?: {
    systemName: string
    logoUrl: string
    primaryColor: string
  }
}

export interface ProductItem {
  id: string
  name: string
  category: string
  description: string
  commissionRate: string
  status: 'active' | 'inactive'
  trainingLinked: boolean
}

// Phase 2 — Binding
export type BindingType = 'manual' | 'lead_apply' | 'admin_assign'
export type BindingStage = 'temporary' | 'locked' | 'exclusive' | 'released'
export type BindingStatus = 'active' | 'inactive'

export interface BindingHistoryEntry {
  date: string
  from: BindingStage
  to: BindingStage
  action: string
  operator: string
}

export interface CustomerBinding {
  id: string
  customerId: string
  customerName: string
  industry: string
  partnerId: string
  partnerName: string
  bindingType: BindingType
  stage: BindingStage
  status: BindingStatus
  boundAt: string
  expiredAt: string
  contactPerson?: string
  contactRole?: string
  linkedProjects: number
  history: BindingHistoryEntry[]
  sourcePartnerName?: string
  parentId?: string
}

export const bindingStageConfig: Record<BindingStage, { label: string; color: string; duration: string; icon: string }> = {
  temporary: { label: '临时绑定', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', duration: '30天', icon: 'Clock' },
  locked: { label: '初步锁定', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', duration: '60天', icon: 'Lock' },
  exclusive: { label: '排他保护', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', duration: '180天', icon: 'ShieldCheck' },
  released: { label: '已释放', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400', duration: '—', icon: 'Unlock' },
}

export const bindingTypeLabels: Record<BindingType, string> = {
  manual: '主动登记',
  lead_apply: '线索申请',
  admin_assign: '平台指派',
}

export interface SubPartner {
  id: string
  name: string
  region: string
  level: 2
  parentId: string
  parentName: string
  leads: number
  projects: number
  activeProjects: number
  totalCommission: number
  status: 'active' | 'inactive'
  boundAt: string
}

// Phase 2 — Training
export interface TrainingResource {
  id: string
  title: string
  category: 'process' | 'knowledge' | 'qa' | 'script' | 'ai'
  type: 'doc' | 'video' | 'faq'
  summary: string
  content: string
  status?: 'draft' | 'published' | 'archived'
  updatedAt?: string
  createdBy?: string
  sortOrder?: number
}

// Phase 2 — AIGC
export interface AigcTemplate {
  id: string
  type: 'policy' | 'case' | 'opportunity'
  title: string
  promptTemplate: string
  outputStructure: string
  status: 'draft' | 'active' | 'archived'
  updatedAt: string
}

export interface AigcHistory {
  id: string
  type: 'policy' | 'case' | 'opportunity'
  keyword: string
  output: string
  createdAt: string
  isExample?: boolean
}

// Phase 2 — Incentives
export interface RedPacketTask {
  id: string
  name: string
  projectName: string
  projectId?: string
  claimedById?: string
  claimedByName?: string
  claimedAt?: string
  paidAt?: string
  amount: number
  description: string
  requirements: string
  createdAt?: string
  deadline: string
  status: 'available' | 'claimed' | 'executing' | 'evidence_submitted' | 'reviewing' | 'paid' | 'rejected' | 'expired'
  createdBy: 'platform' | 'partner'
  evidence?: {
    images: string[]
    description: string
    submittedAt: string
  }
  reviewNote?: string
}

export interface CommissionRecord {
  id: string
  projectName: string
  projectId?: string
  partnerId: string
  amount: number
  type: 'short_term' | 'long_term'
  level: 'primary' | 'secondary'
  parentPartnerId?: string
  parentPartnerName?: string
  status: 'pending' | 'settled' | 'frozen'
  settledAt?: string
  paidAt?: string
  commissionRate: string
  month: string
  sourceType?: 'project' | 'red_packet' | 'manual_adjustment'
  reviewNote?: string
  operator?: string
}

export interface PartnerPerformance {
  partnerId: string
  partnerName: string
  region: string
  industry: string
  totalLeads: number
  activeProjects: number
  closedDeals: number
  totalCommission: number
  rating: LeadGrade
  accountStatus?: AccountStatus
}

export interface IncentiveTask {
  id: string
  name: string
  projectName: string
  amount: number
  applicantCount: number
  createdAt?: string
  status: 'draft' | 'published' | 'closed'
  createdBy: string
  deadline: string
  requirements?: string
}
