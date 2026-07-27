import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserId } from '@/lib/auth'
import { countryFlag } from '@/lib/labels'
import { countriesQuery, profilesQuery } from '@/lib/queries/lookups'
import { tastingsQuery } from '@/lib/queries/tastings'
import {
  ratingHistogram,
  summarize,
  topCountry,
  topRegion,
  topVarietal,
  type TopGroup,
} from '@/lib/stats'

export function StatsPage() {
  const userId = useUserId()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: profiles = [] } = useQuery(profilesQuery)
  const { data: countries = [] } = useQuery(countriesQuery)
  const { data: allTastings, isPending } = useQuery(tastingsQuery)

  const selectedUser = searchParams.get('user') ?? userId

  const tastings = useMemo(
    () => (allTastings ?? []).filter((t) => t.user_id === selectedUser),
    [allTastings, selectedUser],
  )

  const histogram = useMemo(() => ratingHistogram(tastings), [tastings])
  const summary = useMemo(() => summarize(tastings), [tastings])
  const bestRegion = useMemo(() => topRegion(tastings), [tastings])
  // Stats stay presentation-free; the flag is prepended at render time.
  const bestCountry = useMemo(() => {
    const group = topCountry(tastings)
    if (!group) return null
    const country = countries.find((c) => c.name.toLowerCase() === group.label.toLowerCase())
    return country ? { ...group, label: `${countryFlag(country.code)} ${group.label}` } : group
  }, [tastings, countries])
  const bestVarietal = useMemo(() => topVarietal(tastings), [tastings])

  if (isPending) return <Skeleton className="h-64 w-full" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Stats</h1>
        <Select
          value={selectedUser ?? undefined}
          onValueChange={(user) =>
            setSearchParams(user === userId ? {} : { user }, { replace: true })
          }
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.id === userId ? 'Me' : profile.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tastings.length === 0 ? (
        <p className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          No tastings logged yet.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Tastings" value={String(summary.total)} />
            <StatTile label="Distinct wines" value={String(summary.distinctWines)} />
            <StatTile
              label="Average rating"
              value={summary.avgRating != null ? summary.avgRating.toFixed(1) : '–'}
            />
            <StatTile label="Favourite colour" value={summary.favouriteColour ?? '–'} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ratings</CardTitle>
              <CardDescription>How often each rating was given</CardDescription>
            </CardHeader>
            <CardContent>
              <RatingHistogram counts={histogram} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TopCard title="Top country" group={bestCountry} />
            <TopCard title="Top region" group={bestRegion} />
            <TopCard title="Top varietal" group={bestVarietal} />
          </div>

          {summary.mostRelogged && (
            <p className="text-sm text-muted-foreground">
              Most re-logged wine: <span className="text-foreground">{summary.mostRelogged.label}</span>{' '}
              (×{summary.mostRelogged.count})
            </p>
          )}
        </>
      )}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function RatingHistogram({ counts }: { counts: number[] }) {
  const max = Math.max(...counts, 1)
  return (
    <div className="flex h-36 items-end gap-0.5" role="img" aria-label="Rating histogram">
      {counts.map((count, i) => {
        const rating = i + 1
        return (
          <div
            key={rating}
            className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
            aria-label={`Rating ${rating}: ${count} tasting${count === 1 ? '' : 's'}`}
          >
            <span className="text-xs tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              {count}
            </span>
            {count > 0 ? (
              <div
                className="w-full max-w-8 rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
                style={{ height: `${(count / max) * 100}%` }}
              />
            ) : (
              <div className="h-px w-full max-w-8 bg-border" />
            )}
            <span className="text-xs tabular-nums text-muted-foreground">{rating}</span>
          </div>
        )
      })}
    </div>
  )
}

function TopCard({ title, group }: { title: string; group: TopGroup | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {group ? (
          <>
            <p className="text-lg font-semibold">{group.label}</p>
            <p className="text-sm text-muted-foreground">
              avg {group.avg.toFixed(1)}/10 over {group.count}{' '}
              {group.count === 1 ? 'tasting' : 'tastings'}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Not enough data yet</p>
        )}
      </CardContent>
    </Card>
  )
}
