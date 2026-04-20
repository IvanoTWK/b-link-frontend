import { NextRequest, NextResponse } from "next/server";

const REFRESH_COOKIE_NAME = 'refreshToken'
const PROTECTED_PREFIX = ['/donatori', '/operatori', '/dottori', '/admin', '/profilo']
const AUTH_PREFIX = ['/auth']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasRefreshToken = request.cookies.has(REFRESH_COOKIE_NAME)

  const isProtected = PROTECTED_PREFIX.some((prefix) =>
    pathname.startsWith(prefix)
  )

  const isAuthRoute = AUTH_PREFIX.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (isProtected && !hasRefreshToken) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && hasRefreshToken) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|css|js|map)).*)',
  ]
}