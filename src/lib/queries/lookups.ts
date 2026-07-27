import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export const countriesQuery = queryOptions({
  queryKey: ['countries'],
  queryFn: async () => {
    const { data, error } = await supabase.from('countries').select('*').order('name')
    if (error) throw error
    return data
  },
  staleTime: Infinity,
})

export const regionsQuery = queryOptions({
  queryKey: ['regions'],
  queryFn: async () => {
    const { data, error } = await supabase.from('regions').select('*').order('name')
    if (error) throw error
    return data
  },
  staleTime: 5 * 60 * 1000,
})

export const subregionsQuery = queryOptions({
  queryKey: ['subregions'],
  queryFn: async () => {
    const { data, error } = await supabase.from('subregions').select('*').order('name')
    if (error) throw error
    return data
  },
  staleTime: 5 * 60 * 1000,
})

export const flavoursQuery = queryOptions({
  queryKey: ['flavours'],
  queryFn: async () => {
    const { data, error } = await supabase.from('flavours').select('*').order('name')
    if (error) throw error
    return data
  },
  staleTime: 5 * 60 * 1000,
})

export const varietalsQuery = queryOptions({
  queryKey: ['varietals'],
  queryFn: async () => {
    const { data, error } = await supabase.from('varietals').select('*').order('name')
    if (error) throw error
    return data
  },
  staleTime: 5 * 60 * 1000,
})

export const profilesQuery = queryOptions({
  queryKey: ['profiles'],
  queryFn: async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('display_name')
    if (error) throw error
    return data
  },
  staleTime: 5 * 60 * 1000,
})
