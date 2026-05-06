import { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SubsectionTab {
  value: string
  label: string
  count?: number
}

interface SubsectionTabsProps {
  tabs: SubsectionTab[]
  active: string
  onChange: (value: string) => void
  className?: string
}

export function SubsectionTabs({ tabs, active, onChange, className }: SubsectionTabsProps) {
  const navRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [lineStyle, setLineStyle] = useState({ width: 20, left: 0 })

  useEffect(() => {
    const activeIdx = tabs.findIndex((t) => t.value === active)
    const btn = btnRefs.current[activeIdx]
    const nav = navRef.current
    if (!btn || !nav) return

    const lineWidth = 20
    setLineStyle({
      width: lineWidth,
      left: btn.offsetLeft + (btn.offsetWidth - lineWidth) / 2,
    })

    const navScrollLeft = nav.scrollLeft
    const navWidth = nav.clientWidth
    const prevBtn = btnRefs.current[activeIdx - 1]
    const nextBtn = btnRefs.current[activeIdx + 1]

    if (prevBtn && prevBtn.offsetLeft < navScrollLeft) {
      nav.scrollTo({ left: prevBtn.offsetLeft, behavior: 'smooth' })
    } else if (nextBtn && nextBtn.offsetLeft + nextBtn.offsetWidth > navScrollLeft + navWidth) {
      nav.scrollTo({ left: nextBtn.offsetLeft + nextBtn.offsetWidth - navWidth, behavior: 'smooth' })
    }
  }, [active, tabs])

  return (
    <div
      ref={navRef}
      className={cn(
        'relative flex border-b border-border/50',
        'overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {tabs.map((tab, idx) => {
        const isActive = active === tab.value
        return (
          <button
            key={tab.value}
            ref={(el) => { btnRefs.current[idx] = el }}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative shrink-0 px-4 pb-2.5 pt-2 text-[13px] font-medium transition-colors duration-200',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80',
            )}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  'rounded-full px-1.5 py-px text-[10px] font-semibold leading-tight',
                  isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                )}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
      <span
        className="absolute bottom-0 h-[2.5px] rounded-full bg-primary"
        style={{
          width: lineStyle.width,
          left: lineStyle.left,
          transition: 'left 300ms ease, width 300ms ease',
        }}
      />
    </div>
  )
}
