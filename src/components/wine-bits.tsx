import { Badge } from '@/components/ui/badge'
import { COLOUR_DOT_CLASSES, COLOUR_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { Enums } from '@/types/database.types'

export function ColourDot({
  colour,
  withLabel = false,
}: {
  colour: Enums<'wine_colour'>
  withLabel?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn('size-2.5 shrink-0 rounded-full', COLOUR_DOT_CLASSES[colour])}
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
      {colour && <ColourDot colour={colour} withLabel />}
      {names && <span>{names}</span>}
    </span>
  )
}
