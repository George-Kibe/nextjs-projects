import { clerkMiddleware } from '@clerk/nextjs/server';

// Makes Clerk's auth state available to server code (`auth()`, `currentUser()`).
// Route protection itself happens in `app/(root)/layout.tsx`.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
