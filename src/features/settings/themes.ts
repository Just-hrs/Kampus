import type { ThemeId } from "@/core/store";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  vibe: string;
  preview: string;
}

/** Single source of truth for the theme picker (used by onboarding + settings). */
export const THEMES: readonly ThemeOption[] = [
  {
    id: "neon",
    name: "Midnight Neon",
    vibe: "Cyberpunk",
    preview: "linear-gradient(135deg, oklch(0.72 0.22 305), oklch(0.78 0.18 195))",
  },
  {
    id: "matte",
    name: "Matte OS",
    vibe: "Premium calm",
    preview: "linear-gradient(135deg, oklch(0.7 0.08 250), oklch(0.6 0.06 250))",
  },
  {
    id: "pop",
    name: "Bold Pop",
    vibe: "Gen-Z energy",
    preview: "linear-gradient(135deg, oklch(0.65 0.26 25), oklch(0.85 0.2 90))",
  },
  {
    id: "focus",
    name: "Minimal Focus",
    vibe: "Monk mode",
    preview: "linear-gradient(135deg, oklch(0.2 0.01 90), oklch(0.5 0.05 230))",
  },
] as const;
