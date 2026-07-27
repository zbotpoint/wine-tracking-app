import type { TastingWithWine } from '@/lib/queries/tastings'
import { COLOUR_LABELS } from '@/lib/labels'
import { formatWineTitle } from '@/lib/labels'

// A single 10/10 shouldn't crown a region; require a few tastings before a
// group can win "top rated". Falls back to the best group below the
// threshold, flagged so the UI can caveat it.
export const MIN_ENTRIES_FOR_TOP = 3

// Unrated tastings are excluded from every rating-based stat.
function rated(tastings: TastingWithWine[]): (TastingWithWine & { rating: number })[] {
  return tastings.filter((t): t is TastingWithWine & { rating: number } => t.rating != null)
}

export function ratingHistogram(tastings: TastingWithWine[]): number[] {
  const counts = new Array<number>(10).fill(0)
  for (const t of rated(tastings)) {
    if (t.rating >= 1 && t.rating <= 10) counts[t.rating - 1] += 1
  }
  return counts
}

export type TopGroup = {
  label: string
  avg: number
  count: number
  belowThreshold: boolean
}

function topGroup(entries: { label: string; rating: number }[]): TopGroup | null {
  const groups = new Map<string, { label: string; sum: number; count: number }>()
  for (const { label, rating } of entries) {
    const key = label.toLowerCase()
    const group = groups.get(key) ?? { label, sum: 0, count: 0 }
    group.sum += rating
    group.count += 1
    groups.set(key, group)
  }
  const ranked = [...groups.values()]
    .map((g) => ({ label: g.label, avg: g.sum / g.count, count: g.count }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
  if (ranked.length === 0) return null

  const qualified = ranked.filter((g) => g.count >= MIN_ENTRIES_FOR_TOP)
  if (qualified.length > 0) return { ...qualified[0], belowThreshold: false }
  return { ...ranked[0], belowThreshold: true }
}

export function topCountry(tastings: TastingWithWine[]): TopGroup | null {
  return topGroup(
    rated(tastings)
      .filter((t) => t.wine.country)
      .map((t) => ({ label: t.wine.country!.name, rating: t.rating })),
  )
}

export function topRegion(tastings: TastingWithWine[]): TopGroup | null {
  return topGroup(
    rated(tastings)
      .filter((t) => t.wine.region)
      .map((t) => ({ label: t.wine.region!.name, rating: t.rating })),
  )
}

// A blend's rating counts once per varietal.
export function topVarietal(tastings: TastingWithWine[]): TopGroup | null {
  return topGroup(
    rated(tastings).flatMap((t) =>
      t.wine.wine_varietals.map((wv) => ({ label: wv.varietal.name, rating: t.rating })),
    ),
  )
}

export type StatsSummary = {
  total: number
  distinctWines: number
  avgRating: number | null
  favouriteColour: string | null
  mostRelogged: { label: string; count: number } | null
}

export function summarize(tastings: TastingWithWine[]): StatsSummary {
  const wineIds = new Set(tastings.map((t) => t.wine_id))
  const ratedTastings = rated(tastings)

  const colourCounts = new Map<string, number>()
  for (const t of tastings) {
    if (!t.wine.colour) continue
    const label = COLOUR_LABELS[t.wine.colour]
    colourCounts.set(label, (colourCounts.get(label) ?? 0) + 1)
  }
  const favouriteColour =
    [...colourCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const wineCounts = new Map<string, { label: string; count: number }>()
  for (const t of tastings) {
    const existing = wineCounts.get(t.wine_id) ?? { label: formatWineTitle(t.wine), count: 0 }
    existing.count += 1
    wineCounts.set(t.wine_id, existing)
  }
  const mostRelogged =
    [...wineCounts.values()].filter((w) => w.count > 1).sort((a, b) => b.count - a.count)[0] ??
    null

  return {
    total: tastings.length,
    distinctWines: wineIds.size,
    avgRating:
      ratedTastings.length > 0
        ? ratedTastings.reduce((sum, t) => sum + t.rating, 0) / ratedTastings.length
        : null,
    favouriteColour,
    mostRelogged,
  }
}
