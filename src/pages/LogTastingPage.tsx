import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CalendarDays, Star, Wine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/section-card'
import { SuggestInput } from '@/components/suggest-input'
import { OccasionFields, RatingNotesFields } from '@/components/tasting-fields'
import { ColourVarietalLine } from '@/components/wine-bits'
import { WineFields } from '@/components/wine-fields'
import { useUserId } from '@/lib/auth'
import { formatCountry, formatWineTitle } from '@/lib/labels'
import { logTasting } from '@/lib/mutations'
import { winesQuery, type WineWithTastings } from '@/lib/queries/wines'
import { tastingFieldsSchema, type TastingFieldsValues } from '@/lib/schemas/tasting'
import { EMPTY_WINE_FORM, wineFormSchema, type WineFormValues } from '@/lib/schemas/wine'
import { getLastCurrency, rememberCurrency, todayISO } from '@/lib/preferences'

type WineChoice = { kind: 'unset' } | { kind: 'existing'; wineId: string } | { kind: 'new' }

export function LogTastingPage() {
  const userId = useUserId()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const { data: wines = [] } = useQuery(winesQuery)

  const presetWineId = searchParams.get('wine')
  const [choice, setChoice] = useState<WineChoice>(
    presetWineId ? { kind: 'existing', wineId: presetWineId } : { kind: 'unset' },
  )
  const [photo, setPhoto] = useState<File | null>(null)
  const [pickerText, setPickerText] = useState('')

  const wineForm = useForm<WineFormValues>({
    resolver: zodResolver(wineFormSchema),
    defaultValues: EMPTY_WINE_FORM,
  })
  const tastingForm = useForm<TastingFieldsValues>({
    resolver: zodResolver(tastingFieldsSchema),
    defaultValues: {
      rating: null,
      flavours: [],
      consumedOn: todayISO(),
      notes: '',
      location: '',
      vessel: null,
      servingTemp: null,
      price: null,
      currency: getLastCurrency(),
    },
  })

  const selectedWine: WineWithTastings | null = useMemo(
    () =>
      choice.kind === 'existing'
        ? (wines.find((w) => w.id === choice.wineId) ?? null)
        : null,
    [choice, wines],
  )

  const mutation = useMutation({
    mutationFn: async () => {
      const tastingValues = tastingForm.getValues()
      if (choice.kind === 'existing') {
        return logTasting(
          { wineMode: 'existing', wineId: choice.wineId, ...tastingValues },
          photo,
          userId!,
        )
      }
      return logTasting(
        { wineMode: 'new', wine: wineForm.getValues(), ...tastingValues },
        photo,
        userId!,
      )
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tastings'] })
      queryClient.invalidateQueries({ queryKey: ['wines'] })
      queryClient.invalidateQueries({ queryKey: ['regions'] })
      queryClient.invalidateQueries({ queryKey: ['subregions'] })
      queryClient.invalidateQueries({ queryKey: ['varietals'] })
      queryClient.invalidateQueries({ queryKey: ['flavours'] })
      rememberCurrency(tastingForm.getValues().currency)
      if (result.photoError) {
        toast.warning('Tasting saved, but the photo failed to upload. Re-attach it from the edit screen.')
      } else {
        toast.success('Tasting logged.')
      }
      navigate(`/wines/${result.wineId}`)
    },
    onError: (error) => toast.error(error.message),
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (choice.kind === 'unset') {
      toast.error('Pick a wine or add a new one first.')
      return
    }
    const tastingValid = await tastingForm.trigger()
    const wineValid = choice.kind === 'new' ? await wineForm.trigger() : true
    if (tastingValid && wineValid) mutation.mutate()
  }

  const wineChosen = choice.kind !== 'unset'
  const changeButton = wineChosen && (
    <Button type="button" variant="ghost" size="sm" onClick={() => setChoice({ kind: 'unset' })}>
      Change
    </Button>
  )

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-xl font-semibold">Log a wine</h1>

      <SectionCard title="The Wine" accent="wine" icon={Wine} action={changeButton}>
        {choice.kind === 'unset' && (
          <SuggestInput
            text={pickerText}
            onTextChange={setPickerText}
            placeholder="Search wines, or type a new one…"
            createPrefix="New wine:"
            suggestions={wines.map((wine) => ({
              value: wine.id,
              label: `${formatWineTitle(wine)}${wine.producer ? ` — ${wine.producer}` : ''}`,
              hint: wine.tastings.length > 0 ? `logged ×${wine.tastings.length}` : undefined,
            }))}
            onPick={(s) => {
              setChoice({ kind: 'existing', wineId: s.value })
              setPickerText('')
            }}
            onCreate={(name) => {
              wineForm.reset({ ...EMPTY_WINE_FORM, name })
              setChoice({ kind: 'new' })
              setPickerText('')
            }}
          />
        )}

        {choice.kind === 'existing' && selectedWine && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="font-medium">{formatWineTitle(selectedWine)}</p>
              <p className="text-sm text-muted-foreground">
                {[
                  selectedWine.producer,
                  selectedWine.subregion?.name,
                  selectedWine.region?.name,
                  formatCountry(selectedWine.country),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <ColourVarietalLine
                  colour={selectedWine.colour}
                  varietals={selectedWine.wine_varietals}
                />
                {selectedWine.tastings.length > 0 && (
                  <span>logged ×{selectedWine.tastings.length}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {choice.kind === 'new' && <WineFields form={wineForm} />}
      </SectionCard>

      <SectionCard
        title="The Occasion"
        accent="occasion"
        icon={CalendarDays}
        collapsed={!wineChosen}
      >
        <OccasionFields form={tastingForm} photo={photo} onPhotoChange={setPhoto} />
      </SectionCard>

      <SectionCard
        title="The Review"
        accent="review"
        icon={Star}
        collapsed={!wineChosen}
      >
        <RatingNotesFields form={tastingForm} />
      </SectionCard>

      {wineChosen && (
        <Button type="submit" className="w-full sm:w-auto" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save tasting'}
        </Button>
      )}
    </form>
  )
}
