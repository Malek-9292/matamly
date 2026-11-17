# مطعمي — فتوش الخالدية

Restaurant ordering system for pickup and delivery. Customers submit orders to the server. Cashiers see the same orders, and a separate local print agent sends receipts through the operating system's installed printer.

## Run locally

1. Install Node.js 22 or newer and MySQL 8 or MariaDB.
2. Create a database named `matamly`.
3. Copy `.env.example` to `.env` and replace every placeholder. Use a different admin password, cashier password, and print token.
4. Install dependencies:

```text
corepack enable
corepack prepare pnpm@10.18.0 --activate
corepack pnpm install
```

On Windows, `corepack enable` can fail without administrator rights. `corepack pnpm` still works after `corepack prepare`.

5. Apply the schema and import `data/matamly.json` when that file exists:

```text
pnpm db:migrate
```

The server also does this on startup. The import runs once. Existing menu products, settings, inventory, expenses, and orders in that JSON file are copied. When no JSON file exists, the 133 products already stored in the project are loaded, and the restaurant's existing delivery-area list is loaded with its current fees. No sample prices are added.

6. Start the app:

```text
pnpm dev
```

Open `http://localhost:3000`. Admin: `/admin`. Cashier: `/cashier`. Inventory and reports: `/management`.

Production:

```text
pnpm build
pnpm start
```

Docker Compose starts MySQL and the app after `.env` is filled in:

```text
docker compose up -d --build
```

## Printing

Order processing never talks to a printer brand. It stores a print job. `print-agent/README.md` explains how to run the local agent on the cashier computer. The agent uses the operating system's default printer, or `PRINTER_NAME` when another installed printer should be used. A job is marked printed only after that agent reports success. The cashier page can also open the system print dialog; that dialog alone does not mark the order printed.

## Checks

```text
pnpm check
pnpm test
pnpm build
```

Set `DATABASE_URL` before `pnpm test` to run the database integration test. Without it, that test is skipped and the result says so.

## Data safety

Do not commit `.env` or `data/matamly.json`. Customer orders live in MySQL after migration. Keep a backup of the database and of the original JSON file until the first orders have been checked in the cashier screen.
