# Migration Guide: Next.js 14 → 15 & Dependency Updates

This guide covers the breaking changes and migration steps required when upgrading from Next.js 14.2.3 to 15.5.24 along with other major dependency updates.

## Table of Contents
1. [Next.js 14 → 15 Migration](#nextjs-14--15-migration)
2. [Stripe SDK v3 Changes](#stripe-sdk-v3-changes)
3. [Supabase Auth Updates](#supabase-auth-updates)
4. [Testing Checklist](#testing-checklist)

---

## Next.js 14 → 15 Migration

### Key Breaking Changes

#### 1. **React 18 → 19 Compatibility (if using React 19)**
- Currently using React 18.3.1, which is compatible with Next.js 15
- If upgrading to React 19, review component lifecycle changes
- **Action**: No immediate changes needed; stay on React 18 for stability

#### 2. **Server Component Changes**
- Enhanced Server Component support
- Better async component handling
- **Action Review**: Check `/app` directory for component definitions
  ```typescript
  // ✅ Supported - Default in Next.js 15
  export default async function Page() {
    const data = await fetch(...)
    return <div>{data}</div>
  }
  ```

#### 3. **App Router Improvements**
- Turbopack support enhanced
- Better middleware handling
- **Action**: Verify `/middleware.ts` works correctly:
  ```typescript
  // middleware.ts should work without changes
  import { type NextRequest } from 'next/server'
  export function middleware(request: NextRequest) {
    // Your middleware logic
  }
  ```

#### 4. **Font Optimization**
- `next/font` automatically optimizes fonts
- **Action**: Ensure fonts are imported from `next/font`:
  ```typescript
  import { Inter } from 'next/font/google'
  ```

#### 5. **Image Optimization**
- AVIF support disabled by default (security fix)
- If using AVIF, enable explicitly in `next.config.js`:
  ```javascript
  // next.config.js
  module.exports = {
    images: {
      formats: ['image/avif', 'image/webp'],
    },
  }
  ```

#### 6. **Build Output Changes**
- Faster builds with improved caching
- **Action**: Clear `.next` directory before deploying:
  ```bash
  rm -rf .next
  npm run build
  ```

#### 7. **Environment Variables**
- NEXT_PUBLIC_* prefix required for client-side variables
- Server-side vars work without prefix
- **Action**: Verify all env vars in `.env.local`:
  ```
  # ✅ Correct - Accessible in browser
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  
  # ✅ Correct - Server-side only
  STRIPE_SECRET_KEY=sk_...
  SUPABASE_SERVICE_ROLE_KEY=...
  ```

---

## Stripe SDK v3 Changes

### Breaking Changes in @stripe/stripe-js@3.0.0 and stripe@16.0.0

#### 1. **Payment Intent Creation**
```javascript
// ❌ Old (v2)
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000,
  currency: 'usd',
})

// ✅ New (v3) - API unchanged, but requires Node 18+
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000,
  currency: 'usd',
})
```

#### 2. **Webhook Signature Verification**
- API remains mostly the same
- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- **Action**: Verify in `/api/webhooks`:
  ```typescript
  import Stripe from 'stripe'
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  
  export async function POST(req: Request) {
    const sig = req.headers.get('stripe-signature')
    const body = await req.text()
    
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
    // Handle event
  }
  ```

#### 3. **Frontend Integration**
- `@stripe/stripe-js` v3 no longer requires manual initialization
- **Action**: Update Stripe loader:
  ```typescript
  // ✅ Modern approach
  import { loadStripe } from '@stripe/stripe-js'
  
  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  )
  ```

#### 4. **Error Handling**
- Error types remain consistent
- **Action**: Verify error handling in checkout flow remains intact

---

## Supabase Auth Updates

### @supabase/supabase-js 2.116.0 Changes

#### 1. **MFA Recovery Codes (New Feature)**
```typescript
// Now available - MFA recovery codes API
const { data, error } = await supabase.auth.mfa.listEnrolledFactors()
```

#### 2. **Session Management**
- Cookie-based sessions (via @supabase/ssr)
- Refresh token handling improved
- **Action**: Verify middleware refresh logic in `/middleware.ts`:
  ```typescript
  import { createServerClient } from '@supabase/ssr'
  
  export async function middleware(request: NextRequest) {
    let response = NextResponse.next()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    
    await supabase.auth.getSession()
    return response
  }
  ```

#### 3. **Protected Routes**
- `/account` route requires authentication
- Middleware handles redirect to `/signin`
- **Action**: Verify authentication flow:
  ```bash
  1. Visit http://localhost:3000/account (not authenticated)
  2. Should redirect to /signin
  3. Sign in with test credentials
  4. Should redirect back to /account
  ```

#### 4. **Storage versioning (New)**
- Can specify file version in URLs
- **Action**: If using Supabase Storage, versions are now supported

---

## Testing Checklist

### Local Development
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
npm install

# Build
npm run build
# Should complete without errors

# Type checking
npx tsc --noEmit
# Should pass without TypeScript errors

# Linting
npm run lint
# Should pass without eslint errors

# Development server
npm run dev
# Should start on http://localhost:3000
```

### Functionality Tests

- [ ] **Home page loads** - `http://localhost:3000`
- [ ] **Sign-in flow** - Navigate to `/signin`, sign in with test account
- [ ] **Account page** - Visit `/account` (should redirect if not authenticated)
- [ ] **Stripe integration** - Test subscription selection and checkout
- [ ] **Webhook handling** - Use Stripe CLI to test webhooks
  ```bash
  stripe listen --forward-to=localhost:3000/api/webhooks
  stripe trigger payment_intent.succeeded
  ```
- [ ] **Sign-out** - Sign out and verify redirect to `/signin`
- [ ] **Session persistence** - Refresh page and verify session maintained
- [ ] **Browser console** - No errors or warnings in DevTools

### Environment Variables to Verify

```bash
# .env.local should contain:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

---

## Rollback Instructions

If issues arise after upgrade, rollback to previous version:

```bash
# Revert to main branch
git checkout main
git reset --hard main

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
npm install

# Restart
npm run dev
```

---

## Getting Help

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Stripe SDK Documentation](https://stripe.com/docs/stripe-js)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

---

## Performance Improvements

After upgrading, you should see:
- ✅ Faster build times (Turbopack improvements)
- ✅ Better runtime performance
- ✅ Improved security posture
- ✅ Better TypeScript support
