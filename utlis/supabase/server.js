import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const AUTH_TOKEN_PATH = '/auth/v1/token'

export async function createClient() {
  const cookieStore = await cookies()

  let supabase
  const fetchWithAuthRetry = async (input, init) => {
    const retryInput = input instanceof Request ? input.clone() : input
    const response = await fetch(input, init)
    const requestUrl = typeof input === 'string' ? input : input.url
    let isRlsPolicyError = false

    if (response.status !== 401 && response.status !== 403) {
      const responseBody = await response.clone().json().catch(() => null)
      isRlsPolicyError = responseBody?.code === '42501'
    }

    if (
      (![401, 403].includes(response.status) && !isRlsPolicyError) ||
      requestUrl.includes(AUTH_TOKEN_PATH)
    ) {
      return response
    }

    const { error } = await supabase.auth.refreshSession()

    if (error) {
      console.error('Unable to refresh the session after an unauthorized response:', error.message)
      return response
    }

    return fetch(retryInput, init)
  }

  supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        fetch: fetchWithAuthRetry,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  return supabase
}