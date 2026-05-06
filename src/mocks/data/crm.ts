import type { CrmProject } from '@/types'

export const mockCrmProjects: CrmProject[] = [
  {
    id: 'crm-001', leadId: 'lead-003', companyName: '海螺水泥股份有限公司', industry: '建材',
    stage: 'contact_filled', appliedAt: '2026-03-15', contactDeadline: '2026-04-15', meetingDeadline: '2026-05-15',
    isExclusive: false, isOverdue: false, source: 'lead',
    contactPerson: { name: '陈主任', role: '设备科长', phone: '138****5678', trustLevel: 7, decisionLevel: 5 },
    followupLogs: [
      { date: '2026-03-15', action: '提交线索申请', result: '申请通过' },
      { date: '2026-03-28', action: '填写对接人信息', result: '已确认设备科长陈主任为对接人' },
    ],
  },
  {
    id: 'crm-002', leadId: 'lead-007', companyName: '太阳纸业股份有限公司', industry: '造纸',
    stage: 'online_meeting', appliedAt: '2026-02-10', contactDeadline: '2026-03-10', meetingDeadline: '2026-04-10',
    isExclusive: false, isOverdue: false, source: 'lead',
    contactPerson: { name: '王总工', role: '技术总监', phone: '139****1234', trustLevel: 8, decisionLevel: 8 },
    followupLogs: [
      { date: '2026-02-10', action: '提交线索申请', result: '通过' },
      { date: '2026-02-25', action: '对接人确认', result: '技术总监王总工对接' },
      { date: '2026-03-20', action: '安排线上接洽', result: '已安排技术方案讨论会' },
    ],
  },
  {
    id: 'crm-003', leadId: 'lead-010', companyName: '比亚迪股份有限公司', industry: '制造业',
    stage: 'exclusive', appliedAt: '2025-12-01', contactDeadline: '2026-01-01', meetingDeadline: '2026-02-01',
    exclusiveStart: '2026-02-01', exclusiveEnd: '2026-08-01',
    isExclusive: true, isOverdue: false, source: 'lead',
    contactPerson: { name: '李副总', role: '副总经理', phone: '136****9876', trustLevel: 9, decisionLevel: 9 },
    followupLogs: [
      { date: '2025-12-01', action: '申请跟进', result: '通过' },
      { date: '2025-12-20', action: '对接人确认', result: '已对接副总经理' },
      { date: '2026-01-15', action: '线上接洽', result: '方案获得初步认可' },
      { date: '2026-02-01', action: '进入排他期', result: '6个月排他保护' },
    ],
  },
  {
    id: 'crm-004', companyName: '金风科技股份有限公司', industry: '风电设备',
    stage: 'applied', appliedAt: '2026-04-20', contactDeadline: '2026-05-20', meetingDeadline: '2026-06-20',
    isExclusive: false, isOverdue: false, source: 'manual',
    followupLogs: [
      { date: '2026-04-20', action: '主动登记项目', result: '等待对接人信息填写' },
    ],
  },
  {
    id: 'crm-005', leadId: 'lead-014', companyName: '万华化学集团股份有限公司', industry: '化工',
    stage: 'applied', appliedAt: '2026-04-25', contactDeadline: '2026-05-25', meetingDeadline: '2026-06-25',
    isExclusive: false, isOverdue: false, source: 'lead',
    followupLogs: [
      { date: '2026-04-25', action: '提交线索申请', result: '已通过' },
    ],
  },
  {
    id: 'crm-006', companyName: '中石化青岛炼化', industry: '化工',
    stage: 'contact_filled', appliedAt: '2026-03-01', contactDeadline: '2026-04-01', meetingDeadline: '2026-05-01',
    isExclusive: false, isOverdue: true, source: 'manual',
    contactPerson: { name: '刘工', role: '能源管理工程师', phone: '137****4567', trustLevel: 6, decisionLevel: 4 },
    followupLogs: [
      { date: '2026-03-01', action: '登记项目', result: '已登记' },
      { date: '2026-03-25', action: '填写对接人', result: '已确认刘工为对接人' },
    ],
  },
  {
    id: 'crm-007', companyName: '首钢集团有限公司', industry: '钢铁',
    stage: 'exclusive', appliedAt: '2025-11-15', contactDeadline: '2025-12-15', meetingDeadline: '2026-01-15',
    exclusiveStart: '2026-01-15', exclusiveEnd: '2026-07-15',
    isExclusive: true, isOverdue: false, source: 'manual',
    contactPerson: { name: '马总', role: '能源部部长', phone: '135****3210', trustLevel: 9, decisionLevel: 10 },
    followupLogs: [
      { date: '2025-11-15', action: '登记项目', result: '通过' },
      { date: '2025-12-05', action: '对接人确认', result: '能源部部长直接对接' },
      { date: '2026-01-10', action: '线上接洽', result: '高层会议通过' },
      { date: '2026-01-15', action: '进入排他期', result: '排他6个月' },
      { date: '2026-03-20', action: '现场拜访', result: '方案细化中' },
    ],
  },
  {
    id: 'crm-008', companyName: '蒙牛乳业有限公司', industry: '食品加工',
    stage: 'signed', appliedAt: '2025-08-10', contactDeadline: '2025-09-10', meetingDeadline: '2025-10-10',
    exclusiveStart: '2025-10-10', exclusiveEnd: '2026-04-10',
    isExclusive: false, isOverdue: false, source: 'manual',
    contactPerson: { name: '赵厂长', role: '工厂厂长', phone: '133****6789', trustLevel: 8, decisionLevel: 9 },
    followupLogs: [
      { date: '2025-08-10', action: '登记项目', result: '通过' },
      { date: '2025-09-01', action: '对接确认', result: '厂长直接对接' },
      { date: '2025-09-25', action: '线上接洽', result: '通过' },
      { date: '2025-10-10', action: '排他期', result: '排他6个月' },
      { date: '2026-03-15', action: '签单成功', result: '合同金额1200万' },
    ],
  },
  {
    id: 'crm-009', companyName: '宁德时代新能源科技', industry: '新能源',
    stage: 'online_meeting', appliedAt: '2026-03-05', contactDeadline: '2026-04-05', meetingDeadline: '2026-05-05',
    isExclusive: false, isOverdue: false, source: 'manual',
    contactPerson: { name: '张经理', role: '采购经理', phone: '158****2345', trustLevel: 7, decisionLevel: 6 },
    followupLogs: [
      { date: '2026-03-05', action: '登记项目', result: '已登记' },
      { date: '2026-03-20', action: '对接人确认', result: '采购经理张经理' },
      { date: '2026-04-10', action: '安排接洽', result: '技术评审会议已确认' },
    ],
  },
  {
    id: 'crm-010', companyName: '中国铝业股份有限公司', industry: '有色金属',
    stage: 'applied', appliedAt: '2026-05-01', contactDeadline: '2026-06-01', meetingDeadline: '2026-07-01',
    isExclusive: false, isOverdue: false, source: 'lead',
    followupLogs: [
      { date: '2026-05-01', action: '提交申请', result: '等待对接' },
    ],
  },
  {
    id: 'crm-011', companyName: '华润水泥控股有限公司', industry: '建材',
    stage: 'contact_filled', appliedAt: '2026-02-20', contactDeadline: '2026-03-20', meetingDeadline: '2026-04-20',
    isExclusive: false, isOverdue: true, source: 'manual',
    contactPerson: { name: '吴科长', role: '生产科长', phone: '159****7890', trustLevel: 5, decisionLevel: 4 },
    followupLogs: [
      { date: '2026-02-20', action: '登记', result: '已登记' },
      { date: '2026-03-10', action: '对接确认', result: '已确认' },
    ],
  },
  {
    id: 'crm-012', companyName: '三一重工股份有限公司', industry: '制造业',
    stage: 'signed', appliedAt: '2025-07-01', contactDeadline: '2025-08-01', meetingDeadline: '2025-09-01',
    exclusiveStart: '2025-09-01', exclusiveEnd: '2026-03-01',
    isExclusive: false, isOverdue: false, source: 'lead',
    contactPerson: { name: '黄董助', role: '董事长助理', phone: '186****5432', trustLevel: 10, decisionLevel: 10 },
    followupLogs: [
      { date: '2025-07-01', action: '申请跟进', result: '通过' },
      { date: '2025-07-20', action: '对接确认', result: '董事长助理对接' },
      { date: '2025-08-15', action: '线上接洽', result: '方案认可' },
      { date: '2025-09-01', action: '排他期', result: '6个月排他' },
      { date: '2026-02-20', action: '签单', result: '合同签署，金额2800万' },
    ],
  },
]
