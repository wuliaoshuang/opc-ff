import type { CrmProject } from '@/types'

export const mockCrmProjects: CrmProject[] = [
  // ========== 张伟 p-001 ==========
  {
    id: 'crm-001', leadId: 'lead-003', companyName: '海螺水泥股份有限公司', industry: '建材',
    ownerPartnerId: 'p-001', ownerPartnerName: '张伟',
    stage: 'exclusive', appliedAt: '2026-03-10', contactDeadline: '2026-04-10', meetingDeadline: '2026-05-10',
    exclusiveStart: '2026-04-02', exclusiveEnd: '2026-09-29',
    isExclusive: true, isOverdue: false, source: 'lead',
    contactPerson: { name: '陈主任', role: '设备科长', phone: '138****5678', trustLevel: 7, decisionLevel: 5 },
    followupLogs: [
      { date: '2026-03-10', action: '提交线索申请', result: '申请通过' },
      { date: '2026-03-18', action: '填写对接人信息', result: '已确认设备科长陈主任为对接人' },
      { date: '2026-03-28', action: '申请线上接洽', result: '等待平台安排' },
      { date: '2026-04-02', action: '线上接洽完成', result: '已进入180天排他保护期' },
      { date: '2026-04-20', action: '现场拜访', result: '拜访生产线余热工段，初步技术对接' },
    ],
  },
  {
    id: 'crm-004', companyName: '金风科技股份有限公司', industry: '风电设备',
    ownerPartnerId: 'p-001', ownerPartnerName: '张伟',
    stage: 'applied', appliedAt: '2026-04-20', contactDeadline: '2026-05-20', meetingDeadline: '2026-06-20',
    isExclusive: false, isOverdue: false, source: 'manual',
    followupLogs: [
      { date: '2026-04-20', action: '主动登记项目', result: '等待对接人信息填写' },
    ],
  },
  {
    id: 'crm-005', leadId: 'lead-014', companyName: '万华化学集团股份有限公司', industry: '化工',
    ownerPartnerId: 'p-001', ownerPartnerName: '张伟',
    stage: 'contact_filled', appliedAt: '2026-04-25', contactDeadline: '2026-05-25', meetingDeadline: '2026-06-25',
    isExclusive: false, isOverdue: false, source: 'lead',
    contactPerson: { name: '周总', role: '能源管理部', phone: '131****8888', trustLevel: 8, decisionLevel: 7 },
    followupLogs: [
      { date: '2026-04-25', action: '提交线索申请', result: '已通过' },
      { date: '2026-05-02', action: '填写对接人信息', result: '已确认周总' },
    ],
  },
  {
    id: 'crm-008', companyName: '蒙牛乳业有限公司', industry: '食品加工',
    ownerPartnerId: 'p-001', ownerPartnerName: '张伟',
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
    id: 'crm-015', companyName: '上海电气集团', industry: '电力设备',
    ownerPartnerId: 'p-001', ownerPartnerName: '张伟',
    stage: 'online_meeting', appliedAt: '2026-03-20', contactDeadline: '2026-04-20', meetingDeadline: '2026-05-20',
    isExclusive: false, isOverdue: false, source: 'manual',
    contactPerson: { name: '孙总监', role: '技术总监', phone: '139****1111', trustLevel: 6, decisionLevel: 7 },
    followupLogs: [
      { date: '2026-03-20', action: '登记项目', result: '已登记' },
      { date: '2026-04-05', action: '填写对接人', result: '技术总监孙总监' },
      { date: '2026-04-15', action: '申请线上接洽', result: '等待平台安排' },
    ],
  },

  // ========== 李明 p-002 ==========
  {
    id: 'crm-002', leadId: 'lead-007', companyName: '太阳纸业股份有限公司', industry: '造纸',
    ownerPartnerId: 'p-002', ownerPartnerName: '李明',
    stage: 'contact_filled', appliedAt: '2026-02-10', contactDeadline: '2026-03-10', meetingDeadline: '2026-04-10',
    isExclusive: false, isOverdue: true, source: 'lead',
    contactPerson: { name: '王总工', role: '技术总监', phone: '139****1234', trustLevel: 8, decisionLevel: 8 },
    followupLogs: [
      { date: '2026-02-10', action: '提交线索申请', result: '通过' },
      { date: '2026-02-25', action: '对接人确认', result: '技术总监王总工对接' },
    ],
  },
  {
    id: 'crm-016', companyName: '京东方科技集团', industry: '电子',
    ownerPartnerId: 'p-002', ownerPartnerName: '李明',
    stage: 'applied', appliedAt: '2026-05-01', contactDeadline: '2026-06-01', meetingDeadline: '2026-07-01',
    isExclusive: false, isOverdue: false, source: 'manual',
    followupLogs: [
      { date: '2026-05-01', action: '主动登记项目', result: '北京亦庄工厂节能改造意向' },
    ],
  },
  {
    id: 'crm-017', companyName: '北京首钢朗泽新能源', industry: '新能源',
    ownerPartnerId: 'p-002', ownerPartnerName: '李明',
    stage: 'exclusive', appliedAt: '2025-12-15', contactDeadline: '2026-01-15', meetingDeadline: '2026-02-15',
    exclusiveStart: '2026-02-20', exclusiveEnd: '2026-08-20',
    isExclusive: true, isOverdue: false, source: 'manual',
    contactPerson: { name: '何副总', role: '副总经理', phone: '136****4444', trustLevel: 9, decisionLevel: 9 },
    followupLogs: [
      { date: '2025-12-15', action: '登记项目', result: '已登记' },
      { date: '2026-01-05', action: '对接人确认', result: '副总何总对接' },
      { date: '2026-02-10', action: '申请线上接洽', result: '等待平台安排' },
      { date: '2026-02-20', action: '线上接洽完成', result: '已进入180天排他保护期' },
      { date: '2026-04-10', action: '现场考察', result: '带技术团队考察，方案可行' },
    ],
  },

  // ========== 王强 p-003 ==========
  {
    id: 'crm-003', leadId: 'lead-010', companyName: '比亚迪股份有限公司', industry: '制造业',
    ownerPartnerId: 'p-003', ownerPartnerName: '王强',
    stage: 'exclusive', appliedAt: '2025-12-01', contactDeadline: '2026-01-01', meetingDeadline: '2026-02-01',
    exclusiveStart: '2026-02-01', exclusiveEnd: '2026-08-01',
    isExclusive: true, isOverdue: false, source: 'lead',
    contactPerson: { name: '李副总', role: '副总经理', phone: '136****9876', trustLevel: 9, decisionLevel: 9 },
    followupLogs: [
      { date: '2025-12-01', action: '申请跟进', result: '通过' },
      { date: '2025-12-20', action: '对接人确认', result: '已对接副总经理' },
      { date: '2026-01-15', action: '线上接洽', result: '方案获得初步认可' },
      { date: '2026-02-01', action: '进入排他期', result: '6个月排他保护' },
      { date: '2026-03-15', action: '方案报价', result: '报价方案已提交' },
      { date: '2026-04-28', action: '现场拜访', result: '高层会谈推进中' },
    ],
  },
  {
    id: 'crm-012', companyName: '三一重工股份有限公司', industry: '制造业',
    ownerPartnerId: 'p-003', ownerPartnerName: '王强',
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
  {
    id: 'crm-018', companyName: '华为技术有限公司', industry: '电子',
    ownerPartnerId: 'p-003', ownerPartnerName: '王强',
    stage: 'online_meeting', appliedAt: '2026-03-01', contactDeadline: '2026-04-01', meetingDeadline: '2026-05-01',
    isExclusive: false, isOverdue: false, source: 'manual',
    contactPerson: { name: '林经理', role: '采购经理', phone: '158****7777', trustLevel: 7, decisionLevel: 6 },
    followupLogs: [
      { date: '2026-03-01', action: '主动登记', result: '深圳松山湖园区光伏项目' },
      { date: '2026-03-15', action: '对接人确认', result: '采购经理林经理' },
      { date: '2026-04-05', action: '申请线上接洽', result: '等待平台安排' },
    ],
  },
  {
    id: 'crm-019', companyName: '大族激光科技', industry: '制造业',
    ownerPartnerId: 'p-003', ownerPartnerName: '王强',
    stage: 'applied', appliedAt: '2026-05-03', contactDeadline: '2026-06-03', meetingDeadline: '2026-07-03',
    isExclusive: false, isOverdue: false, source: 'manual',
    followupLogs: [
      { date: '2026-05-03', action: '主动登记', result: '深圳宝安厂区储能需求' },
    ],
  },

  // ========== 赵刚 p-004 ==========
  {
    id: 'crm-020', companyName: '五粮液集团有限公司', industry: '食品加工',
    ownerPartnerId: 'p-004', ownerPartnerName: '赵刚',
    stage: 'contact_filled', appliedAt: '2026-04-01', contactDeadline: '2026-05-01', meetingDeadline: '2026-06-01',
    isExclusive: false, isOverdue: false, source: 'manual',
    contactPerson: { name: '杨工', role: '能源管理部', phone: '181****2222', trustLevel: 6, decisionLevel: 5 },
    followupLogs: [
      { date: '2026-04-01', action: '主动登记', result: '宜宾工业园区节能改造' },
      { date: '2026-04-18', action: '对接人确认', result: '能源管理部杨工' },
    ],
  },
  {
    id: 'crm-021', leadId: 'lead-014', companyName: '通威集团有限公司', industry: '光伏',
    ownerPartnerId: 'p-004', ownerPartnerName: '赵刚',
    stage: 'applied', appliedAt: '2026-05-05', contactDeadline: '2026-06-05', meetingDeadline: '2026-07-05',
    isExclusive: false, isOverdue: false, source: 'lead',
    followupLogs: [
      { date: '2026-05-05', action: '提交线索申请', result: '成都双流生产基地储能项目' },
    ],
  },

  // ========== 陈丽 p-005 ==========
  {
    id: 'crm-007', companyName: '首钢集团有限公司', industry: '钢铁',
    ownerPartnerId: 'p-005', ownerPartnerName: '陈丽',
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
    id: 'crm-022', companyName: '杭萧钢构股份有限公司', industry: '建筑',
    ownerPartnerId: 'p-005', ownerPartnerName: '陈丽',
    stage: 'contact_filled', appliedAt: '2026-04-08', contactDeadline: '2026-05-08', meetingDeadline: '2026-06-08',
    isExclusive: false, isOverdue: false, source: 'manual',
    contactPerson: { name: '钱总', role: '项目经理', phone: '152****6666', trustLevel: 7, decisionLevel: 6 },
    followupLogs: [
      { date: '2026-04-08', action: '主动登记', result: '杭州总部节能项目' },
      { date: '2026-04-22', action: '对接人确认', result: '项目经理钱总' },
    ],
  },
  {
    id: 'crm-023', companyName: '娃哈哈集团有限公司', industry: '食品加工',
    ownerPartnerId: 'p-005', ownerPartnerName: '陈丽',
    stage: 'signed', appliedAt: '2025-09-01', contactDeadline: '2025-10-01', meetingDeadline: '2025-11-01',
    exclusiveStart: '2025-11-05', exclusiveEnd: '2026-05-05',
    isExclusive: false, isOverdue: false, source: 'manual',
    contactPerson: { name: '蒋副总', role: '副总', phone: '137****9999', trustLevel: 9, decisionLevel: 9 },
    followupLogs: [
      { date: '2025-09-01', action: '登记项目', result: '杭州下沙工厂' },
      { date: '2025-09-20', action: '对接确认', result: '副总蒋总' },
      { date: '2025-10-15', action: '线上接洽', result: '通过' },
      { date: '2025-11-05', action: '排他期', result: '排他6个月' },
      { date: '2026-04-25', action: '签单', result: '合同金额680万' },
    ],
  },

  // ========== 刘洋 p-006 ==========
  {
    id: 'crm-006', companyName: '中石化青岛炼化', industry: '化工',
    ownerPartnerId: 'p-006', ownerPartnerName: '刘洋',
    stage: 'contact_filled', appliedAt: '2026-03-01', contactDeadline: '2026-04-01', meetingDeadline: '2026-05-01',
    isExclusive: false, isOverdue: true, source: 'manual',
    contactPerson: { name: '刘工', role: '能源管理工程师', phone: '137****4567', trustLevel: 6, decisionLevel: 4 },
    followupLogs: [
      { date: '2026-03-01', action: '登记项目', result: '已登记' },
      { date: '2026-03-25', action: '填写对接人', result: '已确认刘工为对接人' },
    ],
  },
  {
    id: 'crm-024', companyName: '武汉钢铁有限公司', industry: '钢铁',
    ownerPartnerId: 'p-006', ownerPartnerName: '刘洋',
    stage: 'applied', appliedAt: '2026-05-02', contactDeadline: '2026-06-02', meetingDeadline: '2026-07-02',
    isExclusive: false, isOverdue: false, source: 'manual',
    followupLogs: [
      { date: '2026-05-02', action: '主动登记', result: '武钢余热回收项目意向' },
    ],
  },

  // ========== 孙涛 p-007 ==========
  {
    id: 'crm-009', companyName: '宁德时代新能源科技', industry: '新能源',
    ownerPartnerId: 'p-007', ownerPartnerName: '孙涛',
    stage: 'online_meeting', appliedAt: '2026-03-05', contactDeadline: '2026-04-05', meetingDeadline: '2026-05-05',
    isExclusive: false, isOverdue: false, source: 'manual',
    contactPerson: { name: '张经理', role: '采购经理', phone: '158****2345', trustLevel: 7, decisionLevel: 6 },
    followupLogs: [
      { date: '2026-03-05', action: '登记项目', result: '已登记' },
      { date: '2026-03-20', action: '对接人确认', result: '采购经理张经理' },
      { date: '2026-04-10', action: '申请线上接洽', result: '等待平台安排' },
    ],
  },
  {
    id: 'crm-025', companyName: '南京钢铁联合有限公司', industry: '钢铁',
    ownerPartnerId: 'p-007', ownerPartnerName: '孙涛',
    stage: 'exclusive', appliedAt: '2025-10-20', contactDeadline: '2025-11-20', meetingDeadline: '2025-12-20',
    exclusiveStart: '2026-01-05', exclusiveEnd: '2026-07-05',
    isExclusive: true, isOverdue: false, source: 'manual',
    contactPerson: { name: '秦总', role: '副总经理', phone: '138****5555', trustLevel: 8, decisionLevel: 9 },
    followupLogs: [
      { date: '2025-10-20', action: '登记项目', result: '南钢余热发电项目' },
      { date: '2025-11-08', action: '对接确认', result: '副总秦总直接对接' },
      { date: '2025-12-15', action: '线上接洽', result: '技术方案通过评审' },
      { date: '2026-01-05', action: '进入排他期', result: '排他6个月' },
      { date: '2026-03-10', action: '二次拜访', result: '合同条款磋商中' },
    ],
  },
  {
    id: 'crm-026', companyName: '徐工集团工程机械', industry: '制造业',
    ownerPartnerId: 'p-007', ownerPartnerName: '孙涛',
    stage: 'applied', appliedAt: '2026-04-28', contactDeadline: '2026-05-28', meetingDeadline: '2026-06-28',
    isExclusive: false, isOverdue: false, source: 'manual',
    followupLogs: [
      { date: '2026-04-28', action: '主动登记', result: '徐州厂区光伏项目' },
    ],
  },

  // ========== 周芳 p-008 ==========
  {
    id: 'crm-010', companyName: '中国铝业股份有限公司', industry: '有色金属',
    ownerPartnerId: 'p-008', ownerPartnerName: '周芳',
    stage: 'applied', appliedAt: '2026-05-01', contactDeadline: '2026-06-01', meetingDeadline: '2026-07-01',
    isExclusive: false, isOverdue: false, source: 'lead',
    followupLogs: [
      { date: '2026-05-01', action: '提交申请', result: '等待对接' },
    ],
  },
  {
    id: 'crm-011', companyName: '华润水泥控股有限公司', industry: '建材',
    ownerPartnerId: 'p-008', ownerPartnerName: '周芳',
    stage: 'contact_filled', appliedAt: '2026-02-20', contactDeadline: '2026-03-20', meetingDeadline: '2026-04-20',
    isExclusive: false, isOverdue: true, source: 'manual',
    contactPerson: { name: '吴科长', role: '生产科长', phone: '159****7890', trustLevel: 5, decisionLevel: 4 },
    followupLogs: [
      { date: '2026-02-20', action: '登记', result: '已登记' },
      { date: '2026-03-10', action: '对接确认', result: '已确认' },
    ],
  },
  {
    id: 'crm-027', companyName: '广汽集团有限公司', industry: '制造业',
    ownerPartnerId: 'p-008', ownerPartnerName: '周芳',
    stage: 'online_meeting', appliedAt: '2026-02-28', contactDeadline: '2026-03-28', meetingDeadline: '2026-04-28',
    isExclusive: false, isOverdue: false, source: 'manual',
    contactPerson: { name: '谭部长', role: '能源管理部', phone: '186****3333', trustLevel: 7, decisionLevel: 7 },
    followupLogs: [
      { date: '2026-02-28', action: '登记项目', result: '广州番禺基地' },
      { date: '2026-03-15', action: '对接确认', result: '能源管理部谭部长' },
      { date: '2026-04-08', action: '申请线上接洽', result: '等待平台安排' },
    ],
  },

  // ========== 已释放项目 ==========
  {
    id: 'crm-028', companyName: '东方航空MRO基地', industry: '航空',
    ownerPartnerId: 'p-006', ownerPartnerName: '刘洋',
    stage: 'released', appliedAt: '2025-10-01', contactDeadline: '2025-11-01', meetingDeadline: '2025-12-01',
    isExclusive: false, isOverdue: true, source: 'manual',
    followupLogs: [
      { date: '2025-10-01', action: '登记项目', result: '已登记' },
      { date: '2025-11-30', action: '释放归属', result: '30天未补对接人，自动释放' },
    ],
  },
]
