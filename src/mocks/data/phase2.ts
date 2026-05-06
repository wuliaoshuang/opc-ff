import type { CustomerBinding, SubPartner, TrainingResource, AigcTemplate, AigcHistory, RedPacketTask, CommissionRecord, IncentiveTask } from '@/types'

export const mockBindings: CustomerBinding[] = [
  // 张伟 p-001
  {
    id: 'bind-001', customerId: 'cust-001', customerName: '海螺水泥股份有限公司', industry: '建材',
    partnerId: 'p-001', partnerName: '张伟', bindingType: 'lead_apply', stage: 'exclusive', status: 'active',
    boundAt: '2026-03-10', expiredAt: '2026-09-29', contactPerson: '陈主任', contactRole: '设备科长', linkedProjects: 1,
    history: [
      { date: '2026-03-10', from: 'released', to: 'temporary', action: '从AI线索池申请绑定', operator: '张伟' },
      { date: '2026-03-18', from: 'temporary', to: 'locked', action: '补全对接人信息：陈主任（设备科长）', operator: '张伟' },
      { date: '2026-04-02', from: 'locked', to: 'exclusive', action: '平台确认线上接洽完成', operator: '管理员' },
    ],
  },
  {
    id: 'bind-006', customerId: 'cust-006', customerName: '万华化学集团股份有限公司', industry: '化工',
    partnerId: 'p-001', partnerName: '张伟', bindingType: 'lead_apply', stage: 'locked', status: 'active',
    boundAt: '2026-04-25', expiredAt: '2026-06-25', contactPerson: '周总', contactRole: '能源管理部', linkedProjects: 1,
    history: [
      { date: '2026-04-25', from: 'released', to: 'temporary', action: '从AI线索池申请绑定', operator: '张伟' },
      { date: '2026-05-02', from: 'temporary', to: 'locked', action: '补全对接人信息：周总（能源管理部）', operator: '张伟' },
    ],
  },
  {
    id: 'bind-009', customerId: 'cust-009', customerName: '金风科技股份有限公司', industry: '风电设备',
    partnerId: 'p-001', partnerName: '张伟', bindingType: 'manual', stage: 'temporary', status: 'active',
    boundAt: '2026-04-20', expiredAt: '2026-05-20', linkedProjects: 1,
    history: [
      { date: '2026-04-20', from: 'released', to: 'temporary', action: '主动登记私有资源', operator: '张伟' },
    ],
  },
  {
    id: 'bind-010', customerId: 'cust-010', customerName: '上海电气集团', industry: '电力设备',
    partnerId: 'p-001', partnerName: '张伟', bindingType: 'manual', stage: 'locked', status: 'active',
    boundAt: '2026-03-20', expiredAt: '2026-05-20', contactPerson: '孙总监', contactRole: '技术总监', linkedProjects: 1,
    history: [
      { date: '2026-03-20', from: 'released', to: 'temporary', action: '主动登记私有资源', operator: '张伟' },
      { date: '2026-04-05', from: 'temporary', to: 'locked', action: '补全对接人信息：孙总监（技术总监）', operator: '张伟' },
    ],
  },
  {
    id: 'bind-005', customerId: 'cust-005', customerName: '蒙牛乳业有限公司', industry: '食品加工',
    partnerId: 'p-001', partnerName: '张伟', bindingType: 'manual', stage: 'released', status: 'inactive',
    boundAt: '2025-08-10', expiredAt: '2026-04-10', linkedProjects: 1,
    history: [
      { date: '2025-08-10', from: 'released', to: 'temporary', action: '主动登记私有资源', operator: '张伟' },
      { date: '2025-09-01', from: 'temporary', to: 'locked', action: '补全对接人信息', operator: '张伟' },
      { date: '2025-09-25', from: 'locked', to: 'exclusive', action: '线上接洽完成', operator: '系统' },
      { date: '2026-03-15', from: 'exclusive', to: 'released', action: '项目签单完成，绑定释放', operator: '系统' },
    ],
  },
  // 李明 p-002
  {
    id: 'bind-003', customerId: 'cust-003', customerName: '太阳纸业股份有限公司', industry: '造纸',
    partnerId: 'p-002', partnerName: '李明', bindingType: 'lead_apply', stage: 'locked', status: 'active',
    boundAt: '2026-02-10', expiredAt: '2026-04-10', contactPerson: '王总工', contactRole: '技术总监', linkedProjects: 1,
    history: [
      { date: '2026-02-10', from: 'released', to: 'temporary', action: '从AI线索池申请绑定', operator: '李明' },
      { date: '2026-02-25', from: 'temporary', to: 'locked', action: '补全对接人信息：王总工（技术总监）', operator: '李明' },
    ],
  },
  {
    id: 'bind-011', customerId: 'cust-011', customerName: '京东方科技集团', industry: '电子',
    partnerId: 'p-002', partnerName: '李明', bindingType: 'manual', stage: 'temporary', status: 'active',
    boundAt: '2026-05-01', expiredAt: '2026-06-01', linkedProjects: 1,
    history: [
      { date: '2026-05-01', from: 'released', to: 'temporary', action: '主动登记私有资源', operator: '李明' },
    ],
  },
  {
    id: 'bind-012', customerId: 'cust-012', customerName: '北京首钢朗泽新能源', industry: '新能源',
    partnerId: 'p-002', partnerName: '李明', bindingType: 'manual', stage: 'exclusive', status: 'active',
    boundAt: '2025-12-15', expiredAt: '2026-08-20', contactPerson: '何副总', contactRole: '副总经理', linkedProjects: 1,
    history: [
      { date: '2025-12-15', from: 'released', to: 'temporary', action: '主动登记私有资源', operator: '李明' },
      { date: '2026-01-05', from: 'temporary', to: 'locked', action: '补全对接人信息：何副总（副总经理）', operator: '李明' },
      { date: '2026-02-20', from: 'locked', to: 'exclusive', action: '平台确认线上接洽完成', operator: '管理员' },
    ],
  },
  // 王强 p-003
  {
    id: 'bind-002', customerId: 'cust-002', customerName: '比亚迪股份有限公司', industry: '制造业',
    partnerId: 'p-003', partnerName: '王强', bindingType: 'lead_apply', stage: 'exclusive', status: 'active',
    boundAt: '2025-12-01', expiredAt: '2026-08-01', contactPerson: '李副总', contactRole: '副总经理', linkedProjects: 1,
    history: [
      { date: '2025-12-01', from: 'released', to: 'temporary', action: '从AI线索池申请绑定', operator: '王强' },
      { date: '2025-12-20', from: 'temporary', to: 'locked', action: '补全对接人信息：李副总（副总经理）', operator: '王强' },
      { date: '2026-02-01', from: 'locked', to: 'exclusive', action: '平台确认线上接洽完成', operator: '管理员' },
    ],
  },
  {
    id: 'bind-004', customerId: 'cust-004', customerName: '三一重工股份有限公司', industry: '制造业',
    partnerId: 'p-003', partnerName: '王强', bindingType: 'lead_apply', stage: 'released', status: 'inactive',
    boundAt: '2025-07-01', expiredAt: '2026-03-01', contactPerson: '黄董助', contactRole: '董事长助理', linkedProjects: 1,
    history: [
      { date: '2025-07-01', from: 'released', to: 'temporary', action: '线索申请绑定', operator: '王强' },
      { date: '2025-07-20', from: 'temporary', to: 'locked', action: '补全对接人', operator: '王强' },
      { date: '2025-09-01', from: 'locked', to: 'exclusive', action: '线上接洽完成', operator: '系统' },
      { date: '2026-02-20', from: 'exclusive', to: 'released', action: '项目签单完成，绑定释放', operator: '系统' },
    ],
  },
  {
    id: 'bind-013', customerId: 'cust-013', customerName: '华为技术有限公司', industry: '电子',
    partnerId: 'p-003', partnerName: '王强', bindingType: 'manual', stage: 'locked', status: 'active',
    boundAt: '2026-03-01', expiredAt: '2026-05-01', contactPerson: '林经理', contactRole: '采购经理', linkedProjects: 1,
    history: [
      { date: '2026-03-01', from: 'released', to: 'temporary', action: '主动登记私有资源', operator: '王强' },
      { date: '2026-03-15', from: 'temporary', to: 'locked', action: '补全对接人信息：林经理（采购经理）', operator: '王强' },
    ],
  },
  {
    id: 'bind-014', customerId: 'cust-014', customerName: '大族激光科技', industry: '制造业',
    partnerId: 'p-003', partnerName: '王强', bindingType: 'manual', stage: 'temporary', status: 'active',
    boundAt: '2026-05-03', expiredAt: '2026-06-03', linkedProjects: 1,
    history: [
      { date: '2026-05-03', from: 'released', to: 'temporary', action: '主动登记私有资源', operator: '王强' },
    ],
  },
  // 赵刚 p-004
  {
    id: 'bind-015', customerId: 'cust-015', customerName: '五粮液集团有限公司', industry: '食品加工',
    partnerId: 'p-004', partnerName: '赵刚', bindingType: 'manual', stage: 'locked', status: 'active',
    boundAt: '2026-04-01', expiredAt: '2026-06-01', contactPerson: '杨工', contactRole: '能源管理部', linkedProjects: 1,
    history: [
      { date: '2026-04-01', from: 'released', to: 'temporary', action: '主动登记私有资源', operator: '赵刚' },
      { date: '2026-04-18', from: 'temporary', to: 'locked', action: '补全对接人信息：杨工（能源管理部）', operator: '赵刚' },
    ],
  },
  {
    id: 'bind-016', customerId: 'cust-016', customerName: '通威集团有限公司', industry: '光伏',
    partnerId: 'p-004', partnerName: '赵刚', bindingType: 'lead_apply', stage: 'temporary', status: 'active',
    boundAt: '2026-05-05', expiredAt: '2026-06-05', linkedProjects: 1,
    history: [
      { date: '2026-05-05', from: 'released', to: 'temporary', action: '从AI线索池申请绑定', operator: '赵刚' },
    ],
  },
  // 陈丽 p-005
  {
    id: 'bind-007', customerId: 'cust-007', customerName: '首钢集团有限公司', industry: '钢铁',
    partnerId: 'p-005', partnerName: '陈丽', bindingType: 'manual', stage: 'exclusive', status: 'active',
    boundAt: '2025-11-15', expiredAt: '2026-07-15', contactPerson: '马总', contactRole: '能源部部长', linkedProjects: 1,
    history: [
      { date: '2025-11-15', from: 'released', to: 'temporary', action: '主动登记私有资源', operator: '陈丽' },
      { date: '2025-12-05', from: 'temporary', to: 'locked', action: '补全对接人信息：马总（能源部部长）', operator: '陈丽' },
      { date: '2026-01-15', from: 'locked', to: 'exclusive', action: '平台确认线上接洽完成', operator: '管理员' },
    ],
  },
  {
    id: 'bind-017', customerId: 'cust-017', customerName: '杭萧钢构股份有限公司', industry: '建筑',
    partnerId: 'p-005', partnerName: '陈丽', bindingType: 'manual', stage: 'locked', status: 'active',
    boundAt: '2026-04-08', expiredAt: '2026-06-08', contactPerson: '钱总', contactRole: '项目经理', linkedProjects: 1,
    history: [
      { date: '2026-04-08', from: 'released', to: 'temporary', action: '主动登记私有资源', operator: '陈丽' },
      { date: '2026-04-22', from: 'temporary', to: 'locked', action: '补全对接人信息：钱总（项目经理）', operator: '陈丽' },
    ],
  },
  // 刘洋 p-006
  {
    id: 'bind-018', customerId: 'cust-018', customerName: '中石化青岛炼化', industry: '化工',
    partnerId: 'p-006', partnerName: '刘洋', bindingType: 'manual', stage: 'locked', status: 'active',
    boundAt: '2026-03-01', expiredAt: '2026-05-01', contactPerson: '刘工', contactRole: '能源管理工程师', linkedProjects: 1,
    history: [
      { date: '2026-03-01', from: 'released', to: 'temporary', action: '主动登记私有资源', operator: '刘洋' },
      { date: '2026-03-25', from: 'temporary', to: 'locked', action: '补全对接人信息：刘工（能源管理工程师）', operator: '刘洋' },
    ],
  },
  // 孙涛 p-007
  {
    id: 'bind-008', customerId: 'cust-008', customerName: '宁德时代新能源科技', industry: '新能源',
    partnerId: 'p-007', partnerName: '孙涛', bindingType: 'manual', stage: 'locked', status: 'active',
    boundAt: '2026-03-05', expiredAt: '2026-05-05', contactPerson: '张经理', contactRole: '采购经理', linkedProjects: 1,
    history: [
      { date: '2026-03-05', from: 'released', to: 'temporary', action: '主动登记私有资源', operator: '孙涛' },
      { date: '2026-03-20', from: 'temporary', to: 'locked', action: '补全对接人信息：张经理（采购经理）', operator: '孙涛' },
    ],
  },
  {
    id: 'bind-019', customerId: 'cust-019', customerName: '南京钢铁联合有限公司', industry: '钢铁',
    partnerId: 'p-007', partnerName: '孙涛', bindingType: 'manual', stage: 'exclusive', status: 'active',
    boundAt: '2025-10-20', expiredAt: '2026-07-05', contactPerson: '秦总', contactRole: '副总经理', linkedProjects: 1,
    history: [
      { date: '2025-10-20', from: 'released', to: 'temporary', action: '主动登记私有资源', operator: '孙涛' },
      { date: '2025-11-08', from: 'temporary', to: 'locked', action: '补全对接人信息：秦总（副总经理）', operator: '孙涛' },
      { date: '2026-01-05', from: 'locked', to: 'exclusive', action: '平台确认线上接洽完成', operator: '管理员' },
    ],
  },
  // 周芳 p-008
  {
    id: 'bind-020', customerId: 'cust-020', customerName: '华润水泥控股有限公司', industry: '建材',
    partnerId: 'p-008', partnerName: '周芳', bindingType: 'manual', stage: 'locked', status: 'active',
    boundAt: '2026-02-20', expiredAt: '2026-04-20', contactPerson: '吴科长', contactRole: '生产科长', linkedProjects: 1,
    history: [
      { date: '2026-02-20', from: 'released', to: 'temporary', action: '主动登记私有资源', operator: '周芳' },
      { date: '2026-03-10', from: 'temporary', to: 'locked', action: '补全对接人信息：吴科长（生产科长）', operator: '周芳' },
    ],
  },
  {
    id: 'bind-021', customerId: 'cust-021', customerName: '广汽集团有限公司', industry: '制造业',
    partnerId: 'p-008', partnerName: '周芳', bindingType: 'manual', stage: 'locked', status: 'active',
    boundAt: '2026-02-28', expiredAt: '2026-04-28', contactPerson: '谭部长', contactRole: '能源管理部', linkedProjects: 1,
    history: [
      { date: '2026-02-28', from: 'released', to: 'temporary', action: '主动登记私有资源', operator: '周芳' },
      { date: '2026-03-15', from: 'temporary', to: 'locked', action: '补全对接人信息：谭部长（能源管理部）', operator: '周芳' },
    ],
  },
]


