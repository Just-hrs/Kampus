import { useEffect, useState } from "react";

/**
 * Returns true once React has hydrated on the client.
 * Use to guard browser-only APIs (IndexedDB, localStorage, navigator, vibrate).
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
