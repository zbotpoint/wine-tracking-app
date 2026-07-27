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

// "7.7🍇" — a white score with a violet grape in place of "/10".
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
        'inline-flex items-center gap-0.5 font-semibold text-foreground tabular-nums',
        className,
      )}
    >
      {value}
      <Grape className="size-[1.1em] shrink-0 text-[#8E4585]" aria-hidden />
    </span>
  )
}

// Tasting descriptors, in the violet of The Review section they belong to.
export function FlavourBadge({ name }: { name: string }) {
  return (
    <span className="rounded-md border border-[#8E4585]/50 bg-[#8E4585]/20 px-2.5 py-1 text-xs text-foreground">
      {name}
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
      {names && <span>{names}</span>}
      {colour && <ColourGlass colour={colour} withLabel />}
    </span>
  )
}
