import { z } from 'zod'

export const stepBasicSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的11位手机号'),
  region: z.string().min(1, '请选择区域'),
  workType: z.string().min(1, '请选择工作类型'),
  inviteCode: z.string().trim().optional(),
})

export const stepIndustrySchema = z.object({
  market: z.string().min(1, '请选择从业市场'),
  industry: z.string().min(1, '请选择所属行业'),
  idCard: z.string().regex(/^\d{17}[\dXx]$/, '请输入正确的18位身份证号'),
})

export const stepTagsSchema = z.object({
  resources: z.array(z.string()).min(1, '请至少选择一个资源标签'),
})

export type StepBasicData = z.infer<typeof stepBasicSchema>
export type StepIndustryData = z.infer<typeof stepIndustrySchema>
export type StepTagsData = z.infer<typeof stepTagsSchema>
