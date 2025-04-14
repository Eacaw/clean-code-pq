import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // We'll handle auth protection in the client components
  // This middleware is just a fallback to ensure no direct access to admin routes
  // The actual auth check happens in the AuthProvider component

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/admin/:path*"],
}
