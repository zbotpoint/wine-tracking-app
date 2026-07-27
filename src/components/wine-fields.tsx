import { useEffect, useState } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AddFieldButton, FieldSection } from '@/components/form-section'
import { SuggestInput } from '@/components/suggest-input'
import { FieldError } from '@/components/field-error'
import {
  countriesQuery,
  regionsQuery,
  subregionsQuery,
  varietalsQuery,
} from '@/lib/queries/lookups'
import { winesQuery } from '@/lib/queries/wines'
import { ColourGlass } from '@/components/wine-bits'
import { COLOURS, COLOUR_LABELS, countryFlag } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { WineFormValues } from '@/lib/schemas/wine'

const CURRENT_YEAR = new Date().getFullYear()
const VINTAGE_YEARS = Array.from({ length: CURRENT_YEAR + 2 - 1980 }, (_, i) =>
  String(CURRENT_YEAR + 1 - i),
)

type Section =
  | 'colour'
  | 'vintage'
  | 'varietals'
  | 'country'
  | 'region'
  | 'subregion'
  | 'producer'

export function WineFields({ form }: { form: UseFormReturn<WineFormValues> }) {
  const { data: countries = [] } = useQuery(countriesQuery)
  const { data: regions = [] } = useQuery(regionsQuery)
  const { data: subregions = [] } = useQuery(subregionsQuery)
  const { data: varietals = [] } = useQuery(varietalsQuery)
  const { data: wines = [] } = useQuery(winesQuery)

  const { register, control, watch, setValue, formState } = form
  const errors = formState.errors

  const colour = watch('colour')
  const vintage = watch('vintage')
  const producer = watch('producer')
  const countryCode = watch('countryCode')
  const region = watch('region')
  const subregion = watch('subregion')
  const chosenVarietals = watch('varietals')

  const [open, setOpen] = useState<Set<Section>>(new Set())
  const [varietalText, setVarietalText] = useState('')
  const [vintageText, setVintageText] = useState('')
  const [countryText, setCountryText] = useState('')
  const [regionText, setRegionText] = useState('')
  const [subregionText, setSubregionText] = useState('')

  // A field with a value (e.g. when editing) opens itself.
  useEffect(() => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (colour) next.add('colour')
      if (vintage != null) next.add('vintage')
      if (producer) next.add('producer')
      if (countryCode) next.add('country')
      if (region) next.add('region')
      if (subregion) next.add('subregion')
      if (chosenVarietals.length > 0) next.add('varietals')
      return next.size === prev.size ? prev : next
    })
  }, [colour, vintage, producer, countryCode, region, subregion, chosenVarietals])

  // Keep type-ahead text in sync when form values change (picks, resets).
  useEffect(() => {
    setVintageText(vintage != null ? String(vintage) : '')
  }, [vintage])
  useEffect(() => {
    const country = countries.find((c) => c.code === countryCode)
    setCountryText(country ? `${countryFlag(country.code)} ${country.name}` : '')
  }, [countryCode, countries])
  useEffect(() => {
    setRegionText(region?.name ?? '')
  }, [region])
  useEffect(() => {
    setSubregionText(subregion?.name ?? '')
  }, [subregion])

  function show(section: Section) {
    // Vintage opens prefilled with last year, the most common case.
    if (section === 'vintage' && vintage == null) {
      setValue('vintage', CURRENT_YEAR - 1)
    }
    setOpen((prev) => new Set(prev).add(section))
  }

  function remove(section: Section) {
    setOpen((prev) => {
      const next = new Set(prev)
      next.delete(section)
      if (section === 'country') {
        next.delete('region')
        next.delete('subregion')
      }
      if (section === 'region') next.delete('subregion')
      return next
    })
    switch (section) {
      case 'colour':
        setValue('colour', null)
        break
      case 'vintage':
        setValue('vintage', null)
        break
      case 'producer':
        setValue('producer', '')
        break
      case 'country':
        setValue('countryCode', null)
        setValue('region', null)
        setValue('subregion', null)
        break
      case 'region':
        setValue('region', null)
        setValue('subregion', null)
        break
      case 'subregion':
        setValue('subregion', null)
        break
      case 'varietals':
        setValue('varietals', [])
        break
    }
  }

  const producerSuggestions = [
    ...new Set(wines.map((w) => w.producer).filter((p): p is string => p != null)),
  ]
    .sort()
    .map((p) => ({ value: p, label: p }))

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="wine-name">Wine name</Label>
        <Input
          id="wine-name"
          autoComplete="off"
          placeholder="e.g. Estate High Altitude Malbec"
          {...register('name')}
        />
        <p className="text-xs text-muted-foreground">
          The name on the label — not the producer or the year.
        </p>
        <FieldError message={errors.name?.message} />
      </div>

      {open.has('colour') && (
        <FieldSection label="Colour" onRemove={() => remove('colour')}>
          <Controller
            control={control}
            name="colour"
            render={({ field }) => (
              <div className="flex flex-wrap gap-1.5">
                {COLOURS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={field.value === c}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                      field.value === c
                        ? 'border-ring bg-accent'
                        : 'border-input bg-input/30 text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                    )}
                    onClick={() => field.onChange(field.value === c ? null : c)}
                  >
                    <ColourGlass colour={c} />
                    {COLOUR_LABELS[c]}
                  </button>
                ))}
              </div>
            )}
          />
        </FieldSection>
      )}

      {open.has('vintage') && (
        <FieldSection label="Vintage" htmlFor="wine-vintage" onRemove={() => remove('vintage')}>
          <Controller
            control={control}
            name="vintage"
            render={({ field }) => (
              <SuggestInput
                id="wine-vintage"
                autoFocus={vintage == null}
                text={vintageText}
                onTextChange={setVintageText}
                inputMode="numeric"
                placeholder={`1980–${CURRENT_YEAR + 1}`}
                matchOnly
                suggestions={VINTAGE_YEARS.map((y) => ({ value: y, label: y }))}
                onPick={(s) => field.onChange(Number(s.value))}
              />
            )}
          />
          <FieldError message={errors.vintage?.message} />
        </FieldSection>
      )}

      {open.has('varietals') && (
        <FieldSection label="Grape varietals" onRemove={() => remove('varietals')}>
          <Controller
            control={control}
            name="varietals"
            render={({ field }) => {
              const chosen = field.value
              const chosenNames = new Set(chosen.map((v) => v.name.toLowerCase()))
              return (
                <div className="space-y-2">
                  {chosen.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {chosen.map((varietal) => (
                        <Badge key={varietal.id ?? varietal.name} variant="secondary">
                          {varietal.name}
                          <button
                            type="button"
                            aria-label={`Remove ${varietal.name}`}
                            className="ml-0.5 hover:text-destructive"
                            onClick={() =>
                              field.onChange(chosen.filter((v) => v !== varietal))
                            }
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <SuggestInput
                    id="wine-varietals"
                    text={varietalText}
                    onTextChange={setVarietalText}
                    placeholder="Type a varietal…"
                    suggestions={varietals
                      .filter((v) => !chosenNames.has(v.name.toLowerCase()))
                      .map((v) => ({ value: v.id, label: v.name }))}
                    onPick={(s) => {
                      field.onChange([...chosen, { id: s.value, name: s.label }])
                      setVarietalText('')
                    }}
                    onCreate={(name) => {
                      if (!chosenNames.has(name.toLowerCase())) {
                        field.onChange([...chosen, { id: null, name }])
                      }
                      setVarietalText('')
                    }}
                  />
                </div>
              )
            }}
          />
        </FieldSection>
      )}

      {open.has('country') && (
        <FieldSection label="Country" htmlFor="wine-country" onRemove={() => remove('country')}>
          <Controller
            control={control}
            name="countryCode"
            render={({ field }) => (
              <SuggestInput
                id="wine-country"
                autoFocus={countryCode == null}
                text={countryText}
                onTextChange={setCountryText}
                placeholder="Search countries…"
                matchOnly
                suggestions={countries.map((c) => ({
                  value: c.code,
                  label: `${countryFlag(c.code)} ${c.name}`,
                }))}
                onPick={(s) => {
                  if (s.value !== field.value) {
                    field.onChange(s.value)
                    setValue('region', null)
                    setValue('subregion', null)
                  }
                }}
              />
            )}
          />
        </FieldSection>
      )}

      {open.has('region') && (
        <FieldSection
          label="Region"
          htmlFor="wine-region"
          hint="The broad region — the province, state, etc."
          onRemove={() => remove('region')}
        >
          <Controller
            control={control}
            name="region"
            render={({ field }) => (
              <SuggestInput
                id="wine-region"
                autoFocus={region == null}
                text={regionText}
                onTextChange={setRegionText}
                placeholder="Search or add a region…"
                commitOnBlur
                suggestions={regions
                  .filter((r) => r.country_code === countryCode)
                  .map((r) => ({ value: r.id, label: r.name }))}
                onPick={(s) => {
                  if (s.value !== field.value?.id) {
                    field.onChange({ id: s.value, name: s.label })
                    setValue('subregion', null)
                  }
                }}
                onCreate={(name) => {
                  field.onChange({ id: null, name })
                  setValue('subregion', null)
                }}
              />
            )}
          />
          <FieldError message={errors.region?.message} />
        </FieldSection>
      )}

      {open.has('subregion') && (
        <FieldSection
          label="Subregion"
          htmlFor="wine-subregion"
          hint="The most specific area the label names — “Twenty Mile Bench” if it says so, “Niagara Peninsula” if that’s all it gives you."
          onRemove={() => remove('subregion')}
        >
          <Controller
            control={control}
            name="subregion"
            render={({ field }) => (
              <SuggestInput
                id="wine-subregion"
                autoFocus={subregion == null}
                text={subregionText}
                onTextChange={setSubregionText}
                placeholder="Search or add a subregion…"
                commitOnBlur
                suggestions={subregions
                  .filter((s) => s.region_id === region?.id)
                  .map((s) => ({ value: s.id, label: s.name }))}
                onPick={(s) => field.onChange({ id: s.value, name: s.label })}
                onCreate={(name) => field.onChange({ id: null, name })}
              />
            )}
          />
          <FieldError message={errors.subregion?.message} />
        </FieldSection>
      )}

      {open.has('producer') && (
        <FieldSection
          label="Vineyard / producer"
          htmlFor="wine-producer"
          onRemove={() => remove('producer')}
        >
          <SuggestInput
            id="wine-producer"
            autoFocus={!producer}
            text={producer}
            onTextChange={(text) => setValue('producer', text)}
            placeholder="Producer…"
            suggestions={producerSuggestions}
            onPick={(s) => setValue('producer', s.value)}
          />
        </FieldSection>
      )}

      <div className="flex flex-wrap gap-2">
        {!open.has('colour') && <AddFieldButton label="Colour" onClick={() => show('colour')} />}
        {!open.has('vintage') && (
          <AddFieldButton label="Vintage" onClick={() => show('vintage')} />
        )}
        {!open.has('varietals') && (
          <AddFieldButton label="Varietal" onClick={() => show('varietals')} />
        )}
        {!open.has('country') && (
          <AddFieldButton label="Country" onClick={() => show('country')} />
        )}
        {open.has('country') && countryCode && !open.has('region') && (
          <AddFieldButton label="Region" onClick={() => show('region')} />
        )}
        {open.has('region') && region && !open.has('subregion') && (
          <AddFieldButton label="Subregion" onClick={() => show('subregion')} />
        )}
        {!open.has('producer') && (
          <AddFieldButton label="Producer" onClick={() => show('producer')} />
        )}
      </div>
    </div>
  )
}
