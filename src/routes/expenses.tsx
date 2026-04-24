import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2 } from "lucide-react";
import { useStore, type ExpenseCategory } from "@/core/store";
import { useHaptics } from "@/core/hooks/useHaptics";
import { useHydrated } from "@/core/hooks/useHydrated";
import { Surface } from "@/core/components/Surface";
import { CountUp } from "@/core/components/CountUp";
import { CATEGORIES, CATEGORY_META, monthlyTotal, necessaryUnnecessary, byCategory, dailyThisMonth } from "@/features/expenses/logic";
import { formatINR } from "@/core/lib/utils";
import { isoToday } from "@/features/attendance/logic";
import { Signature } from "@/core/components/Signature";

export const Route = createFileRoute("/expenses")({
  component: ExpensesPage,
});

function ExpensesPage() {
  const hydrated = useHydrated();
  const expenses = useStore((s) => s.expenses);
  const budget = useStore((s) => s.monthlyBudget);
  const setBudget = useStore((s) => s.setMonthlyBudget);
  const removeExpense = useStore((s) => s.removeExpense);
  const haptic = useHaptics();
  const [sheet, setSheet] = useState(false);

  const now = new Date();
  const total = monthlyTotal(expenses, now.getFullYear(), now.getMonth());
  const { necessary, unnecessary } = necessaryUnnecessary(expenses, now.getFullYear(), now.getMonth());
  const cats = byCategory(expenses, now.getFullYear(), now.getMonth());
  const daily = dailyThisMonth(expenses, now.getFullYear(), now.getMonth());

  const recentMonth = expenses
    .filter((e) => {
      const d = new Date(e.dateISO);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .slice(0, 8);

  const pctBudget = budget > 0 ? Math.min(100, (total / budget) * 100) : 0;
  const necPct = total > 0 ? (necessary / total) * 100 : 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pt-2 pb-24">
      <Signature page="expenses" />
      {/* Total */}
      <Surface className="p-5">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {now.toLocaleString("default", { month: "long", year: "numeric" })}
        </div>
        <div className="mt-1 text-4xl font-display font-bold text-neon">
          {hydrated ? <CountUp value={total} prefix="₹" /> : "₹0"}
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-mono">{formatINR(total)} / {formatINR(budget)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full transition-all"
              style={{
                width: `${pctBudget}%`,
                background: pctBudget > 90 ? "var(--destructive)" : pctBudget > 70 ? "var(--warning)" : "var(--grad-success)",
              }}
            />
          </div>
        </div>
        <input
          type="range"
          min="1000"
          max="50000"
          step="500"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="mt-2 w-full accent-[color:var(--primary)]"
        />
      </Surface>

      {/* Necessary vs Unnecessary */}
      <Surface className="p-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Need vs Vibes
        </div>
        <div className="mt-3 h-4 overflow-hidden rounded-full bg-muted flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${necPct}%` }}
            className="h-full"
            style={{ background: "var(--success)" }}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${100 - necPct}%` }}
            className="h-full"
            style={{ background: "var(--warning)" }}
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="font-mono text-muted-foreground">NECESSARY</div>
            <div className="font-display text-lg font-bold text-success">{formatINR(necessary)}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-muted-foreground">VIBES</div>
            <div className="font-display text-lg font-bold text-warning">{formatINR(unnecessary)}</div>
          </div>
        </div>
        {unnecessary > necessary && total > 0 && (
          <div className="mt-2 rounded-[var(--radius-1)] bg-warning/10 p-2 text-[11px] text-warning">
            More vibes than needs this month. Worth it?
          </div>
        )}
      </Surface>

      {/* Daily bars */}
      <Surface className="p-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Daily Spend
        </div>
        <DailyBars data={daily} />
      </Surface>

      {/* By Category */}
      <Surface className="p-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
          By Category
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((c) => {
            const v = cats[c] ?? 0;
            const meta = CATEGORY_META[c];
            return (
              <div key={c} className="rounded-[var(--radius-2)] bg-surface-2 p-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                </div>
                <div className="mt-1 font-display font-bold">{formatINR(v)}</div>
              </div>
            );
          })}
        </div>
      </Surface>

      {/* Recent */}
      <Surface className="p-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Recent
        </div>
        {recentMonth.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No expenses yet. Tap + to log one.
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentMonth.map((e) => {
              const meta = CATEGORY_META[e.category];
              return (
                <div key={e.id} className="flex items-center gap-3 rounded-[var(--radius-1)] bg-surface-2 p-2">
                  <div className="text-xl">{meta.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{e.note || meta.label}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {e.dateISO} · {e.necessary ? "Need" : "Vibe"}
                    </div>
                  </div>
                  <div className="font-display font-bold">{formatINR(e.amount)}</div>
                  <button
                    onClick={() => {
                      removeExpense(e.id);
                      haptic("warning");
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Surface>

      {/* Floating Add */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          setSheet(true);
          haptic("tick");
        }}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground md:bottom-6"
        style={{ background: "var(--grad-primary)", boxShadow: "var(--glow-primary)" }}
      >
        <Plus size={24} />
      </motion.button>

      <AnimatePresence>{sheet && <AddExpenseSheet onClose={() => setSheet(false)} />}</AnimatePresence>
    </div>
  );
}

function DailyBars({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-20">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all"
          style={{
            height: `${(v / max) * 100}%`,
            minHeight: "2px",
            background: v > 0 ? "var(--grad-primary)" : "var(--muted)",
            opacity: v > 0 ? 1 : 0.3,
          }}
          title={`Day ${i + 1}: ₹${v}`}
        />
      ))}
    </div>
  );
}

function AddExpenseSheet({ onClose }: { onClose: () => void }) {
  const addExpense = useStore((s) => s.addExpense);
  const haptic = useHaptics();
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState<ExpenseCategory>("food");
  const [necessary, setNecessary] = useState(true);
  const [note, setNote] = useState("");

  const press = (k: string) => {
    haptic("tick");
    if (k === "del") setAmount((a) => a.slice(0, -1));
    else if (k === ".") {
      if (!amount.includes(".")) setAmount((a) => (a === "" ? "0." : a + "."));
    } else {
      setAmount((a) => (a === "0" ? k : a + k));
    }
  };

  const submit = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    addExpense({ amount: amt, category: cat, necessary, note, dateISO: isoToday() });
    haptic("success");
    onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[var(--radius-3)] bg-popover p-4 shadow-[var(--shadow-lg)] border-t border-border"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-muted-foreground/30 mb-3" />
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold">Add Expense</div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full bg-muted">
            <X size={16} />
          </button>
        </div>
        <div className="text-center font-display text-5xl font-bold text-neon mb-3">
          ₹{amount || "0"}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"].map((k) => (
            <motion.button
              whileTap={{ scale: 0.94 }}
              key={k}
              onClick={() => press(k)}
              className="h-12 rounded-[var(--radius-2)] bg-surface-2 font-display text-xl font-bold"
            >
              {k === "del" ? "⌫" : k}
            </motion.button>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3">
          {CATEGORIES.map((c) => {
            const m = CATEGORY_META[c];
            const active = cat === c;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className="flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition-all"
                style={{
                  background: active ? m.color : "var(--surface-2)",
                  color: active ? "white" : "var(--foreground)",
                }}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setNecessary(true)}
            className="flex-1 rounded-full py-2 text-xs font-semibold"
            style={{
              background: necessary ? "var(--success)" : "var(--surface-2)",
              color: necessary ? "white" : "var(--muted-foreground)",
            }}
          >
            Necessary
          </button>
          <button
            onClick={() => setNecessary(false)}
            className="flex-1 rounded-full py-2 text-xs font-semibold"
            style={{
              background: !necessary ? "var(--warning)" : "var(--surface-2)",
              color: !necessary ? "white" : "var(--muted-foreground)",
            }}
          >
            Vibes
          </button>
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="w-full rounded-[var(--radius-2)] bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mb-3"
        />
        <button
          onClick={submit}
          className="w-full rounded-full py-3 text-sm font-bold text-primary-foreground"
          style={{ background: "var(--grad-primary)", boxShadow: "var(--glow-primary)" }}
        >
          Add Expense
        </button>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </motion.div>
    </>
  );
}
