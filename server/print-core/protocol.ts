import crypto from "node:crypto";

export const PRINT_PROTOCOL_VERSION = 1;
export const PRINT_PLATFORMS = ["android", "windows", "macos", "linux"] as const;
export type PrintPlatform = (typeof PRINT_PLATFORMS)[number];
export const PRINT_CONNECTIONS = ["usb", "network", "bluetooth", "system"] as const;
export type PrintConnection = (typeof PRINT_CONNECTIONS)[number];
export const PRINT_STAGES = [
  "queued",
  "claimed",
  "agent_accepted",
  "submitted_to_spooler",
  "printer_acknowledged",
  "paper_confirmed",
  "failed",
  "uncertain",
] as const;
export type PrintStage = (typeof PRINT_STAGES)[number];

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

export function createDeviceCredential() {
  return crypto.randomBytes(32).toString("base64url");
}

export function validPlatform(value: unknown): value is PrintPlatform {
  return typeof value === "string" && (PRINT_PLATFORMS as readonly string[]).includes(value);
}

export function validConnection(value: unknown): value is PrintConnection {
  return typeof value === "string" && (PRINT_CONNECTIONS as readonly string[]).includes(value);
}

export function validStage(value: unknown): value is PrintStage {
  return typeof value === "string" && (PRINT_STAGES as readonly string[]).includes(value);
}

export type PrintJobEnvelope = {
  protocolVersion: 1;
  jobId: number;
  idempotencyKey: string;
  createdAt: string;
  document: { encoding: "utf-8"; contentType: "text/plain"; receiptText: string };
  printer: { printerId: string | null; connectionType: PrintConnection | "system"; commandSet: "escpos" | "os-spool" };
};

export function buildJobEnvelope(input: {
  id: number;
  idempotencyKey: string;
  createdAt: Date | string;
  receiptText: string;
  printerId?: string | null;
  connectionType?: PrintConnection | "system";
  commandSet?: "escpos" | "os-spool";
}): PrintJobEnvelope {
  return {
    protocolVersion: PRINT_PROTOCOL_VERSION,
    jobId: input.id,
    idempotencyKey: input.idempotencyKey,
    createdAt: new Date(input.createdAt).toISOString(),
    document: { encoding: "utf-8", contentType: "text/plain", receiptText: input.receiptText },
    printer: {
      printerId: input.printerId ?? null,
      connectionType: input.connectionType ?? "system",
      commandSet: input.commandSet ?? "os-spool",
    },
  };
}
