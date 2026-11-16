import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  costPerUnit: number;
  updatedAt: string;
};
export type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  notes: string;
  createdAt: string;
};
export type MatamlyStore = {
  orders: any[];
  inventory: InventoryItem[];
  expenses: Expense[];
  menu: any[];
  settings: Record<string, string>;
};

const emptyStore = (): MatamlyStore => ({ orders: [], inventory: [], expenses: [], menu: [], settings: {} });
const dataFile = path.resolve(process.env.MATAMLY_DATA_FILE || path.join(process.cwd(), "data", "matamly.json"));
let queue: Promise<unknown> = Promise.resolve();

async function readUnsafe(): Promise<MatamlyStore> {
  try {
    const parsed = JSON.parse(await readFile(dataFile, "utf8")) as Partial<MatamlyStore>;
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      menu: Array.isArray(parsed.menu) ? parsed.menu : [],
      settings: parsed.settings && typeof parsed.settings === "object" ? parsed.settings as Record<string, string> : {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return emptyStore();
  }
}

async function writeUnsafe(store: MatamlyStore) {
  await mkdir(path.dirname(dataFile), { recursive: true });
  const temp = `${dataFile}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(store, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temp, dataFile);
}

export async function readStore(): Promise<MatamlyStore> {
  await queue;
  return readUnsafe();
}

export async function updateStore<T>(mutator: (store: MatamlyStore) => T | Promise<T>): Promise<T> {
  const operation = queue.then(async () => {
    const store = await readUnsafe();
    const result = await mutator(store);
    await writeUnsafe(store);
    return result;
  });
  queue = operation.then(() => undefined, () => undefined);
  return operation;
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}`;
}
