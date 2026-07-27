import type { Enums } from '@/types/database.types'

export const COLOUR_LABELS: Record<Enums<'wine_colour'>, string> = {
  red: 'Red',
  white: 'White',
  rose: 'Rosé',
  orange: 'Orange',
  sparkling: 'Sparkling',
  fortified: 'Fortified',
  dessert: 'Dessert',
}

// The canonical wine-colour palette, used everywhere a coloured glass renders.
export const COLOUR_TEXT_CLASSES: Record<Enums<'wine_colour'>, string> = {
  red: 'text-[#81171B]',
  white: 'text-[#DED4AB]',
  rose: 'text-[#FD96A9]',
  orange: 'text-[#F7B267]',
  sparkling: 'text-[#F2C744]',
  fortified: 'text-[#3B0E31]',
  dessert: 'text-[#DCEDFF]',
}

export const VESSEL_LABELS: Record<Enums<'vessel_type'>, string> = {
  glass: 'Glass',
  bottle: 'Bottle',
  sampler: 'Sampler',
  cup: 'Cup',
  other: 'Other',
}

export const TEMP_LABELS: Record<Enums<'serving_temp'>, string> = {
  cool: 'Cool',
  ambient: 'Ambient',
  hot: 'Hot',
  freezing: 'Freezing',
  on_ice: 'On ice',
}

export const COLOURS = Object.keys(COLOUR_LABELS) as Enums<'wine_colour'>[]
export const VESSELS = Object.keys(VESSEL_LABELS) as Enums<'vessel_type'>[]
export const TEMPS = Object.keys(TEMP_LABELS) as Enums<'serving_temp'>[]

export const CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP', 'AUD', 'NZD', 'CHF', 'JPY', 'ZAR', 'ARS', 'CLP'] as const

export function formatCountry(country: { code: string; name: string } | null): string | null {
  return country ? `${country.name} ${countryFlag(country.code)}` : null
}

export function countryFlag(code: string): string {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  )
}

export function formatWineTitle(wine: { name: string; vintage: number | null }) {
  return wine.vintage ? `${wine.name} ${wine.vintage}` : wine.name
}

export function formatPrice(price: number | null, currency: string | null) {
  if (price == null) return null
  if (!currency) return price.toFixed(2)
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(price)
  } catch {
    return `${price.toFixed(2)} ${currency}`
  }
}
