import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Upload, Trash2, Check } from "lucide-react";
import { useStore, type ThemeId } from "@/core/store";
import { Surface } from "@/core/components/Surface";
import { useHaptics } from "@/core/hooks/useHaptics";
import { Signature } from "@/core/components/Signature";
import { nativeConfirm } from "@/core/lib/alert";

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

  const storeExport = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const resetAll = useStore((s) => s.resetAll);

  const haptic = useHaptics();
  const [status, setStatus] = useState<string | null>(null);

  const semesters = useStore((s) => s.semesters);
  const currentSemesterId = useStore((s) => s.currentSemesterId);
  const setCurrentSemester = useStore((s) => s.setCurrentSemester);

  const addSemester = useStore((s) => s.addSemester);
  const deleteLastSemester = useStore((s) => s.deleteLastSemester);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ✅ FINAL EXPORT HANDLER
  const onExport = async () => {
    try {
      const json = await storeExport(); // from Zustand
      await exportToDevice(json);       // Capacitor function

      haptic("success"); // ✅ HERE (UI layer)

      setStatus("Choose 'Save to Files' to store backup"); // ✅ improved message
    } catch (e) {
      console.error(e);
      haptic("warning"); // 👈 add this too

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

      // ✅ Confirm overwrite
      const confirmed = confirm(
        "This will replace your entire data. Continue?"
      );
      if (!confirmed) return;

      try {
        const text = await file.text();
        const ok = await importData(text);

        if (!ok) throw new Error("Invalid file");

        haptic("success");
        setStatus("✅ Backup restored successfully");
      } catch {
        haptic("error");
        setStatus("❌ Invalid or corrupted backup file");
      }

      setTimeout(() => setStatus(null), 3000);
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

      {/* Profile */}
      <Surface className="p-4 space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Profile
        </div>

        <Field label="Your name">
          <input
            value={settings.studentName ?? ""}
            onChange={(e) => setSettings({ studentName: e.target.value })}
            placeholder="What should we call you?"
            className="w-full rounded-[var(--radius-2)] bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>

        <Field label={`Total Semesters: ${settings.totalSemesters}`}>
          <input
            type="range"
            min="2"
            max="12"
            value={settings.totalSemesters}
            onChange={(e) => setSettings({ totalSemesters: Number(e.target.value) })}
            className="w-full accent-[color:var(--primary)]"
          />
        </Field>

        {/* Current Semester */}
        <Field
          label={`Current Semester: ${
            semesters.find((s) => s.id === currentSemesterId)?.number ?? "-"
          }`}
        >
          <input
            type="range"
            min="1"
            max={semesters.length || 1}
            value={
              semesters.findIndex((s) => s.id === currentSemesterId) + 1 || 1
            }
            onChange={(e) => {
              const index = Number(e.target.value) - 1;
              const sem = semesters[index];
              if (sem) setCurrentSemester(sem.id);
            }}
            className="w-full accent-[color:var(--primary)]"
          />
        </Field>

        <Field label={`Attendance Target: ${settings.attendanceTarget}%`}>
          <input
            type="range"
            min="50"
            max="95"
            value={settings.attendanceTarget}
            onChange={(e) => setSettings({ attendanceTarget: Number(e.target.value) })}
            className="w-full accent-[color:var(--primary)]"
          />
        </Field>
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

        {/* Start New Semester */}
        <button
          onClick={addSemester}
          disabled={semesters.length >= settings.totalSemesters}
          className="w-full rounded-[var(--radius-2)] bg-primary text-primary-foreground py-2 text-sm font-semibold disabled:opacity-50"
        >
          {semesters.length >= settings.totalSemesters
            ? "All semesters created"
            : "Start New Semester"}
        </button>

        <button
          onClick={async () => {
            if (semesters.length <= 1) {
              haptic("warning");
              return;
            }

            const ok = await nativeConfirm({
              title: "Delete last semester?",
              message:
                "This action cannot be undone.",
            });

            if (!ok) {
              haptic("tick");
              return;
            }

            deleteLastSemester();
            haptic("warning");
          }}
          className="mt-2 w-full rounded-2xl bg-destructive/10 text-destructive py-2 text-sm font-semibold"
        >
          Delete Last Semester
        </button>

        {semesters.length <= 1 && (
          <div className="mt-1 text-center text-[11px] text-muted-foreground">
            No semesters left to delete
          </div>
        )}
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
          onClick={async () => {
            const ok = await nativeConfirm({
              title: "Import backup?",
              message:
                "Importing a backup will overwrite your current app data.\n\nExport your current data first if you may need it later.",
            });

            if (!ok) {
              haptic("tick");
              return;
            }

            onImport();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-2.5 text-sm font-bold text-secondary-foreground"
        >
          <Upload size={14} /> Import backup
        </button>

        <button
          type="button"
          onClick={async () => {
            const ok = await nativeConfirm({
              title: "Reset everything?",
              message:
                "This will permanently wipe all semesters, attendance, grades, expenses, and settings.",
            });

            if (!ok) {
              haptic("tick");
              return;
            }

            resetAll();
            haptic("error");
            setStatus("All data wiped");
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

      {/* About */}
      <Surface className="p-5">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          About KAMPUS
        </div>
        <h2 className="mt-1 font-display text-xl font-bold">why i made it</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/90">
          <p>Kabhi koi class bunk kerne ka man kiya hai ? </p>
          <p>Attendance ki tansion 😬!</p>
          <p>
            Subah uthke lagta hai:
            <br />
            <em className="text-muted-foreground">"Bhai aaj nahi ho payega."</em>
          </p>
          <p>
            Fir dimaag me attendance percentage ghoomna start:
            <br />
            <em className="text-muted-foreground">"Agar ye class miss ki toh 70 ke niche toh nahi chala jaunga?"</em>
            <br />
            <em className="text-muted-foreground">"Kitne aur bunk safe hain?"</em>
            <br />
            <em className="text-muted-foreground">"Kya recover ho sakta hai?"</em>
          </p>
          <p>Aur honestly… us time koi simple app nahi thi jo seedha jawab de de.</p>
          <p>Sab ya toh boring the. Ya spreadsheet jaisa feel dete the. Ya itne complicated ki unko use karne me hi attendance chali jaye.</p>
          <p className="font-semibold text-foreground">So here It is </p>
          <p>Ek aisa app jo:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>sirf productive nahi,</li>
            <li>thoda funny ho,</li>
            <li>thoda sarcastic ho,</li>
            <li>aur student life ko actually samjhe.</li>
          </ul>
          <p>Yaha graphs bhi hain. Bunk simulator bhi. CGPA ka reality check bhi. Aur emotional damage bhi.</p>
          <p>
            Kabhi motivation dega. Kabhi judge karega. Kabhi bolega:{" "}
            <em className="text-foreground">"Bhai padh le."</em>
            <br />
            Aur kabhi: <em className="text-foreground">"Risk lete hain."</em>
          </p>
          <p>Agar ye app kisi ek student ka bhi semester thoda less painful bana de… toh worth it tha.</p>
          <p className="pt-2 text-right text-xs font-semibold">— Harsh Chaurasiya</p>
          <p className="pt-1 text-center text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            Built on caffeine, poor decisions, and academic survival instincts.
          </p>
        </div>
      </Surface>
      
      <Signature page="about" className="pb-2" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>
      {children}
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

      {/* TRACK */}
      <span
        className="relative h-6 w-11 rounded-full shrink-0 overflow-hidden transition-colors"
        style={{ background: on ? "var(--primary)" : "var(--muted)" }}
      >
        {/* THUMB WRAPPER (CONSTRAINED) */}
        <motion.span
          className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow"
          animate={{ x: on ? 22 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      </span>
    </button>
  );
}