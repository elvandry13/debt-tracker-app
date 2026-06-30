import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // Jika user belum login, redirect ke /login (kecuali halaman login itu sendiri)
  if (!user && pathname !== "/login") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jika user sudah login dan mencoba akses /login, redirect ke dashboard
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Jika tidak ada user setelah semua pengecekan, lanjutkan
  if (!user) {
    return supabaseResponse;
  }

  // Proteksi route /payments/new — hanya ADMIN
  if (pathname.startsWith("/payments/new")) {
    try {
      const { data: userRecord, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !userRecord || userRecord.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Proteksi route /admin/* — hanya ADMIN
  if (pathname.startsWith("/admin")) {
    try {
      const { data: userRecord, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !userRecord || userRecord.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match semua request path kecuali:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.json, icons/
     * - file statis di public/
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.svg$).*)",
  ],
};