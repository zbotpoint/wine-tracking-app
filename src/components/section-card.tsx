import type { ComponentType, ReactNode } from 'react'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Each form section gets its own accent from the approved palette:
// wine = bordeaux, occasion = gold, review = violet.
const ACCENTS = {
  wine: { border: 'border-l-primary', icon: 'text-chart-1' },
  occasion: {
    border: 'border-l-[#F8DE7E]',
    icon: 'text-[#F8DE7E]',
  },
  review: {
    border: 'border-l-[#8E4585]',
    icon: 'text-[#8E4585]',
  },
} as const

export type SectionAccent = keyof typeof ACCENTS

export function SectionCard({
  title,
  accent,
  icon: Icon,
  action,
  collapsed = false,
  children,
}: {
  title: string
  accent: SectionAccent
  icon: ComponentType<{ className?: string }>
  action?: ReactNode
  collapsed?: boolean
  children: ReactNode
}) {
  // overflow-visible: the type-ahead suggestion lists inside must be able to
  // extend past the card's edge (Card ships with overflow-hidden).
  return (
    <Card
      className={cn(
        'overflow-visible border-l-4',
        ACCENTS[accent].border,
        collapsed && 'opacity-60',
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={cn('size-4', ACCENTS[accent].icon)} />
          {title}
        </CardTitle>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      {!collapsed && <CardContent>{children}</CardContent>}
    </Card>
  )
}
