import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { X, Trophy } from "lucide-react";

interface GameShellProps {
  title: string;
  subtitle?: string;
  highScore?: number;
  onQuit: () => void;
  hud?: ReactNode;
  children: ReactNode;
  background?: string;
}

export function GameShell({
  title,
  subtitle,
  highScore,
  onQuit,
  hud,
  children,
  background = "linear-gradient(180deg, #0a0a0f 0%, #050507 100%)",
}: GameShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex flex-col"
      style={{ background }}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur">
        <button
          onClick={onQuit}
          aria-label="Quit"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white active:scale-95"
        >
          <X size={16} />
        </button>
        <div className="text-center min-w-0 flex-1">
          <div className="text-sm font-display font-bold text-white truncate">{title}</div>
          {subtitle && <div className="text-[10px] font-mono text-white/60 truncate">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white">
          <Trophy size={11} />
          <span>{highScore ?? 0}</span>
        </div>
      </div>
      {hud && <div className="px-4 py-2 border-b border-white/5 bg-black/20">{hud}</div>}
      <div className="flex-1 overflow-hidden relative">{children}</div>
    </motion.div>
  );
}

interface ResultCardProps {
  title: string;
  emoji: string;
  score: number;
  best: number;
  message: string;
  onPlayAgain: () => void;
  onQuit: () => void;
  accent?: string;
}

export function ResultCard({
  title,
  emoji,
  score,
  best,
  message,
  onPlayAgain,
  onQuit,
  accent = "var(--primary)",
}: ResultCardProps) {
  const isNewBest = score >= best && score > 0;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 18 }}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] p-6 text-center text-white"
        style={{ boxShadow: `0 20px 60px -10px ${accent}` }}
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="text-6xl mb-3"
        >
          {emoji}
        </motion.div>
        <div className="text-xs font-mono uppercase tracking-widest text-white/60">{title}</div>
        {isNewBest && (
          <div className="mt-1 text-[10px] font-bold text-warning">★ NEW HIGH SCORE</div>
        )}
        <div className="mt-3 font-display text-6xl font-bold" style={{ color: accent }}>
          {score}
        </div>
        <div className="mt-1 text-[11px] text-white/50">Best: {Math.max(score, best)}</div>
        <div className="mt-4 text-sm text-white/80 italic">"{message}"</div>
        <div className="mt-6 flex gap-2">
          <button
            onClick={onQuit}
            className="flex-1 rounded-full border border-white/20 py-3 text-xs font-bold text-white active:scale-95"
          >
            Exit
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 rounded-full py-3 text-xs font-bold text-black active:scale-95"
            style={{ background: accent }}
          >
            Play Again
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
