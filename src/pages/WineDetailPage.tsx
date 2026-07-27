import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ColourVarietalLine, FlavourBadge, RatingBadge } from '@/components/wine-bits'
import { useUserId } from '@/lib/auth'
import { formatCountry, formatPrice, formatWineTitle, TEMP_LABELS, VESSEL_LABELS } from '@/lib/labels'
import { deleteTasting } from '@/lib/mutations'
import { signedUrlsQuery } from '@/lib/photos'
import { wineQuery } from '@/lib/queries/wines'

export function WineDetailPage() {
  const { id } = useParams<{ id: string }>()
  const userId = useUserId()
  const queryClient = useQueryClient()
  const { data: wine, isPending, isError } = useQuery(wineQuery(id!))

  const tastings = useMemo(
    () =>
      [...(wine?.tastings ?? [])].sort((a, b) => b.consumed_on.localeCompare(a.consumed_on)),
    [wine],
  )

  const photoPaths = useMemo(
    () => [...new Set(tastings.map((t) => t.photo_path).filter((p): p is string => p != null))],
    [tastings],
  )
  const { data: photoUrls = {} } = useQuery(signedUrlsQuery(photoPaths))

  const deleteMutation = useMutation({
    mutationFn: ({ tastingId, photoPath }: { tastingId: string; photoPath: string | null }) =>
      deleteTasting(tastingId, photoPath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tastings'] })
      queryClient.invalidateQueries({ queryKey: ['wines'] })
      toast.success('Tasting deleted.')
    },
    onError: (error) => toast.error(error.message),
  })

  if (isPending) return <Skeleton className="h-48 w-full" />
  if (isError || !wine) {
    return <p className="py-16 text-center text-muted-foreground">This wine could not be found.</p>
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold">{formatWineTitle(wine)}</h1>
          {wine.created_by === userId && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/wines/${wine.id}/edit`}>
                <Pencil className="size-4" />
                Edit wine
              </Link>
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">
          {[wine.producer, wine.subregion?.name, wine.region?.name, formatCountry(wine.country)]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <ColourVarietalLine
          colour={wine.colour}
          varietals={wine.wine_varietals}
          className="text-sm"
        />
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            {tastings.length === 1 ? '1 tasting' : `${tastings.length} tastings`}
          </h2>
          <Button asChild size="sm" variant="outline">
            <Link to={`/log?wine=${wine.id}`}>
              <Plus className="size-4" />
              Log this again
            </Link>
          </Button>
        </div>

        <ul className="space-y-3">
          {tastings.map((t) => (
            <li key={t.id} className="space-y-3 rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t.profile.display_name}</span>
                  {t.rating != null && <RatingBadge rating={t.rating} />}
                </div>
                <span className="text-sm text-muted-foreground">{t.consumed_on}</span>
              </div>
              {(t.location || t.vessel || t.serving_temp || t.price != null) && (
                <p className="text-sm text-muted-foreground">
                  {[
                    t.location,
                    t.vessel && VESSEL_LABELS[t.vessel],
                    t.serving_temp && TEMP_LABELS[t.serving_temp],
                    formatPrice(t.price, t.currency),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              {t.tasting_flavours.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {t.tasting_flavours.map((tf) => (
                    <FlavourBadge key={tf.flavour.id} name={tf.flavour.name} />
                  ))}
                </div>
              )}
              {t.notes && <p className="text-sm whitespace-pre-wrap">{t.notes}</p>}
              {t.photo_path && photoUrls[t.photo_path] && (
                <img
                  src={photoUrls[t.photo_path]}
                  alt={`Photo of ${formatWineTitle(wine)}`}
                  className="max-h-72 rounded-md border object-cover"
                />
              )}
              {t.user_id === userId && (
                <div className="flex gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/tastings/${t.id}/edit`}>
                      <Pencil className="size-4" />
                      Edit
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this tasting?</AlertDialogTitle>
                        <AlertDialogDescription>
                          The tasting from {t.consumed_on} will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            deleteMutation.mutate({ tastingId: t.id, photoPath: t.photo_path })
                          }
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