export const mockSubPartners: SubPartner[] = [
  { id: 'sp-001', name: '小张', region: '上海浦东', level: 2, parentId: 'p-001', parentName: '张伟', leads: 3, projects: 1, activeProjects: 1, totalCommission: 12000, status: 'active', boundAt: '2026-02-15' },
  { id: 'sp-002', name: '小李', region: '上海松江', level: 2, parentId: 'p-001', parentName: '张伟', leads: 2, projects: 0, activeProjects: 0, totalCommission: 0, status: 'active', boundAt: '2026-03-20' },
  { id: 'sp-003', name: '小王', region: '深圳南山', level: 2, parentId: 'p-003', parentName: '王强', leads: 5, projects: 2, activeProjects: 2, totalCommission: 35000, status: 'active', boundAt: '2026-01-10' },
  { id: 'sp-004', name: '小赵', region: '成都高新', level: 2, parentId: 'p-004', parentName: '赵刚', leads: 1, projects: 0, activeProjects: 0, totalCommission: 0, status: 'inactive', boundAt: '2025-11-05' },
  { id: 'sp-005', name: '小周', region: '杭州余杭', level: 2, parentId: 'p-005', parentName: '陈丽', leads: 4, projects: 1, activeProjects: 1, totalCommission: 8000, status: 'active', boundAt: '2026-04-01' },
  { id: 'sp-006', name: '小林', region: '广州番禺', level: 2, parentId: 'p-008', parentName: '周芳', leads: 2, projects: 1, activeProjects: 0, totalCommission: 5000, status: 'active', boundAt: '2026-03-15' },
]

