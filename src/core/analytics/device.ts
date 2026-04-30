import { idbGet, idbSet } from "@/core/storage/db";
import { uid } from "@/core/lib/utils";

const INSTALL_ID_KEY = "install_id";

let cachedInstallId: string | null = null;

/**
 * Permanent anonymous device/install ID.
 *
 * Generated ONCE.
 * Stored in IndexedDB.
 * Survives app restarts + updates.
 */
export async function getInstallId(): Promise<string> {
  // in-memory cache
  if (cachedInstallId) {
    return cachedInstallId;
  }

  // try IndexedDB
  const existing = await idbGet<string>(
    "meta",
    INSTALL_ID_KEY
  );

  if (existing) {
    cachedInstallId = existing;
    return existing;
  }

  // create once
  const created = uid("dev");

  await idbSet(
    "meta",
    INSTALL_ID_KEY,
    created
  );

  cachedInstallId = created;

  return created;
}