import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { FilterX, Grape, NotebookPen, Search, Wine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ColourGlass, ColourVarietalLine, FlavourBadge, GrapeScore } from '@/components/wine-bits'
import { useUserId } from '@/lib/auth'
import { formatRelativeDate } from '@/lib/dates'
import { COLOURS, countryFlag, formatCountry, formatWineTitle } from '@/lib/labels'
import { signedUrlsQuery } from '@/lib/photos'
import { countriesQuery, profilesQuery, regionsQuery, varietalsQuery } from '@/lib/queries/lookups'
import { tastingsQuery, type TastingWithWine, type WineWithRefs } from '@/lib/queries/tastings'
import {
  DEFAULT_FILTERS,
  filtersToParams,
  parseFilters,
  type BrowseFilters,
} from '@/lib/schemas/filters'

const ANY = 'any'

function wineMatches(wine: WineWithRefs, filters: BrowseFilters, q: string) {
  if (filters.colour && wine.colour !== filters.colour) return false
  if (filters.country && wine.country_code !== filters.country) return false
  if (filters.region && wine.region_id !== filters.region) return false
  if (filters.varietal && !wine.wine_varietals.some((wv) => wv.varietal.id === filters.varietal)) {
    return false
  }
  if (q && !`${wine.name} ${wine.producer ?? ''}`.toLowerCase().includes(q)) return false
  return true
}

