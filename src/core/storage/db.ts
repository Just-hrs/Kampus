import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "studentos";
const DB_VERSION = 1;

const STORES = ["grades", "attendance", "expenses", "games", "settings", "streaks", "meta"] as const;
export type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IDB not available on server"));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const name of STORES) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name);
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function idbGet<T = unknown>(store: StoreName, key: string): Promise<T | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    const db = await getDB();
    return (await db.get(store, key)) as T | undefined;
  } catch {
    return undefined;
  }
}

export async function idbSet(store: StoreName, key: string, value: unknown): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const db = await getDB();
    await db.put(store, value, key);
  } catch {
    // swallow — offline write failures should never crash UI
  }
}

export async function idbRemove(store: StoreName, key: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const db = await getDB();
    await db.delete(store, key);
  } catch {
    // ignore
  }
}

export async function idbClearAll(): Promise<void> {
  if (typeof window === "undefined") return;
  const db = await getDB();
  for (const name of STORES) {
    await db.clear(name);
  }
}

export async function idbExportAll(): Promise<Record<string, unknown>> {
  if (typeof window === "undefined") return {};
  const db = await getDB();
  const out: Record<string, unknown> = { __schemaVersion: DB_VERSION };
  for (const name of STORES) {
    const all: Record<string, unknown> = {};
    const keys = await db.getAllKeys(name);
    for (const k of keys) {
      all[String(k)] = await db.get(name, k);
    }
    out[name] = all;
  }
  return out;
}
