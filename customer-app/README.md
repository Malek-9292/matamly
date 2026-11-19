# Matamly Customer App

This package defines the native Android/iOS shell for the customer ordering experience. It reuses the existing customer UI and backend rather than duplicating cart, checkout, pricing, delivery rules, customer accounts, or order APIs.

## Current integration

- The customer experience is the existing root route (`/`) in `client/src/pages/Home.tsx`.
- Customer checkout submits to the existing same-origin `POST /api/orders` endpoint.
- The request includes a `clientRequestId` so a retry can be recognized as the same checkout attempt.
- The restaurant cashier and printer app remain a separate application.
- The Capacitor shell loads the deployed Matamly HTTPS origin. This is intentional for the first integration: the current customer code uses relative `/api` URLs and same-origin customer sessions.

## Local setup

1. From the repository root, run `pnpm install`.
2. Set `MATAMLY_SERVER_URL` to the deployed Matamly HTTPS origin (for example, the actual production host configured for this restaurant). Do not guess or hard-code a preview URL.
3. Install this package's dependencies: `pnpm --dir customer-app install`.
4. Add native projects once on a machine with the required SDKs:
   - `pnpm --dir customer-app exec cap add android`
   - `pnpm --dir customer-app exec cap add ios`
5. Sync the native projects:
   - `pnpm --dir customer-app exec cap sync`
6. Open Android Studio or Xcode using the scripts in this package.

## Important limitations

- This is the initial hybrid-app shell configuration, not a fully offline bundled application. It loads the configured HTTPS Matamly origin so existing same-origin APIs and session cookies continue to work.
- Android builds require Android Studio / Android SDK.
- iOS builds and signing require macOS with Xcode.
- Native Android/iOS project folders have not yet been generated or built.
- No server URL, customer credentials, printer tokens, admin routes, or server secrets are committed.
- Before store submission, implement and verify native navigation, safe areas, external-link and payment-return handling, customer session persistence, privacy disclosures, push notifications, and real-device checkout.
- A signed APK/IPA and store-ready release do not exist yet.
