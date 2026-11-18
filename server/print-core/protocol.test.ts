import { describe, expect, it } from "vitest";
import {
  buildJobEnvelope,
  createDeviceCredential,
  sha256,
  validConnection,
  validPlatform,
  validStage,
} from "./protocol";

describe("Matamly Universal Print protocol", () => {
  it("creates high-entropy URL-safe device credentials", () => {
    const first = createDeviceCredential();
    const second = createDeviceCredential();
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(sha256(first)).toHaveLength(64);
  });

  it("accepts only supported platform and transport values", () => {
    expect(validPlatform("android")).toBe(true);
    expect(validPlatform("ios")).toBe(false);
    expect(validConnection("usb")).toBe(true);
    expect(validConnection("serial")).toBe(false);
    expect(validStage("paper_confirmed")).toBe(true);
    expect(validStage("done")).toBe(false);
  });

  it("builds a versioned, idempotent job envelope", () => {
    const envelope = buildJobEnvelope({
      id: 41,
      idempotencyKey: "order-12-auto",
      createdAt: "2026-11-18T18:00:00.000Z",
      receiptText: "test receipt",
      printerId: "printer-1",
      connectionType: "usb",
      commandSet: "escpos",
    });
    expect(envelope.protocolVersion).toBe(1);
    expect(envelope.jobId).toBe(41);
    expect(envelope.idempotencyKey).toBe("order-12-auto");
    expect(envelope.document.receiptText).toBe("test receipt");
    expect(envelope.printer.commandSet).toBe("escpos");
  });
});
