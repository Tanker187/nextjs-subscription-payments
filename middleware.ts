import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only protect authenticated application pages here.
  // Stripe webhooks and public pages must remain accessible.
  matcher: ['/account/:path*']
};
