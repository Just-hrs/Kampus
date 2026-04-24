export interface GameDef {
  id: string;
  name: string;
  emoji: string;
  tag: string;
  desc: string;
  gradient: string;
}

/** Game registry — append-only. New games show up automatically in the hub. */
export const GAMES: readonly GameDef[] = [
  {
    id: "anxiety-tap",
    name: "Anxiety Tap",
    emoji: "📱",
    tag: "Reflex",
    desc: "Tap notifications fast as they appear.",
    gradient: "from-pink-500 to-violet-600",
  },
  {
    id: "brain-rot",
    name: "Brain Rot Roulette",
    emoji: "🧠",
    tag: "Memory",
    desc: "Match meme prompts under time pressure.",
    gradient: "from-yellow-400 to-pink-500",
  },
  {
    id: "reflex-lab",
    name: "Reflex Lab",
    emoji: "⚡",
    tag: "Skill",
    desc: "Color match reflex test.",
    gradient: "from-cyan-400 to-blue-600",
  },
  {
    id: "college-sim",
    name: "College Sim",
    emoji: "🎓",
    tag: "Choice",
    desc: "Attend or sleep? Decide your fate.",
    gradient: "from-violet-500 to-purple-700",
  },
  {
    id: "all-nighter",
    name: "All-Nighter",
    emoji: "☕",
    tag: "Survival",
    desc: "Survive deadline waves.",
    gradient: "from-orange-400 to-red-600",
  },
  {
    id: "deadline-escape",
    name: "Deadline Escape",
    emoji: "🏃",
    tag: "Runner",
    desc: "Dodge incoming deadlines.",
    gradient: "from-emerald-400 to-teal-600",
  },
  {
    id: "existential-quiz",
    name: "Existential Quiz",
    emoji: "🌀",
    tag: "Quiz",
    desc: "Answer chaotic questions.",
    gradient: "from-fuchsia-500 to-rose-600",
  },
];

export const GAME_BOOT_LINES: readonly string[] = [
  "Booting Game Center...",
  "Loading dopamine systems...",
  "Synchronizing brain damage...",
  "Engaging chaos engine...",
  "READY.",
];
