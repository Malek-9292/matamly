import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);
const base = (process.env.MATAMLY_API_BASE || "http://127.0.0.1:3000").replace(/\/$/, "");
const token = process.env.PRINT_AGENT_TOKEN || "";
const worker = process.env.PRINT_WORKER_NAME || "local-agent";
const printer = process.env.PRINTER_NAME || "";
const mode = process.env.PRINT_MODE || (process.platform === "win32" ? "spool" : "system");

if (!token) {
  console.error("Set PRINT_AGENT_TOKEN to the same value as the server.");
  process.exit(1);
}

function quote(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

async function sendToOperatingSystem(receiptText) {
  const folder = await mkdtemp(path.join(tmpdir(), "matamly-receipt-"));
  const file = path.join(folder, "receipt.txt");
  await writeFile(file, `\uFEFF${receiptText}\n`, "utf8");
  if (mode === "file") return { ok: false, error: `تم حفظ الإيصال فقط في ${file}. حدّد PRINT_MODE=spool للطباعة.` };
  if (mode === "dialog") {
    if (process.platform === "win32") await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `Start-Process -FilePath ${quote(file)} -Verb Print`]);
    return { ok: false, error: "فُتحت واجهة الطباعة في نظام التشغيل. لم يُسجَّل الطلب كمطبوع لأن النظام لم يؤكد اكتمال الطباعة." };
  }
  if (process.platform === "win32") {
    const destination = printer ? `-Name ${quote(printer)}` : "";
    await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `Get-Content -LiteralPath ${quote(file)} -Encoding UTF8 | Out-Printer ${destination}`]);
    return { ok: true };
  }
  const args = printer ? ["-d", printer, file] : [file];
  await execFileAsync("lp", args);
  return { ok: true };
}

async function api(urlPath, options = {}) {
  const response = await fetch(`${base}${urlPath}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Print-Worker": worker,
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `HTTP ${response.status}`);
  return body;
}

async function cycle() {
  const { job } = await api("/api/print-agent/jobs/claim");
  if (!job) return false;
  console.log(`Printing order ${job.orderNumber} (job ${job.id}, attempt ${job.attempts})`);
  try {
    const result = await sendToOperatingSystem(job.receiptText);
    await api(`/api/print-agent/jobs/${job.id}/result`, { method: "POST", body: JSON.stringify(result) });
    if (!result.ok && job.attempts < 3) {
      await api(`/api/print-agent/jobs/${job.id}/retry`, { method: "POST", body: "{}" }).catch((error) => console.error(error.message));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "print failed";
    await api(`/api/print-agent/jobs/${job.id}/result`, { method: "POST", body: JSON.stringify({ ok: false, error: message }) }).catch(() => undefined);
    if (job.attempts < 3) await api(`/api/print-agent/jobs/${job.id}/retry`, { method: "POST", body: "{}" }).catch(() => undefined);
  }
  return true;
}

console.log(`Matamly print agent watching ${base} via the operating-system print interface (${mode}).`);
for (;;) {
  try { await cycle(); } catch (error) { console.error(error instanceof Error ? error.message : error); }
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
