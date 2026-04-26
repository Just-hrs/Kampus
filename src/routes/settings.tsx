import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Upload, Trash2, Check } from "lucide-react";
import { useStore, type ThemeId } from "@/core/store";
import { Surface } from "@/core/components/Surface";
import { useHaptics } from "@/core/hooks/useHaptics";
import { Signature } from "@/core/components/Signature";

import { exportData as exportToDevice } from "@/core/utils/export"; // ✅ rename to avoid clash

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const THEMES = [
  { id: "neon", name: "Midnight Neon", vibe: "Cyberpunk", preview: "linear-gradient(135deg, oklch(0.72 0.22 305), oklch(0.78 0.18 195))" },
  { id: "matte", name: "Matte OS", vibe: "Premium calm", preview: "linear-gradient(135deg, oklch(0.7 0.08 250), oklch(0.6 0.06 250))" },
  { id: "pop", name: "Bold Pop", vibe: "Gen-Z energy", preview: "linear-gradient(135deg, oklch(0.65 0.26 25), oklch(0.85 0.2 90))" },
  { id: "focus", name: "Minimal Focus", vibe: "Monk mode", preview: "linear-gradient(135deg, oklch(0.2 0.01 90), oklch(0.5 0.05 230))" },
] satisfies Array<{ id: ThemeId; name: string; vibe: string; preview: string }>;

function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const setTheme = useStore((s) => s.setTheme);

  const storeExport = useStore((s) => s.exportData); // ✅ renamed
  const importData = useStore((s) => s.importData);
  const resetAll = useStore((s) => s.resetAll);

  const haptic = useHaptics();
  const [status, setStatus] = useState<string | null>(null);

  // ✅ FINAL EXPORT HANDLER
  const onExport = async () => {
    try {
      const json = await storeExport(); // get JSON from store
      await exportToDevice(json);       // send to Capacitor

      haptic("success");
      setStatus("Export opened");
    } catch (e) {
      console.error(e);
      setStatus("Export failed");
    }
  };

  const onImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      const ok = await importData(text);

      haptic(ok ? "success" : "error");
      setStatus(ok ? "Imported." : "Import failed");

      setTimeout(() => setStatus(null), 2500);
    };

    input.click();
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-2 pb-24">

      {/* Theme */}
      <Surface className="p-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Theme — choose your vibe
        </div>

        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => {
            const active = settings.theme === t.id;

            return (
              <motion.button
                key={t.id}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setTheme(t.id);
                  haptic("success");
                }}
                className="relative overflow-hidden rounded-[var(--radius-2)] p-3 text-left border-2"
                style={{
                  background: t.preview,
                  borderColor: active ? "var(--ring)" : "transparent",
                }}
              >
                <div className="text-sm font-bold text-white">{t.name}</div>
                <div className="text-[10px] text-white/80">{t.vibe}</div>

                {active && (
                  <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black">
                    <Check size={12} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </Surface>

      {/* Feedback (FIXED UI) */}
      <Surface className="p-4 space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Feedback
        </div>

        <Toggle
          label="Haptic feedback"
          on={settings.haptics}
          onChange={(v) => setSettings({ haptics: v })}
        />

        <Toggle
          label="Sound effects"
          on={settings.sounds}
          onChange={(v) => setSettings({ sounds: v })}
        />
      </Surface>

      {/* Data */}
      <Surface className="p-4 space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Data — 100% on device
        </div>

        <button
          type="button"
          onClick={onExport}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground"
        >
          <Download size={14} /> Export backup
        </button>

        <button
          type="button"
          onClick={onImport}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-2.5 text-sm font-bold text-secondary-foreground"
        >
          <Upload size={14} /> Import backup
        </button>

        <button
          type="button"
          onClick={() => {
            if (confirm("Wipe ALL data?")) {
              resetAll();
              haptic("error");
              setStatus("All data wiped");
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-destructive/10 py-2.5 text-sm font-bold text-destructive"
        >
          <Trash2 size={14} /> Reset everything
        </button>

        {status && (
          <div className="text-center text-xs text-success pt-1">
            {status}
          </div>
        )}
      </Surface>

      <Signature page="about" className="pb-2" />
    </div>
  );
}

/* ---------- SMALL FIXED TOGGLE ---------- */
function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between py-2"
    >
      <span className="text-sm">{label}</span>

      <span
        className="relative h-6 w-11 rounded-full transition-colors shrink-0"
        style={{ background: on ? "var(--primary)" : "var(--muted)" }}
      >
        <motion.span
          animate={{ x: on ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
        />
      </span>
    </button>
  );
}