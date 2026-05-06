import { useState, useCallback } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Brain, Target, Handshake, Lightbulb, MessageSquare, TrendingUp } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'
import type { LeadEvalResult, PotentialLead } from '@/types'

type LeadGradeExtended = LeadEvalResult['overallGrade']
type ExtendedLeadEvalResult = LeadEvalResult & { grade: LeadGradeExtended }

const gradeColors: Record<LeadGradeExtended, string> = {
  S: 'bg-purple-600', A: 'bg-emerald-500', B: 'bg-blue-500', C: 'bg-amber-500', D: 'bg-red-500',
}
const gradeChartColors: Record<LeadGradeExtended, string> = {
  S: '#9333ea', A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#ef4444',
}
const gradeLabels: Record<LeadGradeExtended, string> = {
  S: '必杀项目', A: '优质线索', B: '值得跟进', C: '一般线索', D: '低价值',
}

function scoreRevenue(revenue: string) {
  const numeric = Number(revenue.match(/\d+/)?.[0] ?? 0)
  if (numeric >= 1000) return 100
  if (numeric >= 500) return 90
  if (numeric >= 100) return 80
  if (numeric >= 50) return 70
  if (numeric >= 10) return 60
  return 45
}

function scoreProject(lead?: PotentialLead) {
  if (!lead?.newProjectSize) return 30
  const sizeScore = lead.newProjectSize.includes('大型') ? 90 : lead.newProjectSize.includes('中型') ? 75 : 60
  const progressBonus = lead.newProjectProgress?.includes('招标') || lead.newProjectProgress?.includes('实施')
    ? 10
    : lead.newProjectProgress?.includes('规划') || lead.newProjectProgress?.includes('立项')
      ? 6
      : 0
  return Math.min(100, sizeScore + progressBonus)
}

function deterministicFallbackScore(companyName: string, salt: number) {
  const total = [...companyName].reduce((sum, char) => sum + char.charCodeAt(0), salt)
  return 45 + (total % 46)
}