export const mockTrainingResources: TrainingResource[] = [
  { id: 'tr-001', title: '综合能源项目开发全流程', category: 'process', type: 'doc', summary: '从项目发现到签单的一二期标准开发流程', content: '第一步：项目信息收集\n第二步：初步评估\n第三步：申请跟进\n第四步：补全对接人\n第五步：安排线上接洽\n第六步：进入排他保护\n\n本文档聚焦一二期业务闭环，包括线索申请、CRM跟进、客户绑定、激励任务和结算协同。' },
  { id: 'tr-002', title: '客户拜访技巧与话术', category: 'process', type: 'doc', summary: '面对不同角色客户的沟通策略和常用话术', content: '面对设备科长时的话术要点：\n1. 关注设备运行效率\n2. 强调节能降耗效果\n3. 提供同行案例数据...' },
  { id: 'tr-003', title: '分布式光伏基础知识', category: 'knowledge', type: 'doc', summary: '光伏系统组成、工作原理和经济性分析基础', content: '分布式光伏系统由光伏组件、逆变器、支架系统、电气系统和监控系统组成...' },
  { id: 'tr-004', title: '储能系统产品介绍', category: 'knowledge', type: 'video', summary: '工商业储能系统的技术方案和商业模式详解', content: '本视频课程涵盖工商业储能系统的技术架构、选型要点和主流商业模式（峰谷套利、需量管理、备电等）。' },
  { id: 'tr-005', title: '综合能源行业政策解读', category: 'knowledge', type: 'doc', summary: '2026年最新综合能源政策和补贴信息汇总', content: '一、国家层面政策\n1. 碳达峰碳中和相关政策\n2. 分布式能源发展指导意见\n3. 储能发展实施方案...' },
  { id: 'tr-006', title: '客户常见问题：投资回报', category: 'qa', type: 'faq', summary: '光伏储能项目投资回报期相关问题解答', content: 'Q: 光伏项目投资回报期一般多久？\nA: 一般在5-7年，具体取决于当地电价、日照条件和补贴政策。' },
  { id: 'tr-007', title: '客户常见问题：并网流程', category: 'qa', type: 'faq', summary: '分布式光伏并网备案流程相关问题', content: 'Q: 光伏并网需要哪些手续？\nA: 需要在当地发改委备案，向电网公司申请接入...' },
  { id: 'tr-008', title: '客户常见问题：安全隐患', category: 'qa', type: 'faq', summary: '屋顶光伏安全性相关问题', content: 'Q: 屋顶安装光伏会不会漏水？\nA: 采用专业安装工艺和防水处理，不会影响屋面防水...' },
  { id: 'tr-009', title: '初次拜访话术模板', category: 'script', type: 'doc', summary: '首次客户拜访的标准话术流程', content: '开场白：\n"X总您好，我是零碳能源的XX，我们专注于帮助像贵公司这样的企业降低能源成本..."' },
  { id: 'tr-010', title: '报价阶段话术模板', category: 'script', type: 'doc', summary: '项目报价和方案讲解话术要点', content: '报价讲解话术：\n"这份方案是根据贵公司的用电数据量身定制的..."' },
  { id: 'tr-011', title: '异议处理话术', category: 'script', type: 'doc', summary: '应对客户常见拒绝理由的话术', content: '当客户说"太贵了"：\n"理解您的顾虑，我来给您算一笔账..."' },
  { id: 'tr-012', title: 'AI问答：综合能源概念', category: 'ai', type: 'doc', summary: 'AI知识库 - 综合能源服务相关知识', content: '综合能源服务是指以满足客户多元化能源需求为目标...' },
  { id: 'tr-013', title: 'AI问答：OPC政策体系', category: 'ai', type: 'doc', summary: 'AI知识库 - OPC城市合伙人政策解读', content: 'OPC城市合伙人政策核心要点：\n1. 准入条件\n2. 权益保障\n3. 考核机制...' },
  { id: 'tr-014', title: 'AI问答：碳交易入门', category: 'ai', type: 'doc', summary: 'AI知识库 - 碳交易市场基础知识', content: '中国碳交易市场于2021年7月启动，目前覆盖发电行业...' },
  { id: 'tr-015', title: '项目现场拜访SOP', category: 'process', type: 'video', summary: '现场拜访标准操作流程视频教程', content: '本视频讲解了项目现场拜访的标准流程：准备物料清单、预约确认、着装规范、拍照记录要求、会议纪要模板...' },
]

