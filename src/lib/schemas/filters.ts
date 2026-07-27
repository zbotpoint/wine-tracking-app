import { z } from 'zod'

// Browse-page state, round-tripped through the URL so views are shareable
// and the back button works. Every field has a default so a bare "/" parses.
export const browseFiltersSchema = z.object({
  view: z.enum(['log', 'wines']).catch('log'),
  owner: z.string().catch('me'), // 'me' | 'all' | profile id
  colour: z.enum(['red', 'white', 'rose', 'orange', 'sparkling', 'fortified', 'dessert']).nullable().catch(null),
  country: z.string().length(2).nullable().catch(null),
  region: z.string().nullable().catch(null), // region id
  varietal: z.string().nullable().catch(null), // varietal id
  minRating: z.coerce.number().int().min(1).max(10).nullable().catch(null),
  q: z.string().catch(''),
})

export type BrowseFilters = z.infer<typeof browseFiltersSchema>

export const DEFAULT_FILTERS: BrowseFilters = {
  view: 'log',
  owner: 'me',
  colour: null,
  country: null,
  region: null,
  varietal: null,
  minRating: null,
  q: '',
}

export function parseFilters(params: URLSearchParams): BrowseFilters {
  return browseFiltersSchema.parse({
    view: params.get('view') ?? undefined,
    owner: params.get('owner') ?? undefined,
    colour: params.get('colour'),
    country: params.get('country'),
    region: params.get('region'),
    varietal: params.get('varietal'),
    minRating: params.get('minRating'),
    q: params.get('q') ?? undefined,
  })
}

export function filtersToParams(filters: BrowseFilters): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    const defaultValue = DEFAULT_FILTERS[key as keyof BrowseFilters]
    if (value !== defaultValue && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  return params
}