function intelligentEvaluate(companyName: string, lead?: PotentialLead): ExtendedLeadEvalResult {
  const capitalScore = lead ? (lead.isListed ? 100 : 62) : deterministicFallbackScore(companyName, 7)
  const revenueScore = lead ? scoreRevenue(lead.revenue) : deterministicFallbackScore(companyName, 17)
  const energyScore = lead
    ? lead.energyUsage === '极高' ? 100 : lead.energyUsage === '高' ? 82 : lead.energyUsage === '中' ? 62 : 42
    : deterministicFallbackScore(companyName, 29)
  const projectScore = lead ? scoreProject(lead) : deterministicFallbackScore(companyName, 41)
  
  const lv = {
    isListed: capitalScore,
    revenueScale: revenueScore,
    energyUsage: energyScore,
    newProjectSize: projectScore,
    newProjectProgress: projectScore,
    total: Math.round(capitalScore * 0.2 + revenueScore * 0.2 + energyScore * 0.3 + projectScore * 0.3)
  }
  
  const pm = {
    contactRole: lead ? Math.min(95, Math.round(lead.aiMatchScore * 0.82 + (lead.isListed ? 12 : 4))) : deterministicFallbackScore(companyName, 53),
    trustLevel: lead ? Math.min(90, Math.round(lead.aiMatchScore * 0.68 + 18)) : deterministicFallbackScore(companyName, 61),
    decisionLevel: lead ? Math.min(95, Math.round(lead.aiMatchScore * 0.75 + (lead.newProjectProgress ? 14 : 6))) : deterministicFallbackScore(companyName, 71),
    total: 0
  }
  pm.total = Math.round(pm.contactRole * 0.4 + pm.trustLevel * 0.3 + pm.decisionLevel * 0.3)
  
  const avg = Math.round((lv.total + pm.total) / 2)
  const grade: LeadGradeExtended = avg >= 85 ? 'S' : avg >= 70 ? 'A' : avg >= 55 ? 'B' : avg >= 40 ? 'C' : 'D'
  
  const strategyMap: Record<LeadGradeExtended, string[]> = {
    S: [
      `机会分析：${companyName}为顶级目标客户，${lead?.isListed ? '上市公司' : '行业龙头'}背景 + ${lead?.energyUsage || '高'}能耗级别，年节能潜力超500万元。光储一体化方案ROI极高，建议作为本季度核心攻坚项目。`,
      `资源利用：立即启动"绿色通道"流程。平台将指派首席技术官陪同拜访，优先调配顶级专家资源。建议通过您的${lead?.region || '本地'}高层人脉直达决策层，跳过中间环节。`,
      `行动推进：第一步（3日内）：平台协助预约CEO/能源副总 → 第二步（1周内）：现场能效诊断+定制方案 → 第三步（2周内）：董事会级技术评审 → 第四步（1月内）：签署框架协议。全程配备专项红包激励（总额2-5万元）。`,
      `话术建议："X总，我们注意到贵公司在${lead?.industry || '行业'}的领先地位。目前行业TOP3企业中已有2家通过我们的方案年节约能源成本超千万。我们愿意为贵公司提供董事会级的能源战略规划服务，由我们CTO亲自主导，您看本周是否方便安排一次高层会议？"`,
    ],
    A: [
      `机会分析：${companyName}为优质目标，${lead?.revenue || '营收规模可观'} + ${lead?.energyUsage || '中高'}能耗，预估年节能潜力200-500万元。${lead?.newProjectSize ? `近期${lead.newProjectSize}项目为切入良机` : '建议从节能改造切入'}。`,
      `资源利用：建议通过行业协会/商学院圈层联系能源管理负责人。平台可提供同行业标杆案例支持。如您有内部关系可直达设备部/基建部，成功率将大幅提升。`,
      `行动推进：第一步（1周内）：获取关键部门联系方式 → 第二步（2周内）：提交初步方案+同行案例 → 第三步（1月内）：申请B类现场拜访红包任务（2000元）→ 第四步（2月内）：平台技术总监线上评审会。`,
      `话术建议："X总您好，我们专注${lead?.industry || '制造业'}综合能源服务，目前${lead?.region || '本地'}已有多家同行企业通过我们方案年节省15-25%电费。我们提供免费的能效诊断服务，不影响生产，您看下周是否方便安排工程师现场勘查？"`,
    ],
    B: [
      `机会分析：${companyName}具备一定潜力，但需进一步验证。${lead?.energyUsage === '中' ? '能耗水平中等，' : ''}建议先通过低成本方式建立信任，再逐步推进深度合作。`,
      `资源利用：优先利用免费资源（行业报告、政策解读）建立初步联系。避免过早投入大量商务成本。如有协会/展会接触机会可优先利用。`,
      `行动推进：第一步：通过AIGC工具生成行业分析报告，以"免费咨询"名义接触 → 第二步：了解企业真实需求和决策流程 → 第三步：评估是否值得申请正式跟进 → 第四步：如确认价值，再投入现场拜访资源。`,
      `话术建议："X经理您好，我们最近在做${lead?.industry || '行业'}能源成本优化的调研，注意到贵公司在${lead?.region || '区域'}的业务。我们整理了一份行业节能趋势报告，里面有同行的成功案例，可以免费分享给您参考，您看是否方便加个微信？"`,
    ],
    C: [
      `机会分析：${companyName}当前价值有限，不建议投入核心资源。可作为长期培育对象，保持低频接触。`,
      `资源利用：仅通过线上方式（朋友圈、公众号）保持品牌曝光，不建议线下拜访。等待企业扩建或政策变化带来的新机会。`,
      `行动推进：第一步：添加企业相关人员微信，定期分享行业动态 → 第二步：关注企业公告，等待扩建/上市等关键节点 → 第三步：如出现重大变化再重新评估 → 暂不申请平台资源。`,
      `话术建议："您好，我是做综合能源服务的，看到贵公司在${lead?.industry || '行业'}发展不错。我们平台有很多行业资讯和政策解读，可以加个微信，后续有合适的机会再深入交流。"`,
    ],
    D: [
      `机会分析：${companyName}不符合当前目标客户画像，建议暂不跟进。`,
      `资源利用：不建议投入任何商务资源。`,
      `行动推进：建议将精力聚焦在A/B级线索上，暂不对此线索采取行动。`,
      `话术建议：暂无推荐话术。`,
    ],
  }
  
  return {
    companyName,
    leadValue: lv,
    partnerMatch: pm,
    overallGrade: grade,
    suggestions: strategyMap[grade],
    grade,
  }
}

