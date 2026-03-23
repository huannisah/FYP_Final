import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/auth/signin', '/auth/signup', '/auth/error', '/api/auth']
const PROTECTED_PREFIXES = ['/profile']

export default auth((req) => {
  const { nextUrl } = req
  const isPublic = PUBLIC_PATHS.some((path) =>
    path === '/' ? nextUrl.pathname === '/' : nextUrl.pathname.startsWith(path),
  )
  const isProtected = PROTECTED_PREFIXES.some((path) => nextUrl.pathname.startsWith(path))

  if (!isPublic && isProtected && !req.auth) {
    const signInUrl = new URL('/auth/signin', nextUrl.origin)
    signInUrl.searchParams.set('callbackUrl', nextUrl.href)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
