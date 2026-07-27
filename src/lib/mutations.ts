import { supabase } from '@/lib/supabase'
import { uploadTastingPhoto } from '@/lib/photos'
import type { WineFormValues } from '@/lib/schemas/wine'
import type { LogTastingValues, TastingFieldsValues } from '@/lib/schemas/tasting'
import type { TablesUpdate } from '@/types/database.types'

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

async function resolveRegionId(wine: WineFormValues): Promise<string | null> {
  if (!wine.region || !wine.countryCode) return null
  if (wine.region.id) return wine.region.id
  const { data, error } = await supabase.rpc('get_or_create_region', {
    p_country: wine.countryCode,
    p_name: wine.region.name,
  })
  if (error) throw error
  return data.id
}

async function resolveSubregionId(
  wine: WineFormValues,
  regionId: string | null,
): Promise<string | null> {
  if (!wine.subregion || !regionId) return null
  if (wine.subregion.id) return wine.subregion.id
  const { data, error } = await supabase.rpc('get_or_create_subregion', {
    p_region: regionId,
    p_name: wine.subregion.name,
  })
  if (error) throw error
  return data.id
}

async function resolveVarietalIds(wine: WineFormValues): Promise<string[]> {
  const ids: string[] = []
  for (const varietal of wine.varietals) {
    if (varietal.id) {
      ids.push(varietal.id)
    } else {
      const { data, error } = await supabase.rpc('get_or_create_varietal', {
        p_name: varietal.name,
      })
      if (error) throw error
      ids.push(data.id)
    }
  }
  return [...new Set(ids)]
}

export async function createWine(values: WineFormValues): Promise<string> {
  const regionId = await resolveRegionId(values)
  const subregionId = await resolveSubregionId(values, regionId)
  const varietalIds = await resolveVarietalIds(values)

  const { data: wine, error } = await supabase
    .from('wines')
    .insert({
      name: values.name.trim(),
      producer: emptyToNull(values.producer),
      vintage: values.vintage,
      country_code: values.countryCode,
      region_id: regionId,
      subregion_id: subregionId,
      colour: values.colour,
    })
    .select('id')
    .single()
  if (error) throw error

  if (varietalIds.length > 0) {
    const { error: junctionError } = await supabase
      .from('wine_varietals')
      .insert(varietalIds.map((varietal_id) => ({ wine_id: wine.id, varietal_id })))
    if (junctionError) throw junctionError
  }
  return wine.id
}

export async function updateWine(wineId: string, values: WineFormValues): Promise<void> {
  const regionId = await resolveRegionId(values)
  const subregionId = await resolveSubregionId(values, regionId)
  const varietalIds = await resolveVarietalIds(values)

  const { error } = await supabase
    .from('wines')
    .update({
      name: values.name.trim(),
      producer: emptyToNull(values.producer),
      vintage: values.vintage,
      country_code: values.countryCode,
      region_id: regionId,
      subregion_id: subregionId,
      colour: values.colour,
    })
    .eq('id', wineId)
  if (error) throw error

  const { error: clearError } = await supabase
    .from('wine_varietals')
    .delete()
    .eq('wine_id', wineId)
  if (clearError) throw clearError

  if (varietalIds.length > 0) {
    const { error: junctionError } = await supabase
      .from('wine_varietals')
      .insert(varietalIds.map((varietal_id) => ({ wine_id: wineId, varietal_id })))
    if (junctionError) throw junctionError
  }
}

async function resolveFlavourIds(fields: TastingFieldsValues): Promise<string[]> {
  const ids: string[] = []
  for (const flavour of fields.flavours) {
    if (flavour.id) {
      ids.push(flavour.id)
    } else {
      const { data, error } = await supabase.rpc('get_or_create_flavour', {
        p_name: flavour.name,
      })
      if (error) throw error
      ids.push(data.id)
    }
  }
  return [...new Set(ids)]
}

async function setTastingFlavours(tastingId: string, flavourIds: string[], replace: boolean) {
  if (replace) {
    const { error } = await supabase
      .from('tasting_flavours')
      .delete()
      .eq('tasting_id', tastingId)
    if (error) throw error
  }
  if (flavourIds.length > 0) {
    const { error } = await supabase
      .from('tasting_flavours')
      .insert(flavourIds.map((flavour_id) => ({ tasting_id: tastingId, flavour_id })))
    if (error) throw error
  }
}

function tastingRow(fields: TastingFieldsValues) {
  return {
    rating: fields.rating,
    consumed_on: fields.consumedOn,
    notes: emptyToNull(fields.notes),
    location: emptyToNull(fields.location),
    vessel: fields.vessel,
    serving_temp: fields.servingTemp,
    price: fields.price,
    currency: fields.price != null ? fields.currency : null,
  }
}

export type LogTastingResult = {
  tastingId: string
  wineId: string
  // The tasting is saved even if the photo upload fails; the caller surfaces
  // this and the edit form can re-attach.
  photoError: Error | null
}

export async function logTasting(
  values: LogTastingValues,
  photo: File | null,
  userId: string,
): Promise<LogTastingResult> {
  const wineId = values.wineMode === 'existing' ? values.wineId : await createWine(values.wine)

  const flavourIds = await resolveFlavourIds(values)

  const { data: tasting, error } = await supabase
    .from('tastings')
    .insert({ wine_id: wineId, ...tastingRow(values) })
    .select('id')
    .single()
  if (error) throw error

  await setTastingFlavours(tasting.id, flavourIds, false)

  let photoError: Error | null = null
  if (photo) {
    try {
      await attachPhoto(tasting.id, userId, photo, null)
    } catch (err) {
      photoError = err instanceof Error ? err : new Error(String(err))
    }
  }
  return { tastingId: tasting.id, wineId, photoError }
}

export async function updateTasting(
  tastingId: string,
  fields: TastingFieldsValues,
  options: { newPhoto: File | null; removePhoto: boolean; currentPhotoPath: string | null },
  userId: string,
): Promise<{ photoError: Error | null }> {
  const flavourIds = await resolveFlavourIds(fields)

  const row: TablesUpdate<'tastings'> = tastingRow(fields)
  if (options.removePhoto && !options.newPhoto) row.photo_path = null

  const { error } = await supabase.from('tastings').update(row).eq('id', tastingId)
  if (error) throw error

  await setTastingFlavours(tastingId, flavourIds, true)

  if (options.removePhoto && !options.newPhoto && options.currentPhotoPath) {
    await removePhotoFile(options.currentPhotoPath)
  }

  let photoError: Error | null = null
  if (options.newPhoto) {
    try {
      await attachPhoto(tastingId, userId, options.newPhoto, options.currentPhotoPath)
    } catch (err) {
      photoError = err instanceof Error ? err : new Error(String(err))
    }
  }
  return { photoError }
}

export async function deleteTasting(tastingId: string, photoPath: string | null): Promise<void> {
  const { error } = await supabase.from('tastings').delete().eq('id', tastingId)
  if (error) throw error
  if (photoPath) await removePhotoFile(photoPath)
}

async function attachPhoto(
  tastingId: string,
  userId: string,
  photo: File,
  previousPath: string | null,
) {
  const path = await uploadTastingPhoto(userId, tastingId, photo)
  const { error } = await supabase
    .from('tastings')
    .update({ photo_path: path })
    .eq('id', tastingId)
  if (error) throw error
  if (previousPath) await removePhotoFile(previousPath)
}

// Best effort: a stray file in storage is harmless and invisible.
async function removePhotoFile(path: string) {
  await supabase.storage.from('wine-photos').remove([path]).catch(() => {})
}
