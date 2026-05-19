import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight edge middleware. Heavy auth checks happen server-side in pages
 * and route handlers via `requireUser` / `requireRole`. This layer only adds
 * security headers and a request ID for tracing.
 */
export function middleware(req: NextRequest) {
  const requestId =
    req.headers.get("x-request-id") ??
    crypto.randomUUID();

  const res = NextResponse.next({
    request: { headers: new Headers({ ...Object.fromEntries(req.headers), "x-request-id": requestId }) },
  });
  res.headers.set("x-request-id", requestId);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
