import type { LeadGrade, ProjectPhase16, RegionGroup, ResourceSurvey } from '@/types'
import { projectPhase16Labels } from '@/types'

export const regionGroups: Record<RegionGroup, string[]> = {
  华东: ['上海', '杭州', '南京', '青岛', '芜湖', '济宁', '烟台', '滨州'],
  华南: ['广州', '深圳', '珠海'],
  华北: ['北京', '大连', '保定'],
  华中西: ['成都', '武汉', '长沙'],
}

export const projectPhase16Order = Object.keys(projectPhase16Labels) as ProjectPhase16[]

export function resolveRegionGroup(region?: string): RegionGroup {
  const found = (Object.entries(regionGroups) as Array<[RegionGroup, string[]]>)
    .find(([, cities]) => cities.includes(region ?? ''))
  return found?.[0] ?? '华中西'
}

export function isRegionVisible(adminRegionGroup: RegionGroup | undefined, region: string) {
  if (!adminRegionGroup) return true
  return resolveRegionGroup(region) === adminRegionGroup
}

export function inferLeadGrade(score: number): LeadGrade {
  if (score >= 92) return 'S'
  if (score >= 85) return 'A'
  if (score >= 76) return 'B'
  if (score >= 68) return 'C'
  return 'D'
}

export function extractResourceKeywords(input: {
  region?: string
  industry?: string
  socialRole?: string
  resourceTags?: string[]
  resourceSurvey?: ResourceSurvey
}) {
  const raw = [
    input.region,
    input.industry,
    input.socialRole,
    ...(input.resourceTags ?? []),
    ...(input.resourceSurvey?.resourceTypes ?? []),
    input.resourceSurvey?.keyPositions,
    input.resourceSurvey?.publicRoles,
    input.resourceSurvey?.associationCircles,
  ]

  return Array.from(new Set(
    raw
      .flatMap((item) => (item ?? '').split(/[、,，\s/]+/))
      .map((item) => item.trim())
      .filter(Boolean),
  )).slice(0, 12)
}

export function buildPromptFromKeywords(keywords: string[]) {
  return keywords.length
    ? `优先匹配${keywords.join('、')}相关的综合能源项目线索，关注可备案、可跟进、可形成排他保护的目标客户。`
    : '优先匹配城市、行业和个人资源相关的综合能源项目线索。'
}

export function addDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}
