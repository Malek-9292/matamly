# Matamly Customer App

This package is the native customer-app shell for Android and iOS. It reuses the existing customer ordering web build instead of duplicating cart, checkout, pricing, delivery rules, customer accounts, or order APIs.

## Current integration

- The customer experience is the existing root route (`/`) in `client/src/pages/Home.tsx`.
- The web application is built by the repository root build command into `dist/public`.
- The native shell loads that built customer experience.
- Customer orders continue to use the existing Matamly backend and database.
- The restaurant cashier and printer app remain a separate application.

## Local setup

1. From the repository root, run `pnpm install`.
2. Build the web client: `pnpm build`.
3. Install this package's dependencies: `pnpm --dir customer-app install`.
4. Add native projects once on a machine with the required SDKs:
   - `pnpm --dir customer-app exec cap add android`
   - `pnpm --dir customer-app exec cap add ios`
5. Sync the built customer app:
   - `pnpm --dir customer-app exec cap sync`
6. Open Android Studio or Xcode using the scripts in this package.

## Important

- Android builds require Android Studio / Android SDK.
- iOS builds and signing require macOS with Xcode.
- The app requires a reachable HTTPS Matamly server; no server URL or credentials are hard-coded here.
- Do not embed staff credentials, printer tokens, admin routes, or server secrets in the customer app.
- This is the initial native shell configuration, not a signed APK/IPA and not a store-ready release.
- Before store submission, verify external-link handling, customer authentication persistence, payment provider return URLs, privacy disclosures, push notification behavior, and real-device checkout.
