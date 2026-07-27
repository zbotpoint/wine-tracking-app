import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Captured before createClient consumes (and clears) the URL hash. Invite and
// recovery links land here with tokens; the app redirects those sessions to
// /welcome to set a password.
const hash = typeof window !== 'undefined' ? window.location.hash : ''
export const AUTH_LINK_TYPE: 'invite' | 'recovery' | null = hash.includes('type=invite')
  ? 'invite'
  : hash.includes('type=recovery')
    ? 'recovery'
    : null

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