export const mockAigcHistory: AigcHistory[] = [
  { id: 'aigc-001', type: 'policy', keyword: '分布式光伏补贴政策', output: '【2026年分布式光伏补贴政策解读】\n\n随着双碳目标的深入推进，2026年国家层面继续加大对分布式光伏的支持力度...', createdAt: '2026-05-01' },
  { id: 'aigc-002', type: 'case', keyword: '制造业屋顶光伏案例', output: '【案例分享：某大型制造企业屋顶光伏项目】\n\n项目背景：该企业拥有厂房屋顶面积5万平方米，年用电量超过3000万度...', createdAt: '2026-04-28' },
  { id: 'aigc-003', type: 'opportunity', keyword: '储能市场趋势', output: '【2026年工商业储能市场机遇分析】\n\n随着峰谷电价差持续扩大，工商业储能迎来黄金发展期...', createdAt: '2026-04-25' },
  { id: 'aigc-004', type: 'policy', keyword: '碳交易新规', output: '【碳交易市场新规解读】\n\n2026年碳排放权交易管理条例修订要点...', createdAt: '2026-04-20' },
  { id: 'aigc-005', type: 'case', keyword: '化工企业节能', output: '【化工企业综合节能方案实践】\n\n某化工企业通过热电联产+余热回收方案，年节约能源成本超过2000万元...', createdAt: '2026-04-15' },
]

