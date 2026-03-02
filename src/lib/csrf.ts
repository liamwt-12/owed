import { NextResponse } from 'next/server'

/**
 * Validates that the request Origin (or Referer) matches the Host header.
 * Returns a 403 response if the check fails, or null if it passes.
 */
export function csrfCheck(request: Request): NextResponse | null {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  if (!host) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (origin) {
    try {
      if (new URL(origin).host === host) return null
    } catch {
      // invalid origin URL
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // No Origin header — fall back to Referer
  const referer = request.headers.get('referer')
  if (referer) {
    try {
      if (new URL(referer).host === host) return null
    } catch {
      // invalid referer URL
    }
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
