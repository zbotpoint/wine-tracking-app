import { Grape, Wine } from 'lucide-react'
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

// "7.7🍇" — a violet score with a grape in place of "/10".
export function GrapeScore({
  value,
  className,
}: {
  value: string | number
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-semibold text-[#8E4585] tabular-nums',
        className,
      )}
    >
      {value}
      <Grape className="size-[1.1em] shrink-0" aria-hidden />
    </span>
  )
}

export function RatingBadge({ rating, className }: { rating: number; className?: string }) {
  return (
    <span aria-label={`Rated ${rating} out of 10`} className={cn('shrink-0', className)}>
      <GrapeScore value={rating} className="text-xl" />
    </span>
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
