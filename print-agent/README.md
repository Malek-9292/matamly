# Local print agent

This process is separate from order handling. It asks the server for the next pending receipt, sends that plain-text receipt through the operating system's installed printer, and reports whether the print interface accepted it.

It does not select a printer brand or send vendor command languages. Windows uses `Out-Printer`. Other systems use the `lp` command. Both use whatever printer the operating system already has installed, including USB, network, and Bluetooth printers that already have a driver.

## Setup

1. On the server, set `PRINT_AGENT_TOKEN` to a long random string.
2. On the cashier computer, install Node.js 22 or newer.
3. From this folder run:

```text
set PRINT_AGENT_TOKEN=the-same-token
set MATAMLY_API_BASE=http://SERVER:3000
set PRINTER_NAME=
set PRINT_MODE=spool
node agent.mjs
```

Leave `PRINTER_NAME` empty to use the operating system's default printer. Set it to the exact driver name when the cashier device should use a different installed printer.

`PRINT_MODE=spool` reports success only after the operating-system print command exits successfully. `PRINT_MODE=dialog` opens the system print window and reports failure on purpose, so the order is not marked printed merely because a window opened. `PRINT_MODE=file` writes the receipt and does not mark it printed.

The agent claims each job once. A failed job is retried up to three attempts. After that, staff use manual reprint in the cashier page, which creates a new job. A job that is already printing or printed is not claimed again.

## Android

A phone browser cannot reliably drive an arbitrary USB, network, or Bluetooth printer in the background. Use one of these setups:

- Run this agent on a Windows computer that can reach the printer, and let the Samsung cashier page only display orders.
- If the printer is installed on the phone through the Android print framework, use the cashier's "طباعة عبر نظام التشغيل" button. That path opens the system print interface and does not mark the order printed by itself.

Silent automatic printing still depends on the device granting access to a printer driver. This agent records the command result. It cannot prove that paper left every printer model.


## Universal Print agent (device identity)

New installations should use the registered-device protocol rather than the legacy shared `PRINT_AGENT_TOKEN`:

1. In Admin → إدارة الطباعة, register a Windows device.
2. Add the Windows printer to that device (USB or LAN printer must already be installed in Windows).
3. Copy the one-time device token into the Windows agent environment.
4. Run with Node.js 22+:

```powershell
$env:MATAMLY_API_BASE = "https://YOUR-DEVELOPMENT-HOST"
$env:MATAMLY_DEVICE_TOKEN = "ONE_TIME_DEVICE_TOKEN"
$env:MATAMLY_PRINTER_NAME = "Exact Windows printer name"
node .\\windows-agent.mjs
```

The new agent uses HTTPS, device-specific authentication, heartbeats, persistent local job de-duplication, and reports the exact stage: Windows spooler accepted the job. It does not claim that paper was physically produced. Keep the old `agent.mjs` available for rollback while migrating existing stations.

## Current implementation boundary

The server-side registry and first Windows adapter are being introduced incrementally. Android USB printing, macOS/Linux adapters, printer test workflows, and complete event/history UI must not be treated as supported until their platform builds and hardware tests pass.


## macOS / Linux (CUPS adapter)

The POSIX adapter uses the same device token and HTTPS protocol, with CUPS `lp` for printers installed in the operating system:

```sh
export MATAMLY_API_BASE="https://YOUR-DEVELOPMENT-HOST"
export MATAMLY_DEVICE_TOKEN="ONE_TIME_DEVICE_TOKEN"
export MATAMLY_PRINTER_NAME="Exact CUPS queue name" # optional; defaults to CUPS default
node ./posix-agent.mjs
```

CUPS must already be installed and the selected USB or network printer must be configured as a CUPS queue. This adapter has source code but is not yet verified on real macOS/Linux hosts or printers.
