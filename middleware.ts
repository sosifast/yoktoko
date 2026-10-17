import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionSignature } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  const userLevel = request.cookies.get('user_level')?.value;
  const sessionSig = request.cookies.get('session_sig')?.value;
  const hasSession = Boolean(sessionToken);
  
  const isAuthRoute = request.nextUrl.pathname === '/login';

  // Jika user sudah login dan mengakses halaman login
  if (isAuthRoute && hasSession) {
    if (userLevel === 'owner') {
      return NextResponse.redirect(new URL('/owner/dashboard', request.url));
    }
  }

  // Jika akses root '/', langsung redirect ke owner dashboard (jika login) atau ke /login
  if (request.nextUrl.pathname === '/') {
    if (hasSession && userLevel === 'owner') {
      return NextResponse.redirect(new URL('/owner/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Halaman publik tanpa login: '/login' dan '/monitor/*'
  if (
    request.nextUrl.pathname === '/login' || 
    request.nextUrl.pathname.startsWith('/monitor')
  ) {
    return NextResponse.next();
  }

  // Jika belum login dan mencoba mengakses halaman protected, arahkan ke login
  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Proteksi rute /owner agar HANYA bisa diakses oleh level 'owner' dengan signature yang valid
  if (request.nextUrl.pathname.startsWith('/owner')) {
    const isOwner = userLevel === 'owner';
    const isSigValid = sessionToken && userLevel && sessionSig
      ? await verifySessionSignature(sessionToken, userLevel, sessionSig)
      : false;

    // Jika signature tidak valid atau bukan owner, blokir akses
    if (!isOwner || (sessionSig && !isSigValid)) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session_token');
      response.cookies.delete('user_level');
      response.cookies.delete('session_sig');
      return response;
    }
  }

  return NextResponse.next();
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