export function BrowsePage() {
  const userId = useUserId()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  const { data: tastings, isPending } = useQuery(tastingsQuery)
  const { data: profiles = [] } = useQuery(profilesQuery)
  const { data: countries = [] } = useQuery(countriesQuery)
  const { data: regions = [] } = useQuery(regionsQuery)
  const { data: varietals = [] } = useQuery(varietalsQuery)

  function update(partial: Partial<BrowseFilters>) {
    setSearchParams(filtersToParams({ ...filters, ...partial }), { replace: true })
  }

  const ownerId = filters.owner === 'me' ? userId : filters.owner === 'all' ? null : filters.owner
  const q = filters.q.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!tastings) return []
    return tastings.filter((t) => {
      if (ownerId && t.user_id !== ownerId) return false
      if (filters.minRating && (t.rating == null || t.rating < filters.minRating)) return false
      return wineMatches(t.wine, filters, q)
    })
  }, [tastings, filters, ownerId, q])

  const photoPaths = useMemo(
    () => [...new Set(filtered.map((t) => t.photo_path).filter((p): p is string => p != null))],
    [filtered],
  )
  const { data: photoUrls = {} } = useQuery(signedUrlsQuery(photoPaths))

  const hasActiveFilters =
    filtersToParams({ ...filters, view: DEFAULT_FILTERS.view }).size > 0

  const regionOptions = filters.country
    ? regions.filter((r) => r.country_code === filters.country)
    : regions

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Search wines…"
            className="pl-8"
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() =>
              setSearchParams(filtersToParams({ ...DEFAULT_FILTERS, view: filters.view }), {
                replace: true,
              })
            }
          >
            <FilterX className="size-4" />
            Clear
          </Button>
        )}
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          className="ml-auto shrink-0"
          value={filters.view}
          onValueChange={(view) => {
            if (view) update({ view: view as BrowseFilters['view'] })
          }}
        >
          <ToggleGroupItem value="log" className="px-3">
            <NotebookPen className="size-4" />
            Log
          </ToggleGroupItem>
          <ToggleGroupItem value="wines" className="px-3">
            <Wine className="size-4" />
            Wines
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Select value={filters.owner} onValueChange={(owner) => update({ owner })}>
          <SelectTrigger size="sm" className="shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="me">My wines</SelectItem>
            <SelectItem value="all">Everyone</SelectItem>
            {profiles
              .filter((p) => p.id !== userId)
              .map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.display_name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.colour ?? ANY}
          onValueChange={(colour) =>
            update({ colour: colour === ANY ? null : (colour as BrowseFilters['colour']) })
          }
        >
          <SelectTrigger size="sm" className="shrink-0">
            <SelectValue placeholder="Colour" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any colour</SelectItem>
            {COLOURS.map((colour) => (
              <SelectItem key={colour} value={colour}>
                <ColourGlass colour={colour} withLabel />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.country ?? ANY}
          onValueChange={(country) =>
            update({ country: country === ANY ? null : country, region: null })
          }
        >
          <SelectTrigger size="sm" className="shrink-0">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any country</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {countryFlag(country.code)} {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.region ?? ANY}
          onValueChange={(region) => update({ region: region === ANY ? null : region })}
        >
          <SelectTrigger size="sm" className="shrink-0">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any region</SelectItem>
            {regionOptions.map((region) => (
              <SelectItem key={region.id} value={region.id}>
                {region.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.varietal ?? ANY}
          onValueChange={(varietal) => update({ varietal: varietal === ANY ? null : varietal })}
        >
          <SelectTrigger size="sm" className="shrink-0">
            <SelectValue placeholder="Varietal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any varietal</SelectItem>
            {varietals.map((varietal) => (
              <SelectItem key={varietal.id} value={varietal.id}>
                {varietal.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.minRating != null ? String(filters.minRating) : ANY}
          onValueChange={(minRating) =>
            update({ minRating: minRating === ANY ? null : Number(minRating) })
          }
        >
          <SelectTrigger size="sm" className="shrink-0">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any rating</SelectItem>
            {[9, 8, 7, 6, 5].map((rating) => (
              <SelectItem key={rating} value={String(rating)}>
                <span className="inline-flex items-center gap-1">
                  {rating}+ <Grape className="size-3.5 text-[#8E4585]" />
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card py-16 text-center">
          <p className="text-muted-foreground">
            {tastings?.length === 0
              ? 'No wines logged yet. Log your first one!'
              : 'Nothing matches these filters.'}
          </p>
          {tastings?.length === 0 && (
            <Button asChild className="mt-4">
              <Link to="/log">Log a wine</Link>
            </Button>
          )}
        </div>
      ) : filters.view === 'log' ? (
        <TastingFeed tastings={filtered} photoUrls={photoUrls} />
      ) : (
        <WineGrid tastings={filtered} />
      )}
    </div>
  )
}

// Producer and geography share one interpunct-joined line unless that line
// would truncate, in which case the geography drops to its own line (and the
// interpunct goes away). Measured against an invisible single-line copy.
function OriginLine({ wine }: { wine: WineWithRefs }) {
  const geo = [wine.subregion?.name, wine.region?.name, formatCountry(wine.country)]
    .filter(Boolean)
    .join(', ')
  const producer = wine.producer
  const single = [producer, geo].filter(Boolean).join(' · ')

  const containerRef = useRef<HTMLParagraphElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [split, setSplit] = useState(false)

  useLayoutEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return
    const update = () => setSplit(measure.scrollWidth > container.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [single])

  if (!single) return null
  return (
    <p ref={containerRef} className="relative text-sm text-muted-foreground">
      <span ref={measureRef} aria-hidden className="invisible absolute whitespace-nowrap">
        {single}
      </span>
      {split && producer && geo ? (
        <>
          <span className="block truncate">{producer}</span>
          <span className="block truncate">{geo}</span>
        </>
      ) : (
        <span className="block truncate">{single}</span>
      )}
    </p>
  )
}

function TastingFeed({
  tastings,
  photoUrls,
}: {
  tastings: TastingWithWine[]
  photoUrls: Record<string, string>
}) {
  return (
    <ul className="space-y-3">
      {tastings.map((t) => {
        const photoUrl = t.photo_path ? photoUrls[t.photo_path] : undefined
        return (
          <li key={t.id}>
            <Link
              to={`/wines/${t.wine_id}`}
              className="block overflow-hidden rounded-lg border bg-card transition-colors hover:bg-accent/50"
            >
              {photoUrl ? (
                <div className="relative">
                  <img src={photoUrl} alt="" className="h-64 w-full object-cover" />
                  <div className="absolute inset-x-0 top-0 flex items-baseline gap-2 bg-gradient-to-b from-black/60 to-transparent px-3 pt-2 pb-8">
                    <span className="text-sm font-medium text-white">
                      {t.profile.display_name}
                    </span>
                    <span className="text-xs text-white/70">
                      {formatRelativeDate(t.consumed_on)}
                    </span>
                  </div>
                </div>
              ) : null}
              <div className="p-4 pb-6">
                {!photoUrl && (
                  <p className="mb-3 flex items-baseline gap-2 text-sm font-medium text-muted-foreground">
                    {t.profile.display_name}
                    <span className="text-xs font-normal">
                      {formatRelativeDate(t.consumed_on)}
                    </span>
                  </p>
                )}
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-foreground">
                    {formatWineTitle(t.wine)}
                  </p>
                  <OriginLine wine={t.wine} />
                  <ColourVarietalLine
                    colour={t.wine.colour}
                    varietals={t.wine.wine_varietals}
                    className="flex text-sm text-muted-foreground"
                  />
                </div>
                {t.notes && (
                  <p className="mt-8 line-clamp-3 text-sm whitespace-pre-wrap text-foreground">
                    {t.notes}
                  </p>
                )}
                {t.rating != null && (
                  <p
                    className="mt-8 flex items-center gap-3"
                    aria-label={`Rated ${t.rating} out of 10`}
                  >
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 10 }, (_, i) => (
                        <Grape
                          key={i}
                          className={
                            i < t.rating!
                              ? 'size-6 text-[#8E4585]'
                              : 'size-6 text-foreground opacity-40'
                          }
                          aria-hidden
                        />
                      ))}
                    </span>
                    <span className="text-xl text-foreground">{t.rating}</span>
                  </p>
                )}
                {t.tasting_flavours.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.tasting_flavours.map((tf) => (
                      <FlavourBadge key={tf.flavour.id} name={tf.flavour.name} />
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function WineGrid({ tastings }: { tastings: TastingWithWine[] }) {
  // Group the filtered tastings by wine; a wine shows if any tasting matched.
  const wines = useMemo(() => {
    const byWine = new Map<string, { wine: WineWithRefs; tastings: TastingWithWine[] }>()
    for (const t of tastings) {
      const entry = byWine.get(t.wine_id) ?? { wine: t.wine, tastings: [] }
      entry.tastings.push(t)
      byWine.set(t.wine_id, entry)
    }
    return [...byWine.values()].sort((a, b) => a.wine.name.localeCompare(b.wine.name))
  }, [tastings])

  return (
    <ul className="space-y-2">
      {wines.map(({ wine, tastings: wineTastings }) => {
        const ratings = wineTastings
          .map((t) => t.rating)
          .filter((r): r is number => r != null)
        const avg =
          ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null
        const latest = wineTastings[0]
        const varietals = wine.wine_varietals.map((wv) => wv.varietal.name).join(', ')
        return (
          <li key={wine.id}>
            <Link
              to={`/wines/${wine.id}`}
              className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
            >
              {wine.colour ? (
                <ColourGlass colour={wine.colour} className="size-10" />
              ) : (
                <Wine className="size-10 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate font-medium">{formatWineTitle(wine)}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {[
                    wine.producer,
                    [wine.subregion?.name, wine.region?.name, formatCountry(wine.country)]
                      .filter(Boolean)
                      .join(', '),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <p className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
                  {varietals && <span className="truncate">{varietals}</span>}
                  {varietals && <span>·</span>}
                  <span>
                    {wineTastings.length === 1
                      ? '1 tasting'
                      : `${wineTastings.length} tastings`}
                  </span>
                  <span>· last {formatRelativeDate(latest.consumed_on)}</span>
                </p>
              </div>
              {avg != null && <GrapeScore value={avg.toFixed(1)} className="shrink-0 text-lg" />}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