export const mockAigcTemplates: AigcTemplate[] = [
  { id: 'tpl-policy', type: 'policy', title: '政策解读获客模板', promptTemplate: '围绕{{keyword}}，从政策窗口、适配客户、沟通切入和下一步动作生成城市合伙人可发布内容。', outputStructure: '政策要点\n客户关联\n获客话题\n行动建议', status: 'active', updatedAt: '2026-05-06' },
  { id: 'tpl-case', type: 'case', title: '案例讲解复盘模板', promptTemplate: '围绕{{keyword}}，生成一个适合自媒体获客的案例复盘，突出客户痛点、方案切入和可复制话术。', outputStructure: '案例背景\n方案切入\n可复用素材\n发布文案', status: 'active', updatedAt: '2026-05-06' },
  { id: 'tpl-opportunity', type: 'opportunity', title: '行业机会判断模板', promptTemplate: '围绕{{keyword}}，帮助城市合伙人判断行业机会、优先客户画像和线索动作。', outputStructure: '行业机会\n优先客户画像\n线索动作\n朋友圈角度', status: 'active', updatedAt: '2026-05-06' },
]

export const mockRedPacketTasks: RedPacketTask[] = [
  // 平台发布 - 未领取
  { id: 'rp-001', name: '华能国际现场拜访奖励', projectName: '华能国际电力清洁能源项目', amount: 2000, description: '完成华能国际项目现场拜访并提交拜访报告', requirements: '拍照记录+会议纪要+对接人签字确认', createdAt: '2026-05-06T10:20:00.000Z', deadline: '2026-06-30', status: 'available', createdBy: 'platform' },
  { id: 'rp-003', name: '新客户首次拜访激励', projectName: '通用任务', amount: 500, description: '本月完成3家新客户首次拜访', requirements: '每家客户需提交拜访记录和名片', createdAt: '2026-05-05T14:10:00.000Z', deadline: '2026-05-31', status: 'available', createdBy: 'platform' },
  { id: 'rp-005', name: '团队培训完成奖', projectName: '通用任务', amount: 800, description: '完成全部5个培训模块学习', requirements: '每个模块测验得分>=80分', createdAt: '2026-05-03T16:45:00.000Z', deadline: '2026-06-15', status: 'available', createdBy: 'platform' },
  { id: 'rp-008', name: '万华化学对接人确认奖', projectName: '万华化学能源优化项目', amount: 1000, description: '在1个月内完成关键对接人信息填写', requirements: '填写完整对接人信息并通过审核', createdAt: '2026-05-01T12:00:00.000Z', deadline: '2026-05-25', status: 'available', createdBy: 'partner' },
  { id: 'rp-009', name: '首钢集团签单冲刺奖', projectName: '首钢集团余热回收项目', amount: 8000, description: '排他期内促成签约', requirements: '合同签署+首期款到账', createdAt: '2026-04-15T09:00:00.000Z', deadline: '2026-07-15', status: 'available', createdBy: 'platform' },
  // 张伟领取的
  { id: 'rp-002', name: '海螺水泥方案提交奖', projectName: '海螺水泥余热改造项目', amount: 3000, description: '提交完整技术方案并通过内部评审', requirements: '技术方案文档+经济性分析+风险评估', createdAt: '2026-05-04T09:30:00.000Z', deadline: '2026-05-31', status: 'executing', createdBy: 'platform', claimedById: 'p-001', claimedByName: '张伟', claimedAt: '2026-05-04' },
  { id: 'rp-006', name: '月度线索挖掘之星', projectName: '通用任务', amount: 1500, description: '本月新增有效线索数量排名前3', requirements: '有效线索需通过初审', createdAt: '2026-04-25T08:40:00.000Z', deadline: '2026-05-31', status: 'paid', createdBy: 'platform', claimedById: 'p-001', claimedByName: '张伟', claimedAt: '2026-04-26', paidAt: '2026-05-02' },
  { id: 'rp-010', name: '金风科技对接推进奖', projectName: '金风科技风电设备项目', amount: 1200, description: '30天内完成对接人信息填写', requirements: '填写完整对接人并通过审核', createdAt: '2026-04-22T10:00:00.000Z', deadline: '2026-05-20', status: 'executing', createdBy: 'platform', claimedById: 'p-001', claimedByName: '张伟', claimedAt: '2026-04-23' },
  // 王强领取的
  { id: 'rp-004', name: '比亚迪签单冲刺奖', projectName: '比亚迪综合能源项目', amount: 5000, description: '在排他期内完成合同签署', requirements: '合同签署+首期款到账', createdAt: '2026-04-20T11:00:00.000Z', deadline: '2026-08-01', status: 'evidence_submitted', createdBy: 'partner', claimedById: 'p-003', claimedByName: '王强', claimedAt: '2026-04-21', evidence: { images: ['https://placehold.co/400x300/e2e8f0/64748b?text=现场照片1', 'https://placehold.co/400x300/e2e8f0/64748b?text=会议纪要'], description: '2026-04-28 拜访比亚迪坪山工厂，与副总经理李总及能源部门进行了2小时的方案评审会。会议确认了光伏+储能一体化方案的可行性，预计下月签署正式合同。', submittedAt: '2026-04-29' } },
  { id: 'rp-011', name: '华为对接推进奖', projectName: '华为技术有限公司', amount: 1500, description: '完成线上接洽申请', requirements: '提交接洽申请并等待平台安排', createdAt: '2026-04-10T14:00:00.000Z', deadline: '2026-05-10', status: 'paid', createdBy: 'platform', claimedById: 'p-003', claimedByName: '王强', claimedAt: '2026-04-11', paidAt: '2026-04-15' },
  // 李明领取的
  { id: 'rp-012', name: '太阳纸业技术方案奖', projectName: '太阳纸业热电项目', amount: 2500, description: '提交储能配套方案', requirements: '技术方案+投资回报分析', createdAt: '2026-04-18T13:15:00.000Z', deadline: '2026-06-30', status: 'executing', createdBy: 'platform', claimedById: 'p-002', claimedByName: '李明', claimedAt: '2026-04-20' },
  // 陈丽领取的
  { id: 'rp-013', name: '杭萧钢构接洽推进奖', projectName: '杭萧钢构节能项目', amount: 1000, description: '完成对接人信息确认', requirements: '对接人信息填写完整', createdAt: '2026-04-15T11:00:00.000Z', deadline: '2026-05-15', status: 'paid', createdBy: 'platform', claimedById: 'p-005', claimedByName: '陈丽', claimedAt: '2026-04-16', paidAt: '2026-04-25' },
  // 孙涛领取的
  { id: 'rp-014', name: '南钢排他期推进奖', projectName: '南京钢铁余热发电项目', amount: 3000, description: '排他期内推进至合同磋商', requirements: '合同条款初稿+双方盖章确认函', createdAt: '2026-03-15T09:00:00.000Z', deadline: '2026-07-05', status: 'evidence_submitted', createdBy: 'platform', claimedById: 'p-007', claimedByName: '孙涛', claimedAt: '2026-03-16', evidence: { images: ['https://placehold.co/400x300/e2e8f0/64748b?text=合同初稿'], description: '已完成合同条款磋商，双方法务正在审核中。', submittedAt: '2026-04-20' } },
  // 过期
  { id: 'rp-007', name: '太阳纸业排他达成奖', projectName: '太阳纸业热电项目', amount: 2500, description: '成功推进至排他跟进阶段', requirements: '完成线上接洽并获批排他', createdAt: '2026-04-18T13:15:00.000Z', deadline: '2026-06-30', status: 'expired', createdBy: 'platform' },
]

