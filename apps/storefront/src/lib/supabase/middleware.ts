import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import type { Database } from '@jeyjo/database-types'

import { getSupabaseAnonKey, getSupabaseUrl } from './env'

export type SessionRefreshResult = {
  response: NextResponse
  userId: string | null
}

export async function updateSession(request: NextRequest): Promise<SessionRefreshResult> {
  let response = NextResponse.next({ request })

  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) {
    return { response, userId: null }
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, userId: user?.id ?? null }
}
