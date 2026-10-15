import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionSignature } from '@/lib/security';

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  const userLevel = request.cookies.get('user_level')?.value;
  const sessionSig = request.cookies.get('session_sig')?.value;
  const hasSession = Boolean(sessionToken);
  
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth') || request.nextUrl.pathname === '/register';

  // Jika user sudah login dan mengakses halaman auth
  if (isAuthRoute && hasSession) {
    if (userLevel === 'owner') {
      return NextResponse.redirect(new URL('/owner/dashboard', request.url));
    } else if (userLevel === 'reseller') {
      return NextResponse.redirect(new URL('/reseller/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect legacy /register ke /auth/register
  if (request.nextUrl.pathname === '/register') {
    return NextResponse.redirect(new URL('/auth/register', request.url));
  }

  // Halaman publik tanpa login: '/', /auth/* dan /monitor/*
  if (
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/auth') || 
    request.nextUrl.pathname.startsWith('/monitor')
  ) {
    return NextResponse.next();
  }

  // Jika belum login dan mencoba mengakses halaman protected, arahkan ke login
  if (!hasSession) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Proteksi rute /owner agar HANYA bisa diakses oleh level 'owner' dengan signature yang valid
  if (request.nextUrl.pathname.startsWith('/owner')) {
    const isOwner = userLevel === 'owner';
    const isSigValid = sessionToken && userLevel && sessionSig
      ? verifySessionSignature(sessionToken, userLevel, sessionSig)
      : false;

    // Jika signature tidak valid atau bukan owner, blokir akses
    if (!isOwner || (sessionSig && !isSigValid)) {
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
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
