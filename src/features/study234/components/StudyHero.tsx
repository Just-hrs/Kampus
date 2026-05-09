import { motion } from "framer-motion";
import { memo } from "react";
import { Flame, MoonStar } from "lucide-react";

interface Props {
  totalSessions: number;
  streak: number;
}

function getMessage(streak: number) {
  if (streak >= 30) {
    return "You built discipline. Protect it.";
  }

  if (streak >= 14) {
    return "Momentum is finally on your side.";
  }

  if (streak >= 7) {
    return "Your future self is noticing.";
  }

  if (streak >= 3) {
    return "Consistency is starting to form.";
  }

  return "One session is enough to restart.";
}

function StudyHeroBase({
  totalSessions,
  streak,
}: Props) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
      }}
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl"
    >
      {/* ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_60%)]" />

      {/* floating orb */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />

      {/* top highlight */}
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/60 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-100 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                <MoonStar className="h-4 w-4" />
              </div>

              <p className="text-xs uppercase tracking-[0.22em] text-violet-200/70">
                Survival Cockpit
              </p>
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Study through the chaos.
            </h1>

            <p className="mt-3 max-w-[560px] text-sm leading-relaxed text-zinc-300 sm:text-base">
              {getMessage(streak)}
            </p>
          </div>

          <motion.div
            animate={{
              scale: [1, 1.06, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
            }}
            className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-300/20 bg-orange-500/10 text-orange-100 shadow-[0_0_35px_rgba(251,146,60,0.2)]"
          >
            <Flame className="h-7 w-7" />
          </motion.div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
              Sessions
            </p>

            <p className="mt-1 text-2xl font-semibold text-white">
              {totalSessions}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 shadow-[0_0_30px_rgba(139,92,246,0.15)] backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-[0.16em] text-violet-200/70">
              Current Streak
            </p>

            <p className="mt-1 text-2xl font-semibold text-white">
              {streak} days
            </p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

export const StudyHero = memo(StudyHeroBase);