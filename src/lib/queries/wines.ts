import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'
import type { WineWithRefs } from '@/lib/queries/tastings'

export type WineWithTastings = WineWithRefs & {
  tastings: (Tables<'tastings'> & {
    profile: Tables<'profiles'>
    tasting_flavours: { flavour: Tables<'flavours'> }[]
  })[]
}

const WINE_SELECT = `*,
  country:countries(*),
  region:regions(*),
  subregion:subregions(*),
  wine_varietals(varietal:varietals(*)),
  tastings(*, profile:profiles(*), tasting_flavours(flavour:flavours(*)))`

export const winesQuery = queryOptions({
  queryKey: ['wines'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('wines')
      .select(WINE_SELECT)
      .order('name')
      .returns<WineWithTastings[]>()
    if (error) throw error
    return data
  },
})

export const wineQuery = (id: string) =>
  queryOptions({
    queryKey: ['wines', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wines')
        .select(WINE_SELECT)
        .eq('id', id)
        .single<WineWithTastings>()
      if (error) throw error
      return data
    },
  })
