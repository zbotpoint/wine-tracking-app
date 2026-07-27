import { z } from 'zod'

const CURRENT_YEAR = new Date().getFullYear()

// A varietal chosen from the lookup (id set) or typed fresh (id null).
export const varietalChoiceSchema = z.object({
  id: z.string().nullable(),
  name: z.string().trim().min(1),
})

// An existing lookup row (id set) or a new name to get-or-create (id null).
const lookupChoiceSchema = z.object({
  id: z.string().nullable(),
  name: z.string().trim().min(1),
})

// Everything except the name is optional: logging at a dinner table should
// never stall on a field you don't know. The vintage dropdown constrains the
// range in the UI; the schema stays permissive (the DB allows 1900+).
export const wineFormSchema = z.object({
  name: z.string().trim().min(1, 'Wine name is required'),
  producer: z.string().trim(),
  vintage: z
    .number()
    .int()
    .min(1980, 'No earlier than 1980')
    .max(CURRENT_YEAR + 1, 'That vintage is in the future')
    .nullable(),
  countryCode: z.string().length(2).nullable(),
  region: lookupChoiceSchema.nullable(),
  subregion: lookupChoiceSchema.nullable(),
  varietals: z.array(varietalChoiceSchema),
  colour: z
    .enum(['red', 'white', 'rose', 'orange', 'sparkling', 'fortified', 'dessert'])
    .nullable(),
})
  .refine((w) => w.region === null || w.countryCode !== null, {
    path: ['region'],
    message: 'Pick a country before a region',
  })
  .refine((w) => w.subregion === null || w.region !== null, {
    path: ['subregion'],
    message: 'Pick a region before a subregion',
  })

export type WineFormValues = z.infer<typeof wineFormSchema>
export type VarietalChoice = z.infer<typeof varietalChoiceSchema>

export const EMPTY_WINE_FORM: WineFormValues = {
  name: '',
  producer: '',
  vintage: null,
  countryCode: null,
  region: null,
  subregion: null,
  varietals: [],
  colour: null,
}
