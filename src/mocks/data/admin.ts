import type { AdminLeadRecord, WhiteLabelConfig, ProductItem } from '@/types'
import { mockLeads } from './leads'

export const mockAdminLeads: AdminLeadRecord[] = mockLeads.map((lead, i) => ({
  ...lead,
  assignedPartner: lead.appliedBy ?? undefined,
  createdAt: `2026-0${Math.min(i % 5 + 1, 5)}-${String((i * 3 + 5) % 28 + 1).padStart(2, '0')}`,
  updatedAt: `2026-05-0${Math.min(i + 1, 5)}`,
}))

export const mockWhiteLabelConfig: WhiteLabelConfig = {
  systemName: '零碳能源OPC平台',
  logoUrl: '',
  primaryColor: '#3730a3',
  contactEmail: 'admin@opc-energy.com',
  auditStatus: 'approved',
  auditNote: '已通过平台贴牌资格审核',
}

export const mockProducts: ProductItem[] = [
  { id: 'prod-001', name: '综合能源服务', category: '核心业务', description: '为企业提供一站式综合能源解决方案，包括能效诊断、方案设计、项目投资与运营管理。', commissionRate: '3-5%', status: 'active', trainingLinked: true },
  { id: 'prod-002', name: '分布式光伏系统', category: '新能源', description: '工商业屋顶分布式光伏电站投资建设与运维，支持自发自用余电上网模式。', commissionRate: '2-4%', status: 'active', trainingLinked: true },
  { id: 'prod-003', name: '储能系统', category: '新能源', description: '工商业侧储能系统，支持峰谷套利、需量管理、应急备电等多种应用场景。', commissionRate: '3-5%', status: 'active', trainingLinked: true },
  { id: 'prod-004', name: '节能改造', category: '节能服务', description: '工业企业能效提升改造，包括空压机、照明、暖通、电机系统等。', commissionRate: '4-6%', status: 'active', trainingLinked: true },
]
