import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client (singleton)
export const supabase = createClient(url, anon)

// Server-side admin client (never expose to browser)
export function supabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function signInWithMagicLink(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` }
  })
}

// ── User profile helpers ──────────────────────────────────────────────────────

export type UserProfile = {
  id: string
  email: string
  stripe_customer_id: string | null
  subscription_tier: 'free' | 'creator' | 'visionary' | 'empire'
  subscription_status: string | null
  created_at: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export async function upsertProfile(profile: Partial<UserProfile> & { id: string }) {
  return supabase.from('profiles').upsert(profile, { onConflict: 'id' })
}
