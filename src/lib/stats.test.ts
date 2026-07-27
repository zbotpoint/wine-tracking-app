import { describe, expect, it } from 'vitest'
import {
  ratingHistogram,
  summarize,
  topCountry,
  topRegion,
  topVarietal,
} from '@/lib/stats'
import type { TastingWithWine, WineWithRefs } from '@/lib/queries/tastings'

let nextId = 0

function makeWine(overrides: Partial<WineWithRefs> = {}): WineWithRefs {
  nextId += 1
  return {
    id: `wine-${nextId}`,
    name: `Wine ${nextId}`,
    producer: null,
    vintage: null,
    country_code: null,
    region_id: null,
    subregion_id: null,
    colour: 'red',
    created_by: 'user-1',
    created_at: '',
    updated_at: '',
    country: null,
    region: null,
    subregion: null,
    wine_varietals: [],
    ...overrides,
  }
}

function makeTasting(
  rating: number | null,
  wine: WineWithRefs = makeWine(),
  overrides: Partial<TastingWithWine> = {},
): TastingWithWine {
  nextId += 1
  return {
    id: `tasting-${nextId}`,
    wine_id: wine.id,
    user_id: 'user-1',
    rating,
    notes: null,
    location: null,
    consumed_on: '2026-07-01',
    vessel: null,
    serving_temp: null,
    price: null,
    currency: null,
    photo_path: null,
    created_at: '',
    updated_at: '',
    wine,
    profile: { id: 'user-1', display_name: 'Test', created_at: '' },
    tasting_flavours: [],
    ...overrides,
  }
}

function region(name: string) {
  nextId += 1
  return { id: `region-${nextId}`, country_code: 'FR', name, created_by: null, created_at: '' }
}

describe('ratingHistogram', () => {
  it('counts ratings into 1-10 buckets', () => {
    const tastings = [makeTasting(1), makeTasting(5), makeTasting(5), makeTasting(10)]
    expect(ratingHistogram(tastings)).toEqual([1, 0, 0, 0, 2, 0, 0, 0, 0, 1])
  })

  it('returns all zeros for no tastings', () => {
    expect(ratingHistogram([])).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  })

  it('ignores unrated tastings', () => {
    const tastings = [makeTasting(null), makeTasting(7)]
    expect(ratingHistogram(tastings)).toEqual([0, 0, 0, 0, 0, 0, 1, 0, 0, 0])
  })
})

describe('topRegion', () => {
  it('requires the minimum count: one 10/10 loses to three 8s', () => {
    const rioja = region('Rioja')
    const jura = region('Jura')
    const tastings = [
      makeTasting(10, makeWine({ region: jura })),
      makeTasting(8, makeWine({ region: rioja })),
      makeTasting(8, makeWine({ region: rioja })),
      makeTasting(8, makeWine({ region: rioja })),
    ]
    const top = topRegion(tastings)
    expect(top?.label).toBe('Rioja')
    expect(top?.belowThreshold).toBe(false)
  })

  it('falls back to the best group when nothing meets the threshold', () => {
    const tastings = [
      makeTasting(9, makeWine({ region: region('Jura') })),
      makeTasting(7, makeWine({ region: region('Rioja') })),
    ]
    const top = topRegion(tastings)
    expect(top?.label).toBe('Jura')
    expect(top?.belowThreshold).toBe(true)
  })

  it('returns null when no tasting has a region', () => {
    expect(topRegion([makeTasting(8)])).toBeNull()
  })

  it('ignores unrated tastings when grouping', () => {
    const jura = region('Jura')
    expect(topRegion([makeTasting(null, makeWine({ region: jura }))])).toBeNull()
  })
})

describe('topCountry', () => {
  it('groups by country name', () => {
    const france = { code: 'FR', name: 'France' }
    const italy = { code: 'IT', name: 'Italy' }
    const tastings = [
      makeTasting(9, makeWine({ country: france })),
      makeTasting(9, makeWine({ country: france })),
      makeTasting(9, makeWine({ country: france })),
      makeTasting(5, makeWine({ country: italy })),
      makeTasting(5, makeWine({ country: italy })),
      makeTasting(5, makeWine({ country: italy })),
    ]
    expect(topCountry(tastings)?.label).toBe('France')
  })
})

describe('topVarietal', () => {
  it('counts a blend once per varietal', () => {
    const gamay = { id: 'v-gamay', name: 'Gamay', created_by: null, created_at: '' }
    const syrah = { id: 'v-syrah', name: 'Syrah', created_by: null, created_at: '' }
    const blend = makeWine({
      wine_varietals: [{ varietal: gamay }, { varietal: syrah }],
    })
    const tastings = [makeTasting(9, blend), makeTasting(9, blend), makeTasting(9, blend)]
    const top = topVarietal(tastings)
    expect(top?.count).toBe(3)
    expect(top?.belowThreshold).toBe(false)
  })
})

describe('summarize', () => {
  it('computes totals, distinct wines, and the most re-logged wine', () => {
    const repeat = makeWine({ name: 'Château Repeat', vintage: 2019 })
    const tastings = [
      makeTasting(6, repeat),
      makeTasting(8, repeat),
      makeTasting(10),
      makeTasting(null),
    ]
    const summary = summarize(tastings)
    expect(summary.total).toBe(4)
    expect(summary.distinctWines).toBe(3)
    expect(summary.avgRating).toBe(8)
    expect(summary.favouriteColour).toBe('Red')
    expect(summary.mostRelogged).toEqual({ label: 'Château Repeat 2019', count: 2 })
  })

  it('handles the empty case', () => {
    const summary = summarize([])
    expect(summary.total).toBe(0)
    expect(summary.avgRating).toBeNull()
    expect(summary.favouriteColour).toBeNull()
    expect(summary.mostRelogged).toBeNull()
  })
})
