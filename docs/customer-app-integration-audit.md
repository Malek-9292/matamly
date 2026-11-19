# Customer App Integration Audit — Existing Admin and Backend

**Branch:** `feature/unified-android-cashier`  
**Status:** Repository inspection only; no production code or database changes made.

## Verified existing integration points

### Customer experience
- The existing customer ordering experience is the root route in `client/src/pages/Home.tsx`.
- `client/src/App.tsx` keeps customer, admin, cashier, and management routes in the existing web application.
- Customer orders use the existing `POST /api/orders` endpoint. The customer app must reuse this flow rather than implement a second checkout.
- The existing customer page already reads delivery areas and displays delivery fee and minimum-order information separately.

### Central settings API
- `GET /api/settings` returns the current settings document and revision with cache disabled.
- `PUT /api/settings` is admin-only and uses a revision check; stale writes return HTTP 409 rather than silently overwriting newer settings.
- `shared/settings.ts` defines the allow-list of shared `matamly_*` settings. It already includes many current presentation settings: restaurant name, hours, banner, logo, phone numbers, theme colors, footer, category order/images, featured/offer/hero visibility and content, and related layout values.
- The admin UI hydrates shared settings from `/api/settings` into browser local storage and saves through the existing settings API. Do not treat browser local storage itself as the cross-device source of truth.
- Any new app presentation setting must be added through a validated shared-settings contract and persisted through the existing server settings mechanism. Do not create a second app-only settings store unless a concrete requirement proves it necessary.

### Delivery rules
- `GET /api/delivery-areas` exposes currently available areas with fee, minimum order, and group name.
- The admin delivery UI uses `/api/admin/delivery`, `/api/admin/areas`, and `/api/admin/groups`.
- Both an individual area and a group have separate `minimumOrder` and `deliveryFee` values.
- Groups accept multiple `areaIds`; the current admin interface prevents an area from belonging to more than one group.
- Preserve this existing area/group workflow and server-side order validation. Do not calculate minimum eligibility by adding the delivery fee to the food subtotal.

### Current customer-app shell
- `customer-app/` currently contains a Capacitor package manifest, config, and setup guide; it does not yet contain generated Android/iOS native projects.
- The current Capacitor config uses `MATAMLY_SERVER_URL` and a remote HTTPS origin because the web customer code uses relative `/api` paths and same-origin sessions.
- This is a remote hybrid shell, not an offline bundled app. Do not describe it as store-ready or offline-capable.
- The customer-app package is not currently listed in `pnpm-workspace.yaml`; dependency installation/lockfile handling must be resolved before adding automated native builds.
- The only inspected workflow builds the separate Android cashier/printer app. It does not build the customer app.

## Implementation decisions

1. Keep the existing website, admin panel, cashier, database, API routes, delivery rules, and order lifecycle intact.
2. Reuse the existing `/api/settings` revisioned settings document for supported customer-facing app presentation controls.
3. Extend the shared settings allow-list only for settings that do not already exist; avoid duplicate keys and duplicate admin controls.
4. Add an app preview/publish workflow only after confirming how the current admin persists each setting and how the customer UI consumes it.
5. Keep platform-owned permission dialogs and third-party payment UI outside restaurant-admin theming.
6. Keep server-side prices, product availability, delivery minimums/fees, payment validation, and order creation authoritative.
7. Resolve the package/workspace/lockfile and native-project setup before claiming that Android/iOS builds are available.

## Required regression checks

- Existing website settings still load and save with revision conflict protection.
- Changes made from one admin device appear on a second browser/device after refreshing server settings.
- A single delivery area and a multi-area group preserve independent minimum-order and delivery-fee values.
- Customer checkout still applies server-side order rules and does not trust client-only calculations.
- Website and cashier routes remain unaffected by customer-app packaging changes.
- No native build or store-release claim is made until a real build and device test succeed.
