import { useEffect, useState } from "react";
import { pickSignature, type Page } from "@/core/content/signatures";

interface SignatureProps {
  page: Page;
  className?: string;
}

/** Centered rotating tagline. Hydration-safe: only renders after mount. */
export function Signature({ page, className }: SignatureProps) {
  const [line, setLine] = useState<string | null>(null);
  useEffect(() => {
    setLine(pickSignature(page, Date.now()));
  }, [page]);
  return (
    <div
      className={
        "min-h-[14px] text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80 " +
        (className ?? "")
      }
    >
      {line}
    </div>
  );
}
