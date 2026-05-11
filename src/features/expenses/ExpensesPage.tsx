import { useMemo } from "react";
import { useStore } from "@/core/store";

export function ExpensesPage() {
  const expenses = useStore((s) => s.expenses);
  const categories = useStore((s) => s.categories);
  const budget = useStore((s) => s.monthlyBudget);

  const total = useMemo(
    () => expenses.reduce((a, b) => a + b.amount, 0),
    [expenses]
  );

  const necessary = useMemo(
    () =>
      expenses
        .filter((e) => e.necessary)
        .reduce((a, b) => a + b.amount, 0),
    [expenses]
  );

  const unnecessary = total - necessary;

  const percent = budget === 0 ? 0 : (total / budget) * 100;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4">

      {/* HEADER */}
      <div className="rounded-2xl bg-surface-2 p-4">
        <div className="text-xs text-muted">Monthly Spend</div>

        <div className="mt-1 text-4xl font-bold">
          ₹{total.toFixed(0)}
        </div>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: `${Math.min(percent, 100)}%`,
            }}
          />
        </div>

        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>Budget ₹{budget}</span>
          <span>{percent.toFixed(0)}%</span>
        </div>
      </div>

      {/* INSIGHTS */}
      <div className="grid gap-3 md:grid-cols-2">

        <div className="rounded-2xl bg-surface-2 p-4">
          <div className="text-xs text-muted">
            Necessary
          </div>

          <div className="mt-2 text-2xl font-bold">
            ₹{necessary.toFixed(0)}
          </div>
        </div>

        <div className="rounded-2xl bg-surface-2 p-4">
          <div className="text-xs text-muted">
            Vibes
          </div>

          <div className="mt-2 text-2xl font-bold">
            ₹{unnecessary.toFixed(0)}
          </div>
        </div>

      </div>

      {/* DECISION */}
      <div className="rounded-2xl bg-surface-2 p-4">
        <div className="text-sm font-semibold">
          Decision Engine
        </div>

        <div className="mt-2 text-sm text-muted">
          {percent >= 100
            ? "You're over budget. Stop impulse spending."
            : percent >= 75
            ? "Budget pressure increasing."
            : "Spending looks healthy."}
        </div>
      </div>

      {/* CATEGORY BREAKDOWN */}
      <div className="rounded-2xl bg-surface-2 p-4">
        <div className="mb-3 text-sm font-semibold">
          Categories
        </div>

        <div className="space-y-3">
          {categories.map((cat) => {
            const catTotal = expenses
              .filter((e) => e.category === cat.id)
              .reduce((a, b) => a + b.amount, 0);

            const ratio =
              total === 0 ? 0 : (catTotal / total) * 100;

            return (
              <div key={cat.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </div>

                  <span>₹{catTotal}</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${ratio}%`,
                      background: cat.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FEED */}
      <div className="rounded-2xl bg-surface-2 p-4">
        <div className="mb-3 text-sm font-semibold">
          Recent Expenses
        </div>

        <div className="space-y-2">
          {expenses.map((e) => {
            const cat = categories.find(
              (c) => c.id === e.category
            );

            return (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-xl bg-background p-3"
              >
                <div>
                  <div className="font-medium">
                    {cat?.emoji} {cat?.label}
                  </div>

                  <div className="text-xs text-muted">
                    {e.note || "No note"}
                  </div>
                </div>

                <div className="text-lg font-bold">
                  ₹{e.amount}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}