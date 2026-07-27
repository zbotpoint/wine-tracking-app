import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { FilterX, Grape, Repeat, Wine } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { ColourGlass, ColourVarietalLine, GrapeScore, RatingBadge } from '@/components/wine-bits'
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

  // ×N badges count every tasting of the wine, not just the filtered ones.
  const tastingCountByWine = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of tastings ?? []) counts.set(t.wine_id, (counts.get(t.wine_id) ?? 0) + 1)
    return counts
  }, [tastings])

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
        <Input
          value={filters.q}
          onChange={(e) => update({ q: e.target.value })}
          placeholder="Search wines…"
          className="w-full max-w-xs"
        />
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          className="shrink-0"
          value={filters.view}
          onValueChange={(view) => {
            if (view) update({ view: view as BrowseFilters['view'] })
          }}
        >
          <ToggleGroupItem value="log" className="px-3">
            Log
          </ToggleGroupItem>
          <ToggleGroupItem value="wines" className="px-3">
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
                  {rating}+ <Grape className="size-3.5" />
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => setSearchParams(filtersToParams({ ...DEFAULT_FILTERS, view: filters.view }), { replace: true })}
          >
            <FilterX className="size-4" />
            Clear
          </Button>
        )}
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
        <TastingFeed
          tastings={filtered}
          photoUrls={photoUrls}
          tastingCountByWine={tastingCountByWine}
          showOwner={filters.owner !== 'me'}
        />
      ) : (
        <WineGrid tastings={filtered} photoUrls={photoUrls} />
      )}
    </div>
  )
}

function TastingFeed({
  tastings,
  photoUrls,
  tastingCountByWine,
  showOwner,
}: {
  tastings: TastingWithWine[]
  photoUrls: Record<string, string>
  tastingCountByWine: Map<string, number>
  showOwner: boolean
}) {
  return (
    <ul className="space-y-3">
      {tastings.map((t) => {
        const repeatCount = tastingCountByWine.get(t.wine_id) ?? 1
        const photoUrl = t.photo_path ? photoUrls[t.photo_path] : undefined
        return (
          <li key={t.id}>
            <Link
              to={`/wines/${t.wine_id}`}
              className="block overflow-hidden rounded-lg border bg-card transition-colors hover:bg-accent/50"
            >
              {photoUrl && (
                <img src={photoUrl} alt="" className="h-44 w-full object-cover" />
              )}
              <div className="space-y-1 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{formatWineTitle(t.wine)}</p>
                  {t.rating != null && <RatingBadge rating={t.rating} />}
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {[t.wine.producer, t.wine.subregion?.name, t.wine.region?.name, formatCountry(t.wine.country)]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <ColourVarietalLine
                  colour={t.wine.colour}
                  varietals={t.wine.wine_varietals}
                  className="text-sm"
                />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-xs text-muted-foreground">
                  <span>{formatRelativeDate(t.consumed_on)}</span>
                  {showOwner && <span>{t.profile.display_name}</span>}
                  {repeatCount > 1 && (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Repeat className="size-3" />×{repeatCount}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function WineGrid({
  tastings,
  photoUrls,
}: {
  tastings: TastingWithWine[]
  photoUrls: Record<string, string>
}) {
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
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {wines.map(({ wine, tastings: wineTastings }) => {
        const ratings = wineTastings
          .map((t) => t.rating)
          .filter((r): r is number => r != null)
        const avg =
          ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null
        const latest = wineTastings[0]
        const photoPath = wineTastings.find((t) => t.photo_path)?.photo_path
        return (
          <li key={wine.id}>
            <Link
              to={`/wines/${wine.id}`}
              className="flex gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
            >
              {photoPath && photoUrls[photoPath] ? (
                <img
                  src={photoUrls[photoPath]}
                  alt=""
                  className="size-20 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="flex size-20 shrink-0 items-center justify-center rounded-md bg-muted">
                  {wine.colour ? (
                    <ColourGlass colour={wine.colour} />
                  ) : (
                    <Wine className="size-4 text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">{formatWineTitle(wine)}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {[wine.producer, wine.subregion?.name, wine.region?.name, formatCountry(wine.country)]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  {avg == null ? (
                    'Unrated'
                  ) : wineTastings.length === 1 ? (
                    <GrapeScore value={avg.toFixed(0)} />
                  ) : (
                    <>
                      {wineTastings.length} tastings · avg{' '}
                      <GrapeScore value={avg.toFixed(1)} />
                    </>
                  )}
                  <span>· last {latest.consumed_on}</span>
                </p>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
