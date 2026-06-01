import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
export const STORAGE_BUCKET = 'uploads'

if (!SUPABASE_URL || !SERVICE_KEY) {
  // Surfaced lazily on first upload attempt rather than at import time
  console.warn('[storage] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set')
}

// Server-side client using the service role key (bypasses RLS for uploads).
// Never import this into client components.
export const storageClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/**
 * Upload a file buffer to the public `uploads` bucket and return its public URL.
 * `path` is the object key within the bucket, e.g. "avatars/abc.png".
 */
export async function uploadToStorage(
  path: string,
  body: Buffer | ArrayBuffer | Uint8Array,
  contentType: string,
): Promise<string> {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Хранилище не настроено (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  }
  const { error } = await storageClient.storage
    .from(STORAGE_BUCKET)
    .upload(path, body, { contentType, upsert: true })
  if (error) throw new Error(`Не удалось загрузить файл: ${error.message}`)
  const { data } = storageClient.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** Remove an object from storage given its public URL (best-effort). */
export async function removeFromStorage(publicUrl: string): Promise<void> {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return
  const path = publicUrl.slice(idx + marker.length)
  await storageClient.storage.from(STORAGE_BUCKET).remove([path])
}
