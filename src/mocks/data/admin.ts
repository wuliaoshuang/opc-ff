import type { AdminLeadRecord, WhiteLabelConfig, ProductItem } from '@/types'
import { mockLeads } from './leads'

export const mockAdminLeads: AdminLeadRecord[] = mockLeads.map((lead, i) => ({
  ...lead,
  assignedPartner: lead.appliedBy ?? undefined,
  createdAt: `2026-0${Math.min(i % 5 + 1, 5)}-${String((i * 3 + 5) % 28 + 1).padStart(2, '0')}`,
  updatedAt: `2026-05-0${Math.min(i + 1, 5)}`,
}))

export const mockWhiteLabelConfigs: Record<string, WhiteLabelConfig> = {
  'p-001': { partnerId: 'p-001', partnerName: '张伟', systemName: '张伟综合能源', logoUrl: '', primaryColor: '#0ea5e9', contactEmail: 'zhangwei@opc.com', auditStatus: 'approved', auditNote: '平台审核通过，品牌已生效', approvedSnapshot: { systemName: '张伟综合能源', logoUrl: '', primaryColor: '#0ea5e9' } },
  'p-002': { partnerId: 'p-002', partnerName: '李明', systemName: '明光节能服务', logoUrl: '', primaryColor: '#7c3aed', contactEmail: 'liming@opc.com', auditStatus: 'pending', auditNote: '已提交，等待平台审核' },
  'p-003': { partnerId: 'p-003', partnerName: '王强', systemName: '深圳王强OPC', logoUrl: '', primaryColor: '#059669', contactEmail: 'wangqiang@opc.com', auditStatus: 'approved', auditNote: '平台审核通过，品牌已生效', approvedSnapshot: { systemName: '深圳王强OPC', logoUrl: '', primaryColor: '#059669' } },
  'p-004': { partnerId: 'p-004', partnerName: '赵刚', systemName: '', logoUrl: '', primaryColor: '#3730a3', contactEmail: '', auditStatus: 'draft' },
  'p-005': { partnerId: 'p-005', partnerName: '陈丽', systemName: '', logoUrl: '', primaryColor: '#3730a3', contactEmail: '', auditStatus: 'draft' },
  'p-006': { partnerId: 'p-006', partnerName: '刘洋', systemName: '', logoUrl: '', primaryColor: '#3730a3', contactEmail: '', auditStatus: 'draft' },
  'p-007': { partnerId: 'p-007', partnerName: '孙涛', systemName: '', logoUrl: '', primaryColor: '#3730a3', contactEmail: '', auditStatus: 'draft' },
  'p-008': { partnerId: 'p-008', partnerName: '周芳', systemName: '', logoUrl: '', primaryColor: '#3730a3', contactEmail: '', auditStatus: 'draft' },
}

export const mockProducts: ProductItem[] = [
  { id: 'prod-001', name: '综合能源服务', category: '核心业务', description: '为企业提供一站式综合能源解决方案，包括能效诊断、方案设计、项目投资与运营管理。', commissionRate: '3-5%', status: 'active', trainingLinked: true },
  { id: 'prod-002', name: '分布式光伏系统', category: '新能源', description: '工商业屋顶分布式光伏电站投资建设与运维，支持自发自用余电上网模式。', commissionRate: '2-4%', status: 'active', trainingLinked: true },
  { id: 'prod-003', name: '储能系统', category: '新能源', description: '工商业侧储能系统，支持峰谷套利、需量管理、应急备电等多种应用场景。', commissionRate: '3-5%', status: 'active', trainingLinked: true },
  { id: 'prod-004', name: '节能改造', category: '节能服务', description: '工业企业能效提升改造，包括空压机、照明、暖通、电机系统等。', commissionRate: '4-6%', status: 'active', trainingLinked: true },
]
