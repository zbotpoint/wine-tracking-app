import imageCompression from 'browser-image-compression'
import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const SIGNED_URL_TTL_SECONDS = 60 * 60

export async function compressPhoto(file: File): Promise<File> {
  return imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 0.5,
    fileType: 'image/jpeg',
  })
}

// Path convention: {user_id}/{tasting_id}/{uuid}.jpg — the first folder is the
// owner's UID, which is what the storage RLS policies check.
export async function uploadTastingPhoto(userId: string, tastingId: string, file: File) {
  const compressed = await compressPhoto(file)
  const path = `${userId}/${tastingId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('wine-photos').upload(path, compressed, {
    contentType: 'image/jpeg',
  })
  if (error) throw error
  return path
}

// One batched signed-URL request per set of visible photos. staleTime stays
// below the URL TTL so a long-lived tab never renders an expired URL.
export const signedUrlsQuery = (paths: string[]) => {
  const sorted = [...paths].sort()
  return queryOptions({
    queryKey: ['photo-urls', sorted],
    queryFn: async () => {
      if (sorted.length === 0) return {}
      const { data, error } = await supabase.storage
        .from('wine-photos')
        .createSignedUrls(sorted, SIGNED_URL_TTL_SECONDS)
      if (error) throw error
      const byPath: Record<string, string> = {}
      for (const entry of data) {
        if (entry.signedUrl && entry.path) byPath[entry.path] = entry.signedUrl
      }
      return byPath
    },
    staleTime: (SIGNED_URL_TTL_SECONDS / 2) * 1000,
    enabled: sorted.length > 0,
  })
}
