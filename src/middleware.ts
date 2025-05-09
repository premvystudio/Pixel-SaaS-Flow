import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/test-blob-upload",
  "/api/design"
]);

export default clerkMiddleware((req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin') || '*';
    const response = new NextResponse(null, { 
      status: 204,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
      }
    });
    return response;
  }
  
  // Allow public routes to proceed without authentication
  if (publicRoutes(req)) {
    return NextResponse.next();
  }
  
  // For protected routes, check authentication status from the request
  const { userId } = req.auth;
  if (!userId) {
    return req.auth.redirectToSignIn({ returnBackUrl: req.url });
  }
  
  // User is authenticated, allow request to proceed
  return NextResponse.next();
});

// Use the recommended matcher configuration from both Clerk and Next.js docs
export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};