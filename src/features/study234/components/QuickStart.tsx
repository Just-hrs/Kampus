import { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

interface Props {
  onStart: () => void;
  disabled?: boolean;
}

function QuickStartBase({
  onStart,
  disabled,
}: Props) {
  return (
    <motion.button
      type="button"
      onClick={onStart}
      disabled={disabled}
      whileHover={{
        scale: 1.015,
        y: -2,
      }}
      whileTap={{
        scale: 0.985,
      }}
      className="group relative w-full overflow-hidden rounded-[2rem] border border-red-400/20 bg-gradient-to-br from-red-500/15 via-orange-500/10 to-violet-500/10 p-5 text-left shadow-[0_0_40px_rgba(239,68,68,0.12)] backdrop-blur-xl transition-all duration-300 hover:border-red-400/40 hover:shadow-[0_0_60px_rgba(239,68,68,0.2)] disabled:opacity-50"
    >
      {/* glow */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.18),transparent_70%)]" />

      {/* ambient orb */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-red-500/20 blur-2xl" />

      {/* top highlight */}
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-red-300/70 to-transparent" />

      <div className="relative z-10 flex items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-300/20 bg-red-500/10 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <Zap className="h-6 w-6" />
          </div>

          <div>
            <p className="text-lg font-semibold tracking-tight text-white">
              I can’t focus
            </p>

            <p className="mt-1 max-w-[240px] text-sm leading-relaxed text-zinc-300">
              No pressure. No giant goals.
              <br />
              Just survive the next 5 minutes.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <div className="h-2 w-16 rounded-full bg-gradient-to-r from-red-400 to-orange-300" />

              <span className="text-[11px] uppercase tracking-[0.18em] text-red-100/70">
                Recovery Mode
              </span>
            </div>
          </div>
        </div>

        <motion.div
          animate={{
            rotate: [0, 8, -8, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
          }}
          className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-red-100"
        >
          <Sparkles className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.button>
  );
}

export const QuickStart = memo(QuickStartBase);

