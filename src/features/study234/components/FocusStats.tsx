import { memo } from "react";
import { motion } from "framer-motion";
import {
  Clock3,
  CalendarDays,
  Flame,
} from "lucide-react";

interface Props {
  todayMin: number;
  weekMin: number;
  streak: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  glow,
  delay,
}: {
  label: string;
  value: string;
  icon: any;
  glow: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.35,
      }}
      whileHover={{
        y: -4,
        scale: 1.02,
      }}
      className="group relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-4 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-violet-400/20"
    >
      {/* glow */}
      <div
        className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${glow}`}
      />

      {/* top line */}
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-zinc-200 transition-all duration-300 group-hover:border-violet-400/20 group-hover:bg-violet-500/10 group-hover:text-violet-100">
            <Icon className="h-5 w-5" />
          </div>

          <div className="h-2 w-2 rounded-full bg-violet-300/60 shadow-[0_0_12px_rgba(196,181,253,0.9)]" />
        </div>

        <div className="mt-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function FocusStatsBase({
  todayMin,
  weekMin,
  streak,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatCard
        label="Today"
        value={`${todayMin}m`}
        icon={Clock3}
        delay={0}
        glow="bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_70%)]"
      />

      <StatCard
        label="This Week"
        value={`${weekMin}m`}
        icon={CalendarDays}
        delay={0.05}
        glow="bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_70%)]"
      />

      <StatCard
        label="Streak"
        value={`${streak}d`}
        icon={Flame}
        delay={0.1}
        glow="bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_70%)]"
      />
    </div>
  );
}

export const FocusStats = memo(FocusStatsBase);
