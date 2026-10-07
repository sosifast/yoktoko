import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Cek apakah ada cookie session_token
  const hasSession = request.cookies.has('session_token');
  
  // Jika user berada di halaman login (root '/')
  if (request.nextUrl.pathname === '/') {
    // Jika sudah login, langsung arahkan ke dashboard
    if (hasSession) {
      return NextResponse.redirect(new URL('/owner/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Pengecualian: izinkan rute monitor untuk diakses tanpa login
  if (request.nextUrl.pathname.startsWith('/monitor')) {
    return NextResponse.next()
  }

  // Jika belum login dan mencoba mengakses halaman selain '/', arahkan kembali ke login
  if (!hasSession) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Tentukan rute mana saja yang akan dicek oleh middleware
export const config = {
  matcher: [
    /*
     * Match semua request path kecuali:
     * - api (API routes, biasanya diproteksi secara terpisah)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
