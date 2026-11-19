# Matamly Customer App — UX Screen Blueprint

## Decision
Design and validate the customer screen flow before implementing the native app shell. Reuse the existing customer ordering behavior and backend; do not redesign business rules or create a parallel checkout.

## Product principles
- Customer-facing app only. Staff and printer controls must never appear in this app.
- Arabic RTL is the default; preserve the existing Arabic/English language toggle.
- Fast ordering: menu and cart remain easy to reach from the home screen.
- Keep current menu data, prices, product options, availability, delivery zones, pickup rules, and payment methods sourced from the existing Matamly backend.
- Do not hard-code restaurant content, prices, delivery fees, or minimum order values in the mobile app.
- Existing website remains available and continues to use the same backend.

## Proposed customer screens

### 1. Launch and loading
- Matamly / restaurant identity and logo.
- Load restaurant configuration and menu.
- Clear retry state if the server is unavailable.
- No fabricated menu or cached prices presented as current when refresh fails.

### 2. Home and menu
- Restaurant logo, name, banner, and current service availability.
- Pickup / delivery selector.
- Category navigation and product cards.
- Search and featured products if supported by existing menu data.
- Persistent cart entry with item count and total.
- Responsive layout for phones and tablets.

### 3. Product details
- Product image, name, description, and current price.
- Required/optional modifiers and special instructions as supported by existing product configuration.
- Quantity selector and add-to-cart action.
- Respect availability and time restrictions from the backend.

### 4. Cart
- Items, quantities, selected options, and notes.
- Edit or remove items.
- Subtotal and any server-provided fees.
- Continue to checkout.

### 5. Checkout
- Customer name and phone.
- **Pickup:** collect only the details required for pickup; do not request a delivery address.
- **Delivery:** select an available delivery area and collect the configured address fields.
- Show delivery fee, minimum order, and final total from trusted server values.
- Payment options exactly as currently enabled by the restaurant.
- Preserve the current server-side validation and order submission endpoint.

### 6. Order confirmation
- Show the canonical order number returned by the server.
- Clear the cart only after confirmed order creation.
- If submission outcome is uncertain, retain the cart and reuse the same clientRequestId on retry to avoid duplicate orders.

### 7. Order tracking and history
- Customer sign-in/account access using existing endpoints.
- List previous orders and their server-reported statuses.
- Order detail with items and total.
- Refresh status reliably; push notifications can be added after the core lifecycle is tested.

### 8. Account and support
- Customer profile and logout.
- Saved addresses only if supported by existing backend.
- Contact/support details from restaurant configuration.

## Navigation
- Bottom navigation: Home, Orders, Account.
- Cart remains a persistent prominent action, not a separate mandatory tab.
- Back navigation must preserve cart and checkout state where safe.
- External payment-provider flows must return to the correct checkout/order state.

## Shared end-to-end order flow
Menu -> Product details -> Cart -> Checkout -> existing `POST /api/orders` -> server-confirmed order number -> Orders/Tracking.
The customer app must not call the printer directly. The restaurant app receives the same server order and owns cashier workflow and printing.

## Implementation sequence
1. Review this screen blueprint against the current customer page and backend contracts.
2. Implement navigation and screen boundaries without changing checkout semantics.
3. Package the customer experience for Android and iOS.
4. Test Arabic RTL, account sessions, pickup and delivery, payment return, and duplicate-submit handling on real devices.
5. Only then add optional push notifications and store-release polish.

## Acceptance checklist
- [ ] All screens use live restaurant/menu configuration.
- [ ] Arabic RTL and English toggle work across all screens.
- [ ] Pickup checkout asks for no delivery address.
- [ ] Delivery fee and minimum order are server-authoritative.
- [ ] Order number is shown only after server confirmation.
- [ ] Retry does not create a duplicate order.
- [ ] Cart is not lost on a transient network error.
- [ ] Customer app contains no cashier, admin, or printer controls.
- [ ] Existing website ordering still works.
