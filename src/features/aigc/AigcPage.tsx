import { useState, useCallback } from 'react'
import { useStore } from '@/stores'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { formatListTime, sortByNewest } from '@/lib/time'
import type { AigcHistory, AigcTemplate } from '@/types'

const typeLabels: Record<AigcHistory['type'], string> = { policy: '政策解读', case: '案例讲解', opportunity: '行业机会' }

function generateStructuredContent(type: AigcHistory['type'], keyword: string, template?: AigcTemplate) {
  const header = `【${typeLabels[type]}：${keyword}】`
  if (template) {
    const sections = template.outputStructure
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
    const prompt = template.promptTemplate.replaceAll('{{keyword}}', keyword)
    return `${header}\n\n生成依据\n${prompt}\n\n${sections.map((section, index) => {
      const body = section.includes('政策')
        ? `围绕${keyword}梳理近期政策窗口、申报口径和客户可感知的收益点。`
        : section.includes('客户') || section.includes('画像')
          ? `优先匹配上市公司、高耗能企业、扩建园区、屋顶资源充足或近期有技改计划的客户。`
          : section.includes('动作') || section.includes('建议')
            ? `先用公开信息确认机会，再找到能源、设备、基建或财务负责人，并同步到CRM按30/60/180天规则推进。`
            : `用城市合伙人可直接复用的话术表达${keyword}的业务价值，突出政策窗口、能源成本和同行案例。`
      return `${index + 1}. ${section}\n${body}`
    }).join('\n\n')}\n\n以上内容由后台启用模板「${template.title}」生成。`
  }
  if (type === 'policy') {
    return `${header}\n\n一、政策要点\n围绕${keyword}，重点关注地方发改、能源主管部门和园区管委会近期发布的申报口径、补贴窗口和并网要求。\n\n二、客户关联\n优先匹配高耗能企业、扩建园区、屋顶资源充足或已披露节能改造计划的客户。\n\n三、获客话题\n用“政策窗口期 + 能源成本优化 + 零投资/轻资产方案”作为开场，避免直接推销设备。\n\n四、行动建议\n1. 收集当地政策链接和申报截止时间\n2. 准备同区域案例和节电测算\n3. 将线索同步到CRM并在7天内完成首次触达\n\n以上内容由原型规则生成，正式版应接入政策库与行业知识库。`
  }
  if (type === 'case') {
    return `${header}\n\n一、案例背景\n选择与${keyword}相近的行业客户，突出厂区面积、用电结构、峰谷价差和现有设备痛点。\n\n二、方案切入\n以能效诊断作为低门槛入口，再根据屋顶、负荷曲线和生产节奏推荐光伏、储能或节能改造组合。\n\n三、可复用素材\n客户拜访时优先展示投资回收期、年节省电费、施工不影响生产和运维责任边界。\n\n四、发布文案\n“我们最近复盘了一个${keyword}相关项目，客户最关心的不是设备参数，而是节能收益能不能被验证、施工会不会影响生产。”`
  }
  return `${header}\n\n一、行业机会\n${keyword}相关企业通常存在用能成本、政策申报、设备更新或园区扩建机会，适合城市合伙人做持续触达。\n\n二、优先客户画像\n上市公司、年营收较高、能耗等级高、近期有新建/招标/技改信息的客户优先级最高。\n\n三、线索动作\n1. 用公开信息确认项目窗口\n2. 找到能源、设备、基建或财务负责人\n3. 输出一页式机会判断并申请跟进\n\n四、朋友圈角度\n“能源成本正在成为企业经营的硬指标，真正有价值的机会往往藏在扩建、技改和政策申报窗口里。”`
}

export default function AigcPage() {
  const aigcHistory = useStore((s) => s.aigcHistory)
  const templates = useStore((s) => s.aigcTemplates)
  const addHistory = useStore((s) => s.addAigcHistory)
  const [contentType, setContentType] = useState<AigcHistory['type']>('policy')
  const [keyword, setKeyword] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = useCallback(() => {
    if (!keyword.trim()) { toast.error('请输入关键词'); return }
    setLoading(true)
    setTimeout(() => {
      const activeTemplate = templates.find((item) => item.type === contentType && item.status === 'active')
      const mockOutput = generateStructuredContent(contentType, keyword, activeTemplate)
      setOutput(mockOutput)
      addHistory({
        id: `aigc-${Date.now()}`,
        type: contentType,
        keyword,
        output: mockOutput,
        createdAt: new Date().toISOString().split('T')[0],
      })
      setLoading(false)
    }, 2000)
  }, [keyword, contentType, addHistory, templates])

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    toast.success('已复制到剪贴板')
  }
  const sortedHistory = sortByNewest(aigcHistory, (item) => item.createdAt)

  return (
    <div>
      <PageHeader title="AIGC 内容生成" description="快速输出政策解读、案例讲解、行业机会分析" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label>内容类型</Label>
                <Select defaultValue="policy" onValueChange={(v) => v && setContentType(v as AigcHistory['type'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>关键词/主题</Label>
                <Input placeholder="例如：碳交易政策" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
              </div>
              <Button onClick={handleGenerate} disabled={loading} className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />{loading ? '生成中...' : '生成内容'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">历史记录</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {sortedHistory.slice(0, 5).map((h) => (
                <div key={h.id} className="rounded-md border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate flex-1">{h.keyword}</span>
                    <Badge variant="outline" className="shrink-0">{typeLabels[h.type]}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatListTime(h.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">生成结果</CardTitle>
            {output && <Button variant="ghost" size="sm" onClick={handleCopy}><Copy className="h-3.5 w-3.5 mr-1" />复制</Button>}
          </CardHeader>
          <CardContent>
            {output ? (
              <div className="whitespace-pre-line text-sm leading-relaxed">{output}</div>
            ) : (
              <div className="text-center text-muted-foreground py-12">选择内容类型和关键词，点击生成</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
