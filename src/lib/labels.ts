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

export const COLOUR_DOT_CLASSES: Record<Enums<'wine_colour'>, string> = {
  red: 'bg-red-800',
  white: 'bg-yellow-100 border border-yellow-300',
  rose: 'bg-pink-300',
  orange: 'bg-orange-400',
  sparkling: 'bg-amber-200 border border-amber-400',
  fortified: 'bg-amber-800',
  dessert: 'bg-yellow-500',
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

// Always-coloured picker buttons; the selected one gets a ring.
export const COLOUR_BUTTON_CLASSES: Record<Enums<'wine_colour'>, string> = {
  red: 'bg-red-900 text-red-50',
  white: 'bg-stone-100 text-stone-900',
  rose: 'bg-pink-400 text-pink-950',
  orange: 'bg-orange-500 text-orange-950',
  sparkling: 'bg-amber-100 text-amber-950',
  dessert: 'bg-blue-500 text-white',
  fortified: 'bg-[oklch(0.35_0.08_35)] text-orange-100',
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
