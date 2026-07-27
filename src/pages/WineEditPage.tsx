import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { WineFields } from '@/components/wine-fields'
import { useUserId } from '@/lib/auth'
import { updateWine } from '@/lib/mutations'
import { wineQuery } from '@/lib/queries/wines'
import { EMPTY_WINE_FORM, wineFormSchema, type WineFormValues } from '@/lib/schemas/wine'

export function WineEditPage() {
  const { id } = useParams<{ id: string }>()
  const userId = useUserId()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: wine, isPending, isError } = useQuery(wineQuery(id!))

  const form = useForm<WineFormValues>({
    resolver: zodResolver(wineFormSchema),
    defaultValues: EMPTY_WINE_FORM,
  })

  useEffect(() => {
    if (wine) {
      form.reset({
        name: wine.name,
        producer: wine.producer ?? '',
        vintage: wine.vintage,
        countryCode: wine.country_code,
        region: wine.region ? { id: wine.region.id, name: wine.region.name } : null,
        subregion: wine.subregion ? { id: wine.subregion.id, name: wine.subregion.name } : null,
        varietals: wine.wine_varietals.map((wv) => ({
          id: wv.varietal.id,
          name: wv.varietal.name,
        })),
        colour: wine.colour,
      })
    }
  }, [wine, form])

  const mutation = useMutation({
    mutationFn: (values: WineFormValues) => updateWine(wine!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tastings'] })
      queryClient.invalidateQueries({ queryKey: ['wines'] })
      queryClient.invalidateQueries({ queryKey: ['regions'] })
      queryClient.invalidateQueries({ queryKey: ['varietals'] })
      toast.success('Wine updated.')
      navigate(`/wines/${wine!.id}`)
    },
    onError: (error) => toast.error(error.message),
  })

  if (isPending) return <Skeleton className="h-48 w-full" />
  if (isError || !wine) {
    return <p className="py-16 text-center text-muted-foreground">This wine could not be found.</p>
  }
  if (wine.created_by !== userId) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        Only whoever added a wine can edit it.
      </p>
    )
  }

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="space-y-6"
    >
      <h1 className="text-xl font-semibold">Edit wine</h1>
      <WineFields form={form} />
      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
