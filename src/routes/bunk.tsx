import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { BootSequence } from "@/core/components/BootSequence";
import { BUNK_BOOT_LINES } from "@/core/content/copy";
import { BunkPlanner } from "@/features/attendance/components/bunk/BunkPlanner";
import { Signature } from "@/core/components/Signature";

export const Route = createFileRoute("/bunk")({
  component: BunkPage,
});

function BunkPage() {
  const [booted, setBooted] = useState(false);
  return (
    <AnimatePresence mode="wait">
      {!booted ? (
        <BootSequence
          key="boot"
          lines={BUNK_BOOT_LINES}
          label="BUNK_OS · v3.14"
          onDone={() => setBooted(true)}
        />
      ) : (
        <BunkSimulator key="sim" />
      )}
    </AnimatePresence>
  );
}

function BunkSimulator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="mx-auto w-full max-w-2xl space-y-4 px-4 pt-2"
    >
      <div className="flex items-center gap-2">
        <Link
          to="/attendance"
          aria-label="Back to attendance"
          className="flex h-9 w-9 items-center justify-center rounded-full surface-glass"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            BUNK_OS · ACTIVE
          </div>
          <div className="text-base font-display font-bold">Bunk Planner</div>
        </div>
      </div>

      <Signature page="attendance" />

      <BunkPlanner />
    </motion.div>
  );
}
