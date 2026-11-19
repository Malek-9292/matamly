# Matamly Customer + Restaurant Apps — Implementation Plan

## Product outcome

Matamly will ship as two connected mobile apps backed by the existing Matamly server and database:

1. **Customer app (Android + iOS):** browse the existing restaurant menu, build a cart, choose pickup or delivery, submit orders, and follow order status.
2. **Restaurant app (Android first):** staff sign-in, live order inbox, order status management, and automatic receipt printing through supported printer transports.

The customer and restaurant apps are separate products and app identities. They are not one app with customer/staff modes exposed to everyone.

## Preserve the existing platform

- Keep the current web ordering experience available.
- Keep the existing server, authentication, order APIs, admin panel, menu/catalog, settings, and database.
- Do not create a second order database or duplicate business rules in mobile clients.
- All order totals, delivery fees, availability, and order validation remain server-authoritative.
- Do not change production deployment configuration as part of mobile scaffolding.

## Current repository findings (development)

- The customer ordering UI and cart flow currently live in `client/src/pages/Home.tsx`.
- The cashier UI currently lives in `client/src/pages/Cashier.tsx`.
- `client/src/App.tsx` routes `/` to customer ordering and `/cashier` to the cashier.
- The existing Android work in `android-print/` is a restaurant-side Android shell with printer service integration; it is not a customer app.
- PR #1 is a draft targeting `development`. Its physical printer and background-operation checks remain outstanding.

## Architecture decision

### Customer app
Use the existing React customer experience as the first mobile client, packaged with a maintained native container (Capacitor is the proposed route after checking dependency and build compatibility). Add native navigation/status-bar/safe-area handling and push-notification capability only after the core order lifecycle is stable. Keep the same server APIs and customer web flow.

### Restaurant app
Continue the Android-native host for reliable USB host access and foreground printing service. Embed the cashier experience, but expose only the cashier route in this app. Printer integrations remain behind transport adapters:
- USB ESC/POS
- LAN/Wi-Fi TCP ESC/POS
- Bluetooth Classic SPP ESC/POS
- manufacturer SDK adapters for built-in POS printers (e.g. Sunmi/iMin) when their exact model/SDK is identified.

### Shared backend
Both apps use the same HTTPS backend. Customer submission creates one canonical order. The restaurant app receives that order through the existing order channel and queues its print job. Idempotency and server-side order IDs must prevent duplicate orders and duplicate print jobs.

## Delivery phases

1. **Baseline and safety:** verify development branch, PR #1, server order lifecycle, current customer checkout, and CI status. Keep all changes on feature branches.
2. **Customer mobile shell:** package the existing customer experience for Android and iOS; preserve deep links, cart, checkout, Arabic RTL, currency formatting, and pickup/delivery rules.
3. **Restaurant app integration:** complete cashier shell + printer service integration; add robust reconnect, permission recovery, foreground-service handling, and per-device printer setup.
4. **End-to-end workflow:** customer submits a test order -> server stores it once -> restaurant app receives it -> printer produces receipt -> cashier updates status -> customer sees status.
5. **Compatibility and release:** test real devices across Android vendors and iPhone models; configure signing, privacy disclosures, store assets, and store submissions only after approval.

## Non-negotiable acceptance criteria

- A customer can install the customer app independently of the restaurant app.
- An order submitted by the customer appears on the restaurant device without manual refresh.
- A single order ID is preserved from checkout through cashier and print records.
- Retrying network requests cannot create duplicate orders.
- The app does not claim a receipt physically printed based only on a successful network send.
- Pickup checkout does not require a delivery address; delivery validation and minimum-order rules remain server-side.
- Existing web ordering and admin workflows continue to work.
- Android compatibility is tested on actual devices; no claim of universal support without device evidence.
- iOS customer app is supported; iOS printer support is not part of the restaurant printer scope.

## Explicit exclusions for this phase

- No App Store / Google Play submission yet.
- No migration or replacement of the production database.
- No forced merge of draft PR #1.
- No promise that every Chinese POS built-in printer works without its manufacturer SDK.
