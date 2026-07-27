import { useEffect, useState } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Grape, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { AddFieldButton, FieldSection } from '@/components/form-section'
import { PhotoInput } from '@/components/photo-input'
import { SuggestInput } from '@/components/suggest-input'
import { GrapeScore } from '@/components/wine-bits'
import { FieldError } from '@/components/field-error'
import { flavoursQuery } from '@/lib/queries/lookups'
import { CURRENCIES, TEMPS, TEMP_LABELS, VESSELS, VESSEL_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { TastingFieldsValues } from '@/lib/schemas/tasting'

const RATINGS = Array.from({ length: 10 }, (_, i) => i + 1)

type Section = 'vessel' | 'location' | 'photo' | 'temperature' | 'price'

type OccasionFieldsProps = {
  form: UseFormReturn<TastingFieldsValues>
  photo: File | null
  onPhotoChange: (file: File | null) => void
  existingPhotoUrl?: string | null
  removeExisting?: boolean
  onRemoveExistingChange?: (remove: boolean) => void
}

export function OccasionFields({
  form,
  photo,
  onPhotoChange,
  existingPhotoUrl,
  removeExisting = false,
  onRemoveExistingChange,
}: OccasionFieldsProps) {
  const { register, control, watch, setValue, formState } = form
  const errors = formState.errors

  const vessel = watch('vessel')
  const location = watch('location')
  const servingTemp = watch('servingTemp')
  const price = watch('price')
  const hasPhoto = photo != null || (existingPhotoUrl != null && !removeExisting)

  const [open, setOpen] = useState<Set<Section>>(new Set())
  useEffect(() => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (vessel) next.add('vessel')
      if (location) next.add('location')
      if (servingTemp) next.add('temperature')
      if (hasPhoto) next.add('photo')
      if (price != null) next.add('price')
      return next.size === prev.size ? prev : next
    })
  }, [vessel, location, servingTemp, hasPhoto, price])

  function show(section: Section) {
    setOpen((prev) => new Set(prev).add(section))
  }

  function remove(section: Section) {
    setOpen((prev) => {
      const next = new Set(prev)
      next.delete(section)
      return next
    })
    switch (section) {
      case 'vessel':
        setValue('vessel', null)
        break
      case 'location':
        setValue('location', '')
        break
      case 'temperature':
        setValue('servingTemp', null)
        break
      case 'photo':
        onPhotoChange(null)
        onRemoveExistingChange?.(true)
        break
      case 'price':
        setValue('price', null)
        break
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="tasting-date">Date</Label>
        <Input id="tasting-date" type="date" className="w-fit" {...register('consumedOn')} />
        <FieldError message={errors.consumedOn?.message} />
      </div>

      {open.has('vessel') && (
        <FieldSection label="Vessel" onRemove={() => remove('vessel')}>
          <Controller
            control={control}
            name="vessel"
            render={({ field }) => (
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                className="flex-wrap justify-start"
                value={field.value ?? ''}
                onValueChange={(value) => field.onChange(value === '' ? null : value)}
              >
                {VESSELS.map((v) => (
                  <ToggleGroupItem key={v} value={v} className="px-3">
                    {VESSEL_LABELS[v]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          />
        </FieldSection>
      )}

      {open.has('location') && (
        <FieldSection
          label="Location"
          htmlFor="tasting-location"
          onRemove={() => remove('location')}
        >
          <Input
            id="tasting-location"
            autoFocus={!location}
            placeholder="Restaurant, home…"
            autoComplete="off"
            {...register('location')}
          />
        </FieldSection>
      )}

      {open.has('photo') && (
        <FieldSection label="Photo" onRemove={() => remove('photo')}>
          <PhotoInput
            file={photo}
            onFileChange={onPhotoChange}
            existingUrl={existingPhotoUrl}
            removeExisting={removeExisting}
            onRemoveExistingChange={onRemoveExistingChange}
          />
        </FieldSection>
      )}

      {open.has('temperature') && (
        <FieldSection label="Temperature" onRemove={() => remove('temperature')}>
          <Controller
            control={control}
            name="servingTemp"
            render={({ field }) => (
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                className="flex-wrap justify-start"
                value={field.value ?? ''}
                onValueChange={(value) => field.onChange(value === '' ? null : value)}
              >
                {TEMPS.map((temp) => (
                  <ToggleGroupItem key={temp} value={temp} className="px-3">
                    {TEMP_LABELS[temp]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          />
        </FieldSection>
      )}

      {open.has('price') && (
        <FieldSection label="Price" htmlFor="tasting-price" onRemove={() => remove('price')}>
          <PriceField form={form} />
        </FieldSection>
      )}

      <div className="flex flex-wrap gap-2">
        {!open.has('vessel') && <AddFieldButton label="Vessel" onClick={() => show('vessel')} />}
        {!open.has('location') && (
          <AddFieldButton label="Location" onClick={() => show('location')} />
        )}
        {!open.has('photo') && <AddFieldButton label="Photo" onClick={() => show('photo')} />}
        {!open.has('temperature') && (
          <AddFieldButton label="Temperature" onClick={() => show('temperature')} />
        )}
        {!open.has('price') && <AddFieldButton label="Price" onClick={() => show('price')} />}
      </div>
    </div>
  )
}

// Rating, flavours, and notes sit below both form sections.
export function RatingNotesFields({ form }: { form: UseFormReturn<TastingFieldsValues> }) {
  const { register, control, formState } = form
  const { data: flavours = [] } = useQuery(flavoursQuery)
  const [flavourText, setFlavourText] = useState('')

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Rating</Label>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <div className="space-y-1">
              <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Rating">
                {RATINGS.map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    role="radio"
                    aria-checked={field.value === rating}
                    aria-label={`${rating} out of 10`}
                    // Clicking the current rating again clears it.
                    onClick={() => field.onChange(field.value === rating ? null : rating)}
                    className="p-0.5"
                  >
                    <Grape
                      className={cn(
                        'size-6 transition-colors',
                        field.value != null && rating <= field.value
                          ? 'text-[#8E4585]'
                          : 'text-foreground opacity-40',
                      )}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs tabular-nums text-muted-foreground">
                {field.value != null ? (
                  <span className="inline-flex items-center">
                    (<GrapeScore value={field.value} className="[&_svg]:size-3" />)
                  </span>
                ) : (
                  '(unrated)'
                )}
              </p>
            </div>
          )}
        />
        <FieldError message={formState.errors.rating?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tasting-flavours">Flavours</Label>
        <Controller
          control={control}
          name="flavours"
          render={({ field }) => {
            const chosen = field.value
            const chosenNames = new Set(chosen.map((f) => f.name.toLowerCase()))
            return (
              <div className="space-y-2">
                {chosen.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {chosen.map((flavour) => (
                      <Badge key={flavour.id ?? flavour.name} variant="secondary">
                        {flavour.name}
                        <button
                          type="button"
                          aria-label={`Remove ${flavour.name}`}
                          className="ml-0.5 hover:text-destructive"
                          onClick={() => field.onChange(chosen.filter((f) => f !== flavour))}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <SuggestInput
                  id="tasting-flavours"
                  text={flavourText}
                  onTextChange={setFlavourText}
                  placeholder="What did you taste? Cherry, petrol, forest floor…"
                  suggestions={flavours
                    .filter((f) => !chosenNames.has(f.name.toLowerCase()))
                    .map((f) => ({ value: f.id, label: f.name }))}
                  onPick={(s) => {
                    field.onChange([...chosen, { id: s.value, name: s.label }])
                    setFlavourText('')
                  }}
                  onCreate={(name) => {
                    if (!chosenNames.has(name.toLowerCase())) {
                      field.onChange([...chosen, { id: null, name }])
                    }
                    setFlavourText('')
                  }}
                />
              </div>
            )
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tasting-notes">Notes</Label>
        <Textarea
          id="tasting-notes"
          rows={3}
          placeholder="Aromas, flavours, who you shared it with…"
          {...register('notes')}
        />
      </div>
    </div>
  )
}

// Stored per tasting (the same wine costs differently at a shop vs a
// restaurant) but rendered inside The Wine section of the form.
export function PriceField({ form }: { form: UseFormReturn<TastingFieldsValues> }) {
  const { register, control, formState } = form

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <Input
          id="tasting-price"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          autoFocus
          {...register('price', {
            setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
          })}
        />
        <FieldError message={formState.errors.price?.message} />
      </div>
      <Controller
        control={control}
        name="currency"
        render={({ field }) => (
          <Select value={field.value ?? 'CAD'} onValueChange={field.onChange}>
            <SelectTrigger size="sm" className="w-24 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  )
}
