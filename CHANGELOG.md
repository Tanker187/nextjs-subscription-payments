# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Security
- **CRITICAL**: Fixed Unauthenticated Remote Code Execution on Windows-hosted servers (GHSA-p293-qw3h-jr36)
- **CRITICAL**: Fixed Unauthenticated Remote Code Execution in Image Optimization API when AVIF files are used (GHSA-2xp9-vwfh-vxw4)
- Fixed ReDoS vulnerability in picomatch glob patterns (CVE-2026-33671)
- Fixed POSIX character class injection in picomatch (CVE-2026-33672)
- Fixed prototype pollution vulnerabilities in multiple dependencies
- Fixed DoS vulnerabilities in js-yaml, nanoid, qs, and tar packages
- Improved protection against quadratic complexity attacks in YAML parsing

### Changed
- **MAJOR**: Upgraded Next.js from 14.2.3 to 15.5.24
  - See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for breaking changes
  - Turbopack improvements and stability enhancements
  - Better performance and security defaults
  
- Updated @supabase/supabase-js from 2.43.4 to 2.116.0
  - Added MFA recovery codes API
  - Storage versionId support for create URL methods
  - Session refresh improvements
  
- Updated Stripe dependencies
  - @stripe/stripe-js from 2.4.0 to 3.0.0
  - stripe from 14.25.0 to 16.0.0
  - See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for API changes
  
- Updated PostCSS from 8.4.38 to 8.5.28
  - Fixed type regressions
  - Improved comment handling
  
- Updated supporting dependencies with security patches:
  - brace-expansion: 1.1.11 → 1.1.18
  - browserslist: 4.23.0 → 4.28.9
  - flatted: 3.2.9 → 3.4.4
  - js-yaml: 4.1.0 → 4.3.2
  - minimatch: 3.1.2 → 3.1.5
  - nanoid: 3.3.7 → 3.3.19
  - picomatch: 2.3.1 → 2.3.2
  - qs: 6.11.2 → 6.16.0
  - tar: 7.2.0 → 7.4.3

### Fixed
- Resolved all peer dependency conflicts
- Fixed TypeScript configuration compatibility with updated packages
- Improved ESLint configuration alignment with Next.js 15

## Testing Checklist

Before deploying, verify:

- [ ] `npm install` completes without errors
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run dev` starts without errors
- [ ] Supabase Auth flows work (sign-in, sign-up, sign-out)
- [ ] Stripe webhook integration functional
- [ ] Account page loads with protected routes
- [ ] No console errors in browser dev tools

## Deployment Notes

1. **Run full dependency install**: `rm -rf node_modules pnpm-lock.yaml && npm install`
2. **Test environment variables**: Ensure all Supabase and Stripe keys are configured
3. **Verify Supabase session**: Check cookie-based SSR authentication is working
4. **Monitor error tracking**: Watch for any runtime errors after deployment
5. **Test in staging first**: Recommend testing in a staging environment before production

## Migration Required

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for:
- Next.js 14 → 15 API changes
- Stripe SDK v3 breaking changes
- Supabase Auth updates
