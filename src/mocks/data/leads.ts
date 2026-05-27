import type { PotentialLead } from '@/types'
import { inferLeadGrade } from '@/lib/v1-config'

const baseLeads: PotentialLead[] = [
  {
    id: 'lead-001', companyName: '华能国际电力股份有限公司', industry: '电力', region: '北京',
    isListed: true, revenue: '2100亿', energyUsage: '极高', newProjectSize: '大型',
    newProjectProgress: '规划中', aiMatchScore: 96, status: 'available',
    projectInfo: '华能国际正在规划新一批清洁能源发电项目，涵盖风电和光伏领域，预计总投资超过50亿元。',
    businessInfo: '该项目目前处于前期调研阶段，尚无合伙人跟进。',
  },
  {
    id: 'lead-002', companyName: '中联重科股份有限公司', industry: '制造业', region: '长沙',
    isListed: true, revenue: '780亿', energyUsage: '高', newProjectSize: '中型',
    newProjectProgress: '立项中', aiMatchScore: 88, status: 'available',
    projectInfo: '中联重科长沙产业园区计划建设分布式光伏项目，屋顶面积约10万平方米。',
    businessInfo: '暂无合伙人关注该线索。',
  },
  {
    id: 'lead-003', companyName: '海螺水泥股份有限公司', industry: '建材', region: '芜湖',
    isListed: true, revenue: '1850亿', energyUsage: '极高', newProjectSize: '大型',
    newProjectProgress: '招标中', aiMatchScore: 92, status: 'applied', appliedBy: '张伟',
    projectInfo: '海螺水泥余热发电改造项目，涉及5条生产线，预计年节约标煤2万吨。',
    businessInfo: '合伙人张伟已申请跟进，当前处于对接人信息填写阶段。',
  },
  {
    id: 'lead-004', companyName: '宝钢股份有限公司', industry: '钢铁', region: '上海',
    isListed: true, revenue: '3200亿', energyUsage: '极高', newProjectSize: '大型',
    newProjectProgress: '实施中', aiMatchScore: 85, status: 'followed',
    projectInfo: '宝钢正在推进氢能炼钢试点项目，配套需要大规模绿电供应体系。',
    businessInfo: '已有合伙人在跟进中，排他期内。',
  },
  {
    id: 'lead-005', companyName: '晨光文具股份有限公司', industry: '制造业', region: '上海',
    isListed: true, revenue: '240亿', energyUsage: '中', newProjectSize: '小型',
    newProjectProgress: '意向阶段', aiMatchScore: 72, status: 'available',
    projectInfo: '晨光文具上海工厂计划安装屋顶光伏，预计装机容量1.5MW。',
    businessInfo: '线索来源为公开招标信息，暂无人跟进。',
  },
  {
    id: 'lead-006', companyName: '恒力石化股份有限公司', industry: '化工', region: '大连',
    isListed: true, revenue: '2500亿', energyUsage: '极高', newProjectSize: '大型',
    newProjectProgress: '规划中', aiMatchScore: 90, status: 'available',
    projectInfo: '恒力石化大连基地蒸汽热电联产改造项目，年用能成本超过15亿元。',
    businessInfo: '高价值线索，建议优先跟进。',
  },
  {
    id: 'lead-007', companyName: '太阳纸业股份有限公司', industry: '造纸', region: '济宁',
    isListed: true, revenue: '450亿', energyUsage: '高', newProjectSize: '中型',
    newProjectProgress: '立项中', aiMatchScore: 83, status: 'applied', appliedBy: '李明',
    projectInfo: '太阳纸业生物质热电联产扩建项目，配套储能系统需求明确。',
    businessInfo: '合伙人李明已申请，正在安排线上接洽。',
  },
  {
    id: 'lead-008', companyName: '杭州汽轮机股份有限公司', industry: '制造业', region: '杭州',
    isListed: true, revenue: '85亿', energyUsage: '中', newProjectSize: '小型',
    newProjectProgress: '意向阶段', aiMatchScore: 68, status: 'available',
    projectInfo: '杭汽轮厂区照明节能改造+屋顶光伏项目，投资预算约800万。',
    businessInfo: '中等价值线索，适合本地合伙人跟进。',
  },
  {
    id: 'lead-009', companyName: '山东魏桥创业集团', industry: '纺织', region: '滨州',
    isListed: false, revenue: '4800亿', energyUsage: '极高', newProjectSize: '大型',
    newProjectProgress: '规划中', aiMatchScore: 94, status: 'available',
    projectInfo: '魏桥集团自备电厂清洁化改造，涉及发电装机超过3GW，是国内最大的企业自备电厂。',
    businessInfo: '超级大单线索，需要省级资源对接。',
  },
  {
    id: 'lead-010', companyName: '比亚迪股份有限公司', industry: '制造业', region: '深圳',
    isListed: true, revenue: '6023亿', energyUsage: '极高', newProjectSize: '大型',
    newProjectProgress: '实施中', aiMatchScore: 87, status: 'exclusive',
    projectInfo: '比亚迪深圳坪山工厂综合能源管理项目，包含光伏+储能+能效管理一体化方案。',
    businessInfo: '已进入排他跟进阶段，由合伙人王强负责。',
  },
  {
    id: 'lead-011', companyName: '青岛啤酒股份有限公司', industry: '食品加工', region: '青岛',
    isListed: true, revenue: '340亿', energyUsage: '中', newProjectSize: '中型',
    newProjectProgress: '立项中', aiMatchScore: 76, status: 'available',
    projectInfo: '青岛啤酒生产线冷却系统节能改造，预计年节约电费1200万元。',
    businessInfo: '适合食品行业背景的合伙人跟进。',
  },
  {
    id: 'lead-012', companyName: '长城汽车股份有限公司', industry: '制造业', region: '保定',
    isListed: true, revenue: '1740亿', energyUsage: '高', newProjectSize: '大型',
    newProjectProgress: '招标中', aiMatchScore: 82, status: 'available',
    projectInfo: '长城汽车保定基地分布式光伏+储能项目，总装机规模约50MW。',
    businessInfo: '招标文件已发布，建议尽快申请跟进。',
  },
  {
    id: 'lead-013', companyName: '新希望集团有限公司', industry: '农业', region: '成都',
    isListed: false, revenue: '2650亿', energyUsage: '高', newProjectSize: '中型',
    newProjectProgress: '意向阶段', aiMatchScore: 71, status: 'available',
    projectInfo: '新希望集团养殖基地沼气发电+光伏项目，分布在四川、山东多个基地。',
    businessInfo: '需要农业行业资源的合伙人。',
  },
  {
    id: 'lead-014', companyName: '万华化学集团股份有限公司', industry: '化工', region: '烟台',
    isListed: true, revenue: '1750亿', energyUsage: '极高', newProjectSize: '大型',
    newProjectProgress: '规划中', aiMatchScore: 91, status: 'applied', appliedBy: '赵刚',
    projectInfo: '万华化学烟台工业园区综合能源优化项目，年用电量超过100亿度。',
    businessInfo: '合伙人赵刚已提交申请，等待对接人信息补充。',
  },
  {
    id: 'lead-015', companyName: '格力电器股份有限公司', industry: '制造业', region: '珠海',
    isListed: true, revenue: '2050亿', energyUsage: '高',
    aiMatchScore: 79, status: 'available',
    projectInfo: '格力珠海总部光伏建筑一体化(BIPV)项目，计划与新厂房建设同步推进。',
    businessInfo: '中高价值线索，适合珠三角区域合伙人跟进。',
  },
]

export const mockLeads: PotentialLead[] = baseLeads.map((lead) => ({
  ...lead,
  grade: inferLeadGrade(lead.aiMatchScore),
  matchedKeywords: [lead.region, lead.industry, lead.newProjectProgress ?? '项目机会'].filter(Boolean),
  filingStatus: 'none' as const,
}))