export const mockCommissions: CommissionRecord[] = [
  // 张伟 p-001
  { id: 'comm-001', projectName: '蒙牛乳业光伏项目', partnerId: 'p-001', amount: 36000, type: 'short_term', level: 'primary', status: 'settled', settledAt: '2026-04-15', commissionRate: '3%', month: '2026-04' },
  { id: 'comm-003', projectName: '蒙牛乳业光伏项目', partnerId: 'p-001', amount: 12000, type: 'long_term', level: 'primary', status: 'pending', commissionRate: '1%', month: '2026-05' },
  { id: 'comm-007', projectName: '海螺水泥余热项目', partnerId: 'p-001', amount: 25000, type: 'short_term', level: 'primary', status: 'pending', commissionRate: '3%', month: '2026-05' },
  { id: 'comm-008', projectName: '蒙牛乳业光伏项目', partnerId: 'p-001', amount: 12000, type: 'long_term', level: 'primary', status: 'settled', settledAt: '2026-03-15', commissionRate: '1%', month: '2026-03' },
  { id: 'comm-010', projectName: '蒙牛乳业光伏项目', partnerId: 'p-001', amount: 12000, type: 'long_term', level: 'primary', status: 'settled', settledAt: '2026-02-15', commissionRate: '1%', month: '2026-02' },
  { id: 'comm-012', projectName: '蒙牛乳业光伏项目', partnerId: 'p-001', amount: 12000, type: 'long_term', level: 'primary', status: 'settled', settledAt: '2026-01-15', commissionRate: '1%', month: '2026-01' },
  // 李明 p-002
  { id: 'comm-020', projectName: '北京首钢朗泽新能源项目', partnerId: 'p-002', amount: 45000, type: 'short_term', level: 'primary', status: 'pending', commissionRate: '3%', month: '2026-05' },
  { id: 'comm-021', projectName: '太阳纸业热电项目', partnerId: 'p-002', amount: 18000, type: 'short_term', level: 'primary', status: 'frozen', commissionRate: '2%', month: '2026-04' },
  // 王强 p-003
  { id: 'comm-002', projectName: '三一重工储能项目', partnerId: 'p-003', amount: 84000, type: 'short_term', level: 'primary', status: 'settled', settledAt: '2026-03-20', commissionRate: '3%', month: '2026-03' },
  { id: 'comm-004', projectName: '比亚迪综合能源项目', partnerId: 'p-003', amount: 150000, type: 'short_term', level: 'primary', status: 'frozen', commissionRate: '5%', month: '2026-05' },
  { id: 'comm-006', projectName: '三一重工储能项目', partnerId: 'p-003', amount: 28000, type: 'long_term', level: 'primary', status: 'settled', settledAt: '2026-04-20', commissionRate: '1%', month: '2026-04' },
  { id: 'comm-009', projectName: '三一重工储能项目', partnerId: 'p-003', amount: 28000, type: 'long_term', level: 'primary', status: 'settled', settledAt: '2026-02-20', commissionRate: '1%', month: '2026-02' },
  { id: 'comm-011', projectName: '三一重工储能项目', partnerId: 'p-003', amount: 28000, type: 'long_term', level: 'primary', status: 'settled', settledAt: '2026-01-20', commissionRate: '1%', month: '2026-01' },
  // 赵刚 p-004
  { id: 'comm-030', projectName: '五粮液节能改造项目', partnerId: 'p-004', amount: 15000, type: 'short_term', level: 'primary', status: 'pending', commissionRate: '3%', month: '2026-05' },
  // 陈丽 p-005
  { id: 'comm-005', projectName: '首钢余热回收项目', partnerId: 'p-005', amount: 48000, type: 'short_term', level: 'primary', status: 'pending', commissionRate: '4%', month: '2026-05' },
  { id: 'comm-031', projectName: '娃哈哈光伏项目', partnerId: 'p-005', amount: 20400, type: 'short_term', level: 'primary', status: 'settled', settledAt: '2026-04-28', commissionRate: '3%', month: '2026-04' },
  { id: 'comm-032', projectName: '娃哈哈光伏项目', partnerId: 'p-005', amount: 6800, type: 'long_term', level: 'primary', status: 'settled', settledAt: '2026-05-05', commissionRate: '1%', month: '2026-05' },
  // 孙涛 p-007
  { id: 'comm-040', projectName: '南京钢铁余热发电项目', partnerId: 'p-007', amount: 56000, type: 'short_term', level: 'primary', status: 'pending', commissionRate: '4%', month: '2026-05' },
  { id: 'comm-041', projectName: '宁德时代储能项目', partnerId: 'p-007', amount: 22000, type: 'short_term', level: 'primary', status: 'frozen', commissionRate: '2%', month: '2026-04' },
  // 周芳 p-008
  { id: 'comm-050', projectName: '华润水泥节能项目', partnerId: 'p-008', amount: 18000, type: 'short_term', level: 'primary', status: 'pending', commissionRate: '3%', month: '2026-05' },
  { id: 'comm-051', projectName: '广汽集团光伏项目', partnerId: 'p-008', amount: 32000, type: 'short_term', level: 'primary', status: 'frozen', commissionRate: '3%', month: '2026-04' },
  // 二级分佣
  { id: 'comm-101', projectName: '蒙牛乳业光伏项目', partnerId: 'sp-001', amount: 10800, type: 'short_term', level: 'secondary', parentPartnerId: 'p-001', parentPartnerName: '张伟', status: 'settled', settledAt: '2026-04-15', commissionRate: '1%', month: '2026-04' },
  { id: 'comm-102', projectName: '三一重工储能项目', partnerId: 'sp-003', amount: 25200, type: 'short_term', level: 'secondary', parentPartnerId: 'p-003', parentPartnerName: '王强', status: 'settled', settledAt: '2026-03-20', commissionRate: '1%', month: '2026-03' },
  { id: 'comm-103', projectName: '比亚迪综合能源项目', partnerId: 'sp-003', amount: 45000, type: 'short_term', level: 'secondary', parentPartnerId: 'p-003', parentPartnerName: '王强', status: 'frozen', commissionRate: '1.5%', month: '2026-05' },
  { id: 'comm-104', projectName: '海螺水泥余热项目', partnerId: 'sp-001', amount: 7500, type: 'short_term', level: 'secondary', parentPartnerId: 'p-001', parentPartnerName: '张伟', status: 'pending', commissionRate: '0.5%', month: '2026-05' },
  { id: 'comm-105', projectName: '娃哈哈光伏项目', partnerId: 'sp-005', amount: 6120, type: 'short_term', level: 'secondary', parentPartnerId: 'p-005', parentPartnerName: '陈丽', status: 'settled', settledAt: '2026-04-28', commissionRate: '0.9%', month: '2026-04' },
]

