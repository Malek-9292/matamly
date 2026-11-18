import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);
const base = (process.env.MATAMLY_API_BASE || "").replace(/\/$/, "");
const token = process.env.MATAMLY_DEVICE_TOKEN || "";
const worker = process.env.MATAMLY_DEVICE_NAME || "Matamly Windows Agent";
const printer = process.env.MATAMLY_PRINTER_NAME || "";
const stateDir = path.join(process.env.APPDATA || homedir(), "MatamlyPrint");
const stateFile = path.join(stateDir, "jobs.json");
const seen = new Set();

if (!/^https:\/\//i.test(base)) throw new Error("MATAMLY_API_BASE must be an HTTPS URL.");
if (!token) throw new Error("Set MATAMLY_DEVICE_TOKEN to the one-time paired device credential.");

async function loadState() {
  await mkdir(stateDir, { recursive: true });
  try {
    const saved = JSON.parse(await readFile(stateFile, "utf8"));
    for (const id of Array.isArray(saved.completed) ? saved.completed : []) seen.add(String(id));
  } catch { /* first run */ }
}
async function saveState() {
  await writeFile(stateFile, JSON.stringify({ completed: [...seen].slice(-2000) }), "utf8");
}
async function api(pathname, options = {}) {
  const response = await fetch(base + pathname, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers || {}) },
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `HTTP ${response.status}`);
  return body;
}
async function stage(jobId, stageName, status, message = "") {
  await api(`/api/print/v1/jobs/${jobId}/stage`, {
    method: "POST",
    body: JSON.stringify({ stage: stageName, status, message }),
  });
}
async function spool(receiptText) {
  const temp = path.join(stateDir, `receipt-${Date.now()}.txt`);
  await writeFile(temp, `\uFEFF${receiptText}\r\n`, "utf8");
  const destination = printer ? `-Name '${printer.replaceAll("'", "''")}'` : "";
  await execFileAsync("powershell.exe", [
    "-NoProfile", "-NonInteractive", "-Command",
    `Get-Content -LiteralPath '${temp.replaceAll("'", "''")}' -Encoding UTF8 | Out-Printer ${destination}`,
  ], { timeout: 30000 });
  return temp;
}
async function heartbeat() {
  await api("/api/print/v1/devices/heartbeat", {
    method: "POST",
    body: JSON.stringify({ appVersion: "1.0.0", capabilities: { platform: "windows", transports: ["system-spool"], printerSelection: printer || "default" } }),
  });
}
async function cycle() {
  const { job } = await api("/api/print/v1/jobs/claim");
  if (!job) return;
  const id = String(job.jobId);
  if (seen.has(id)) {
    await stage(job.jobId, "uncertain", "uncertain", "تم استلام المهمة سابقًا على هذا الجهاز؛ تم منع التكرار");
    return;
  }
  await stage(job.jobId, "agent_accepted", "ok", "استلم برنامج Windows المهمة");
  try {
    await spool(job.document.receiptText);
    seen.add(id);
    await saveState();
    await stage(job.jobId, "submitted_to_spooler", "ok", "قبل Windows Print Spooler أمر الطباعة؛ لم يتم تأكيد خروج الورقة من الطابعة");
    console.log(`Order ${job.jobId} accepted by Windows spooler.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await stage(job.jobId, "failed", "failed", message.slice(0, 450));
    console.error(message);
  }
}

await loadState();
console.log(`Matamly Universal Print Windows Agent connected to ${base}`);
for (;;) {
  try {
    await heartbeat();
    await cycle();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
  }
  await new Promise(resolve => setTimeout(resolve, 2500));
}