export default function LeadEvaluationPage() {
  const leads = useStore((s) => s.leads)
  const setEvalResult = useStore((s) => s.setEvalResult)
  const evalResult = useStore((s) => s.evalResult) as ExtendedLeadEvalResult | null
  const [companyName, setCompanyName] = useState('')
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEvaluate = useCallback(() => {
    const lead = selectedLeadId ? leads.find((l) => l.id === selectedLeadId) : undefined
    const name = lead?.companyName ?? companyName
    if (!name.trim()) { setError('请输入公司名称或从线索中选择'); return }
    setError('')
    setLoading(true)
    setTimeout(() => {
      const result = intelligentEvaluate(name, lead)
      setEvalResult(result)
      setLoading(false)
    }, 2000)
  }, [companyName, selectedLeadId, leads, setEvalResult])

  const handleLeadSelect = (id: string) => {
    setSelectedLeadId(id)
    const lead = leads.find((l) => l.id === id)
    if (lead) setCompanyName(lead.companyName)
  }

  const suggestionIcons = [
    { icon: Target, color: 'text-blue-600', bg: 'bg-blue-500/10', label: '机会分析' },
    { icon: Handshake, color: 'text-emerald-600', bg: 'bg-emerald-500/10', label: '资源利用' },
    { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-500/10', label: '行动推进' },
    { icon: MessageSquare, color: 'text-violet-600', bg: 'bg-violet-500/10', label: '话术建议' },
  ]

  const radarData = evalResult ? [
    { subject: '资本背景', value: evalResult.leadValue.isListed, fullMark: 100 },
    { subject: '营收规模', value: evalResult.leadValue.revenueScale, fullMark: 100 },
    { subject: '能耗水平', value: evalResult.leadValue.energyUsage, fullMark: 100 },
    { subject: '新建项目', value: evalResult.leadValue.newProjectSize, fullMark: 100 },
    { subject: '对接人角色', value: evalResult.partnerMatch.contactRole, fullMark: 100 },
    { subject: '信任度', value: evalResult.partnerMatch.trustLevel, fullMark: 100 },
  ] : []

  const grade = evalResult?.grade ?? evalResult?.overallGrade

  return (
    <div>
      <PageHeader title="线索评级" description="AI 双维度评估线索价值和资源匹配度，输出分级开发策略" />
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-[11px]">从已有线索选择</Label>
              <Select onValueChange={(v) => v && handleLeadSelect(String(v))}>
                <SelectTrigger><SelectValue placeholder="选择一条线索..." /></SelectTrigger>
                <SelectContent>
                  {leads.slice(0, 10).map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.companyName} ({l.industry})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">或手动输入公司名称</Label>
              <Input placeholder="输入公司名称" value={companyName} onChange={(e) => { setCompanyName(e.target.value); setSelectedLeadId(''); setError('') }} />
              {error && <p className="text-[12px] text-destructive mt-1">{error}</p>}
            </div>
            <Button onClick={handleEvaluate} disabled={loading} className="h-10">
              <Brain className="h-4 w-4 mr-2" />{loading ? '评估中...' : 'AI 评估'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <LoadingSkeleton rows={6} type="card" />}

      {!loading && evalResult && grade && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">{evalResult.companyName}</h2>
            <div className={`${gradeColors[grade]} text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5`}>
              {grade === 'S' && <TrendingUp className="size-4" />}
              {grade}级 — {gradeLabels[grade]}
            </div>
            <Badge variant="outline" className="text-xs">
              综合评分 {Math.round((evalResult.leadValue.total + evalResult.partnerMatch.total) / 2)}
            </Badge>
          </div>

          <Card className="rounded-2xl border-border/70 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Brain className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">公司名称机会判断模拟</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    系统已按公司名称、行业关键词、营收规模、用能强度、新建项目进展和合伙人资源匹配度进行前端模拟分析。
                    当前判断为 <span className="font-medium text-foreground">{gradeLabels[grade]}</span>，
                    建议优先采用“{evalResult.suggestions[2]?.replace(/^行动推进：/, '').split('→')[0] ?? '低成本触达'}”作为下一步动作。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <ScoreCard title="线索价值评分" score={evalResult.leadValue.total} items={[
                { label: '资本背景 (20%)', value: evalResult.leadValue.isListed },
                { label: '营收规模 (20%)', value: evalResult.leadValue.revenueScale },
                { label: '能耗水平 (30%)', value: evalResult.leadValue.energyUsage },
                { label: '新建项目 (30%)', value: evalResult.leadValue.newProjectSize },
              ]} />
              <ScoreCard title="资源匹配评分" score={evalResult.partnerMatch.total} items={[
                { label: '对接人角色 (40%)', value: evalResult.partnerMatch.contactRole },
                { label: '信任度评价 (30%)', value: evalResult.partnerMatch.trustLevel },
                { label: '决策度评价 (30%)', value: evalResult.partnerMatch.decisionLevel },
              ]} />
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">双维度雷达图</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={({ x, y, payload, textAnchor }) => (
                        <text x={x} y={y} textAnchor={textAnchor} className="fill-foreground text-[11px]">{payload.value}</text>
                      )}
                    />
                    <Radar 
                      name="评分" 
                      dataKey="value" 
                      stroke={grade ? gradeChartColors[grade] : '#3b82f6'} 
                      fill={grade ? gradeChartColors[grade] : '#3b82f6'} 
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                AI 分级策略输出
                <Badge variant={grade === 'S' ? 'default' : 'outline'} className="text-[10px]">
                  {grade}级专属方案
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {evalResult.suggestions.map((s, i) => {
                const cfg = suggestionIcons[i]
                if (!cfg) return null
                const Icon = cfg.icon
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`size-7 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                        <Icon className={`size-4 ${cfg.color}`} />
                      </div>
                      <p className="text-sm font-semibold">{cfg.label}</p>
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed pl-9">
                      {s.replace(/^[^：:]+[：:]/, '')}
                    </p>
                    {i < evalResult.suggestions.length - 1 && <Separator className="mt-4" />}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function ScoreCard({ title, score, items }: { title: string; score: number; items: { label: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <span className="text-2xl font-bold">{score}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
            <Progress value={item.value} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
