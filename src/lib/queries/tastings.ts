import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'

export type WineWithRefs = Tables<'wines'> & {
  country: Tables<'countries'> | null
  region: Tables<'regions'> | null
  subregion: Tables<'subregions'> | null
  wine_varietals: { varietal: Tables<'varietals'> }[]
}

export type TastingWithWine = Tables<'tastings'> & {
  wine: WineWithRefs
  profile: Tables<'profiles'>
  tasting_flavours: { flavour: Tables<'flavours'> }[]
}

export const TASTING_SELECT = `*,
  profile:profiles(*),
  tasting_flavours(flavour:flavours(*)),
  wine:wines(*, country:countries(*), region:regions(*), subregion:subregions(*), wine_varietals(varietal:varietals(*)))`

// The workhorse query: every tasting with its wine and lookups embedded.
// Total volume stays tiny for a friend group, so browsing, the wine picker
// badge counts, and stats all filter this one cached result client-side.
export const tastingsQuery = queryOptions({
  queryKey: ['tastings'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('tastings')
      .select(TASTING_SELECT)
      .order('consumed_on', { ascending: false })
      .order('created_at', { ascending: false })
      .returns<TastingWithWine[]>()
    if (error) throw error
    return data
  },
})

export const tastingQuery = (id: string) =>
  queryOptions({
    queryKey: ['tastings', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tastings')
        .select(TASTING_SELECT)
        .eq('id', id)
        .single<TastingWithWine>()
      if (error) throw error
      return data
    },
  })
