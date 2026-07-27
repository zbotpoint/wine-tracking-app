import { z } from 'zod'
import { wineFormSchema } from '@/lib/schemas/wine'

// A flavour chosen from the lookup (id set) or typed fresh (id null).
export const flavourChoiceSchema = z.object({
  id: z.string().nullable(),
  name: z.string().trim().min(1),
})

export const tastingFieldsSchema = z.object({
  rating: z.number().int().min(1).max(10).nullable(),
  flavours: z.array(flavourChoiceSchema),
  consumedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
  notes: z.string().trim(),
  location: z.string().trim(),
  vessel: z.enum(['glass', 'bottle', 'sampler', 'cup', 'other']).nullable(),
  servingTemp: z.enum(['cool', 'ambient', 'hot', 'freezing', 'on_ice']).nullable(),
  price: z.number().min(0).nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
})

// The /log form: an existing wine id, or the fields to create a new one.
export const logTastingSchema = z
  .discriminatedUnion('wineMode', [
    z.object({ wineMode: z.literal('existing'), wineId: z.string().min(1, 'Pick a wine') }),
    z.object({ wineMode: z.literal('new'), wine: wineFormSchema }),
  ])
  .and(tastingFieldsSchema)

export type TastingFieldsValues = z.infer<typeof tastingFieldsSchema>
export type LogTastingValues = z.infer<typeof logTastingSchema>
