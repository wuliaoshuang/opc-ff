import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskName: string
  onSubmit: (evidence: { images: string[]; description: string }) => void
}

export function UploadEvidenceDialog({ open, onOpenChange, taskName, onSubmit }: Props) {
  const [images, setImages] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    if (images.length + files.length > 5) {
      toast.error('最多上传 5 张图片')
      return
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('仅支持图片格式')
        return
      }
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages((prev) => [...prev, ev.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = () => {
    if (images.length === 0) {
      toast.error('请至少上传一张现场照片')
      return
    }
    if (!description.trim()) {
      toast.error('请填写执行说明')
      return
    }

    setUploading(true)
    setTimeout(() => {
      onSubmit({ images, description: description.trim() })
      setUploading(false)
      setImages([])
      setDescription('')
      onOpenChange(false)
      toast.success('凭证已提交，等待审核')
    }, 800)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>上传任务凭证</DialogTitle>
          <p className="text-[13px] text-muted-foreground mt-1">任务：{taskName}</p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[13px]">现场照片 *（最多 5 张）</Label>
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg border overflow-hidden group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 size-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="size-3.5 text-white" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="size-5 text-muted-foreground mb-1" />
                  <span className="text-[11px] text-muted-foreground">上传图片</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                </label>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">请上传现场拜访照片、会议记录或其他相关凭证</p>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">执行说明 *</Label>
            <Textarea
              placeholder="请描述任务执行情况，如：拜访时间、对接人、沟通内容要点等"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-none text-[13px]"
            />
          </div>

          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
            <div className="flex gap-2">
              <ImageIcon className="size-4 text-blue-600 shrink-0 mt-0.5 dark:text-blue-400" />
              <div className="text-[11px] text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">审核要点</p>
                <ul className="space-y-0.5 text-blue-600 dark:text-blue-400">
                  <li>• 照片需清晰可辨，包含现场环境或人员</li>
                  <li>• 说明需包含关键信息（时间、地点、对接人）</li>
                  <li>• 如有会议纪要或签到记录请一并上传</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading && <Loader2 className="size-4 animate-spin mr-1.5" />}
            提交审核
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
