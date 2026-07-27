import { Wine } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { COLOUR_TEXT_CLASSES, COLOUR_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { Enums } from '@/types/database.types'

export function ColourGlass({
  colour,
  withLabel = false,
  className,
}: {
  colour: Enums<'wine_colour'>
  withLabel?: boolean
  className?: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Wine
        className={cn('size-3.5 shrink-0', COLOUR_TEXT_CLASSES[colour], className)}
        aria-hidden
      />
      {withLabel ? (
        <span>{COLOUR_LABELS[colour]}</span>
      ) : (
        <span className="sr-only">{COLOUR_LABELS[colour]}</span>
      )}
    </span>
  )
}

export function RatingBadge({ rating, className }: { rating: number; className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn('shrink-0 font-semibold tabular-nums', className)}
      aria-label={`Rated ${rating} out of 10`}
    >
      {rating}/10
    </Badge>
  )
}

// "● Red Malbec" — colour and varietals as one inline phrase, used everywhere
// a wine's colour is shown.
export function ColourVarietalLine({
  colour,
  varietals,
  className,
}: {
  colour: Enums<'wine_colour'> | null
  varietals: { varietal: { id: string; name: string } }[]
  className?: string
}) {
  const names = varietals.map((wv) => wv.varietal.name).join(', ')
  if (!colour && !names) return null
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1.5', className)}>
      {colour && <ColourGlass colour={colour} withLabel />}
      {names && <span>{names}</span>}
    </span>
  )
}
