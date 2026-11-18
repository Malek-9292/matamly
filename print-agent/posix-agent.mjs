import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);
const base = (process.env.MATAMLY_API_BASE || "").replace(/\/$/, "");
const token = process.env.MATAMLY_DEVICE_TOKEN || "";
const printer = process.env.MATAMLY_PRINTER_NAME || "";
const stateDir = path.join(process.env.XDG_STATE_HOME || path.join(homedir(), ".local", "state"), "matamly-print");
const stateFile = path.join(stateDir, "jobs.json");
const seen = new Set();

if (!/^https:\/\//i.test(base)) throw new Error("MATAMLY_API_BASE must be an HTTPS URL.");
if (!token) throw new Error("Set MATAMLY_DEVICE_TOKEN to the paired device credential.");

async function loadState() {
  await mkdir(stateDir, { recursive: true });
  try {
    const saved = JSON.parse(await readFile(stateFile, "utf8"));
    for (const id of Array.isArray(saved.completed) ? saved.completed : []) seen.add(String(id));
  } catch { /* first run */ }
}
async function saveState() {
  await writeFile(stateFile, JSON.stringify({ completed: [...seen].slice(-2000) }), { mode: 0o600 });
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
  await api(`/api/print/v1/jobs/${jobId}/stage`, { method: "POST", body: JSON.stringify({ stage: stageName, status, message }) });
}
async function printWithCups(text) {
  const file = path.join(stateDir, `receipt-${Date.now()}.txt`);
  await writeFile(file, `\uFEFF${text}\n`, "utf8", { mode: 0o600 });
  const args = printer ? ["-d", printer, file] : [file];
  await execFileAsync("lp", args, { timeout: 30000 });
}
async function cycle() {
  await api("/api/print/v1/devices/heartbeat", {
    method: "POST",
    body: JSON.stringify({ appVersion: "1.0.0", capabilities: { platform: process.platform, transports: ["cups"] } }),
  });
  const { job } = await api("/api/print/v1/jobs/claim");
  if (!job) return;
  const id = String(job.jobId);
  if (seen.has(id)) { await stage(job.jobId, "uncertain", "uncertain", "تم منع تكرار مهمة موجودة في سجل الجهاز"); return; }
  await stage(job.jobId, "agent_accepted", "ok", "استلم برنامج CUPS المهمة");
  try {
    await printWithCups(job.document.receiptText);
    seen.add(id);
    await saveState();
    await stage(job.jobId, "submitted_to_spooler", "ok", "قبل CUPS أمر الطباعة؛ لم يتم تأكيد خروج الورقة فعليًا");
  } catch (error) {
    await stage(job.jobId, "failed", "failed", (error instanceof Error ? error.message : String(error)).slice(0, 450));
  }
}
await loadState();
console.log(`Matamly Universal Print CUPS agent connected to ${base} on ${process.platform}`);
for (;;) {
  try { await cycle(); } catch (error) { console.error(error instanceof Error ? error.message : error); }
  await new Promise(resolve => setTimeout(resolve, 2500));
}
