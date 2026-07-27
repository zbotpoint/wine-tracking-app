import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CalendarDays, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionCard } from '@/components/section-card'
import { OccasionFields, RatingNotesFields } from '@/components/tasting-fields'
import { useUserId } from '@/lib/auth'
import { formatWineTitle } from '@/lib/labels'
import { updateTasting } from '@/lib/mutations'
import { signedUrlsQuery } from '@/lib/photos'
import { tastingQuery } from '@/lib/queries/tastings'
import { tastingFieldsSchema, type TastingFieldsValues } from '@/lib/schemas/tasting'
import { rememberCurrency } from '@/lib/preferences'

export function TastingEditPage() {
  const { id } = useParams<{ id: string }>()
  const userId = useUserId()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: tasting, isPending, isError } = useQuery(tastingQuery(id!))

  const [photo, setPhoto] = useState<File | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)

  const { data: photoUrls = {} } = useQuery(
    signedUrlsQuery(tasting?.photo_path ? [tasting.photo_path] : []),
  )

  const form = useForm<TastingFieldsValues>({
    resolver: zodResolver(tastingFieldsSchema),
    defaultValues: {
      rating: null,
      flavours: [],
      consumedOn: '',
      notes: '',
      location: '',
      vessel: null,
      servingTemp: null,
      price: null,
      currency: 'CAD',
    },
  })

  useEffect(() => {
    if (tasting) {
      form.reset({
        rating: tasting.rating,
        flavours: tasting.tasting_flavours.map((tf) => ({
          id: tf.flavour.id,
          name: tf.flavour.name,
        })),
        consumedOn: tasting.consumed_on,
        notes: tasting.notes ?? '',
        location: tasting.location ?? '',
        vessel: tasting.vessel,
        servingTemp: tasting.serving_temp,
        price: tasting.price,
        currency: tasting.currency ?? 'CAD',
      })
    }
  }, [tasting, form])

  const mutation = useMutation({
    mutationFn: (values: TastingFieldsValues) =>
      updateTasting(
        tasting!.id,
        values,
        { newPhoto: photo, removePhoto, currentPhotoPath: tasting!.photo_path },
        userId!,
      ),
    onSuccess: ({ photoError }, values) => {
      queryClient.invalidateQueries({ queryKey: ['tastings'] })
      queryClient.invalidateQueries({ queryKey: ['wines'] })
      queryClient.invalidateQueries({ queryKey: ['photo-urls'] })
      queryClient.invalidateQueries({ queryKey: ['flavours'] })
      rememberCurrency(values.currency)
      if (photoError) {
        toast.warning('Saved, but the photo failed to upload. Try attaching it again.')
      } else {
        toast.success('Tasting updated.')
      }
      navigate(`/wines/${tasting!.wine_id}`)
    },
    onError: (error) => toast.error(error.message),
  })

  if (isPending) return <Skeleton className="h-48 w-full" />
  if (isError || !tasting) {
    return <p className="py-16 text-center text-muted-foreground">This tasting could not be found.</p>
  }
  if (tasting.user_id !== userId) {
    return <p className="py-16 text-center text-muted-foreground">Only the owner can edit a tasting.</p>
  }

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-semibold">Edit tasting</h1>
        <p className="text-sm text-muted-foreground">{formatWineTitle(tasting.wine)}</p>
      </div>

      <SectionCard title="The Occasion" accent="occasion" icon={CalendarDays}>
        <OccasionFields
          form={form}
          photo={photo}
          onPhotoChange={(file) => {
            setPhoto(file)
            if (file) setRemovePhoto(false)
          }}
          existingPhotoUrl={tasting.photo_path ? photoUrls[tasting.photo_path] : null}
          removeExisting={removePhoto}
          onRemoveExistingChange={setRemovePhoto}
        />
      </SectionCard>

      <SectionCard title="The Review" accent="review" icon={Star}>
        <RatingNotesFields form={form} />
      </SectionCard>

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
