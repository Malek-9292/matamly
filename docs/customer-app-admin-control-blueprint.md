# Customer App — Admin Control & Customization Blueprint

## Product decision

The existing admin panel remains the single control center for the website and customer app. The customer app must read the same restaurant configuration and business data as the existing website/backend. Do not create a second set of settings, hard-code restaurant content, or require a developer for routine content and appearance changes.

This document extends `docs/customer-app-ux-blueprint.md`. It does not authorize changing existing behavior or deleting current admin capabilities.

## Admin-controlled areas

### 1. Page and section management
- Configure supported customer-app pages: Home, menu/category views, product details, cart, checkout, order confirmation, order history/tracking, account, and support.
- Show/hide configurable sections and content blocks.
- Change section order where the screen design allows it.
- Configure banners, promotional blocks, featured categories/products, and their destination links.
- Configure images, thumbnails, logos, and other replaceable media.

### 2. Text and localization
- Edit customer-facing labels, headings, descriptions, button text, helper text, notices, and promotional copy.
- Keep Arabic and English values separately editable; Arabic is the default and must retain RTL layout.
- Provide safe fallback text when a translation is missing. Do not expose internal error messages or technical identifiers as customer copy.

### 3. Visual appearance
- Central theme controls for brand colors, page backgrounds, surfaces/cards, primary and secondary buttons, text colors, borders, and accents.
- Configure supported typography choices, font sizes, weights, corner radii, spacing, and image presentation presets.
- Preview changes at supported phone/tablet breakpoints before publishing.
- Keep contrast, legibility, touch target size, and responsive layout safeguards; do not allow settings that make checkout unusable.

### 4. Business settings (preserve existing controls)
All existing settings remain authoritative and editable through the current admin panel, including:
- Restaurant opening hours and service availability.
- Product visibility, availability schedules, and time windows.
- Delivery areas and the existing ability to assign one area or groups of areas to a rule.
- Minimum order value, independently from delivery fees.
- Delivery fee rules.
- Pickup and delivery behavior, payment methods, product catalog, prices, modifiers, and other current settings.

The customer app must display and enforce the current backend values. The minimum order calculation must not include the delivery fee unless the existing backend explicitly defines otherwise.

## Safe boundary: configuration vs. application logic

The admin panel should control customer-facing content, supported layout choices, theme tokens, visibility, ordering, and business settings. It must not be able to rewrite application code, API routes, payment security, authentication, server validation, or order lifecycle rules through arbitrary text or styling.

Some operating-system-owned screens and permission prompts (for example, iOS/Android permission dialogs and payment-provider screens) cannot be freely redesigned by the restaurant admin. Their surrounding in-app screens and explanatory text can be configured where supported.

## Data and architecture requirements

- Website, customer app, restaurant app, and admin panel continue using the same backend and source of truth.
- Store app presentation settings as validated server-side configuration, with versioning and backward-compatible defaults.
- Fetch configuration at launch and refresh it safely; do not ship stale prices, availability, delivery fees, or minimums as authoritative values.
- Keep checkout totals and order eligibility server-authoritative. Client-side display is not a substitute for server validation.
- Configuration changes must not require an app-store release when they only affect supported remote content/theme/layout settings.
- Changes requiring new native capabilities or application code still require a software release.

## Admin workflow

1. Edit content, page sections, or theme in the admin panel.
2. Preview the result on supported mobile screen sizes and in Arabic/English.
3. Validate required fields, contrast, and layout constraints.
4. Publish the configuration.
5. Customer app fetches the new published configuration; website behavior remains intact.
6. Keep a previous published version available for rollback and record who changed what and when.

## Acceptance tests

- [ ] Every existing admin setting continues to work as it does today.
- [ ] A delivery area or group can be selected using the current admin workflow.
- [ ] Minimum order value and delivery fee remain separate settings and calculations.
- [ ] Admin can edit supported page text in Arabic and English.
- [ ] Admin can change supported colors, images, banners, and section visibility/order.
- [ ] Preview reflects the published customer-facing configuration.
- [ ] Publishing a configuration update does not require rebuilding/releasing the app for supported remote settings.
- [ ] Invalid or incomplete configuration falls back safely and cannot break checkout.
- [ ] Server remains authoritative for prices, availability, minimums, delivery fees, payment, and order creation.
- [ ] Existing website and customer ordering continue to work.
- [ ] Native operating-system and third-party payment screens are documented as platform/provider controlled.
