import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// GEO-RESTRICTION DISABLED - Game is available worldwide
// To enable restrictions, set DISABLE_GEO_RESTRICTION to false
const DISABLE_GEO_RESTRICTION = true

// List of countries to BLOCK (restrict access) - Empty by default
const BLOCKED_COUNTRIES: string[] = []

// Cloudflare headers for geo information
function getCountryFromHeaders(request: NextRequest): string | null {
  // Try Cloudflare
  const cfCountry = request.headers.get('cf-ipcountry')
  if (cfCountry && cfCountry !== 'XX') {
    return cfCountry
  }

  // Try Vercel
  const vercelCountry = request.headers.get('x-vercel-ip-country')
  if (vercelCountry && vercelCountry !== 'XX') {
    return vercelCountry
  }

  return null
}

// Check if request is from local network (for mobile testing)
function isLocalNetwork(request: NextRequest): boolean {
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   request.headers.get('cf-connecting-ip') || ''

  if (clientIP.includes('127.0.0.1') || clientIP.includes('localhost') || clientIP.includes('::1')) {
    return true
  }

  const localIPPatterns = [
    /^192\.168\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^127\./,
    /^localhost$/i,
  ]

  for (const pattern of localIPPatterns) {
    if (pattern.test(clientIP.trim())) {
      return true
    }
  }

  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Skip the blocked page itself
  if (pathname.startsWith('/blocked')) {
    return NextResponse.next()
  }

  // Allow local network access
  if (isLocalNetwork(request)) {
    return NextResponse.next()
  }

  // Geo-restriction disabled - allow all
  if (DISABLE_GEO_RESTRICTION) {
    return NextResponse.next()
  }

  const country = getCountryFromHeaders(request)

  // If we couldn't determine the country, allow access
  if (!country) {
    return NextResponse.next()
  }

  // Check if the country is blocked
  if (BLOCKED_COUNTRIES.includes(country.toUpperCase())) {
    return NextResponse.redirect(new URL('/blocked', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}

