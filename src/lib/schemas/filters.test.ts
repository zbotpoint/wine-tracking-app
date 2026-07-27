import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FILTERS,
  filtersToParams,
  parseFilters,
  type BrowseFilters,
} from '@/lib/schemas/filters'

describe('parseFilters', () => {
  it('returns defaults for empty params', () => {
    expect(parseFilters(new URLSearchParams())).toEqual(DEFAULT_FILTERS)
  })

  it('parses valid params', () => {
    const params = new URLSearchParams(
      'view=wines&owner=all&colour=red&country=FR&minRating=7&q=gamay',
    )
    expect(parseFilters(params)).toEqual({
      ...DEFAULT_FILTERS,
      view: 'wines',
      owner: 'all',
      colour: 'red',
      country: 'FR',
      minRating: 7,
      q: 'gamay',
    })
  })

  it('falls back to defaults on garbage values instead of throwing', () => {
    const params = new URLSearchParams('view=nope&colour=purple&country=France&minRating=99')
    expect(parseFilters(params)).toEqual(DEFAULT_FILTERS)
  })
})

describe('filtersToParams', () => {
  it('omits defaults so the URL stays clean', () => {
    expect(filtersToParams(DEFAULT_FILTERS).toString()).toBe('')
  })

  it('round-trips a full filter set', () => {
    const filters: BrowseFilters = {
      view: 'wines',
      owner: 'all',
      colour: 'rose',
      country: 'FR',
      region: 'region-1',
      varietal: 'varietal-1',
      minRating: 8,
      q: 'ch',
    }
    expect(parseFilters(filtersToParams(filters))).toEqual(filters)
  })
})