export const mockIncentiveTasks: IncentiveTask[] = [
  { id: 'inc-001', name: 'A类项目现场拜访激励', projectName: '华能国际清洁能源项目', amount: 2000, applicantCount: 3, createdAt: '2026-05-06T09:00:00.000Z', status: 'published', createdBy: 'platform', deadline: '2026-06-30' },
  { id: 'inc-002', name: '排他期签单冲刺奖', projectName: '比亚迪综合能源项目', amount: 5000, applicantCount: 1, createdAt: '2026-05-04T11:30:00.000Z', status: 'published', createdBy: 'platform', deadline: '2026-08-01' },
  { id: 'inc-003', name: 'B类项目拜访奖', projectName: '批量任务', amount: 1000, applicantCount: 8, createdAt: '2026-05-02T15:20:00.000Z', status: 'published', createdBy: 'platform', deadline: '2026-06-15' },
  { id: 'inc-004', name: '新合伙人首单奖', projectName: '通用任务', amount: 3000, applicantCount: 0, createdAt: '2026-05-06T16:00:00.000Z', status: 'draft', createdBy: 'p-001', deadline: '2026-07-31' },
  { id: 'inc-005', name: '季度最佳合伙人', projectName: '通用任务', amount: 10000, applicantCount: 0, createdAt: '2026-03-01T10:00:00.000Z', status: 'closed', createdBy: 'platform', deadline: '2026-03-31' },
  { id: 'inc-006', name: '南钢项目加速奖', projectName: '南京钢铁余热发电项目', amount: 4000, applicantCount: 2, createdAt: '2026-04-01T08:00:00.000Z', status: 'published', createdBy: 'platform', deadline: '2026-07-05' },
  { id: 'inc-007', name: '广汽项目接洽奖', projectName: '广汽集团光伏项目', amount: 1500, applicantCount: 1, createdAt: '2026-04-20T10:00:00.000Z', status: 'published', createdBy: 'platform', deadline: '2026-06-30' },
]
