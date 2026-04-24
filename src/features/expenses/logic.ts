import type { Expense, ExpenseCategory } from "@/core/store";

export const CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; emoji: string; color: string }
> = {
  food: { label: "Food", emoji: "🍔", color: "var(--chart-1)" },
  transport: { label: "Transport", emoji: "🚌", color: "var(--chart-2)" },
  vibes: { label: "Vibes", emoji: "🎉", color: "var(--chart-3)" },
  books: { label: "Books", emoji: "📚", color: "var(--chart-4)" },
  subscriptions: { label: "Subs", emoji: "📺", color: "var(--chart-5)" },
  coffee: { label: "Coffee", emoji: "☕", color: "var(--warning)" },
  misc: { label: "Misc", emoji: "✨", color: "var(--muted-foreground)" },
};

export const CATEGORIES: ExpenseCategory[] = ["food", "transport", "vibes", "books", "subscriptions", "coffee", "misc"];

export function inMonth(e: Expense, year: number, month: number): boolean {
  const d = new Date(e.dateISO);
  return d.getFullYear() === year && d.getMonth() === month;
}

export function monthlyTotal(expenses: Expense[], year: number, month: number): number {
  return expenses.filter((e) => inMonth(e, year, month)).reduce((s, e) => s + e.amount, 0);
}

export function necessaryUnnecessary(
  expenses: Expense[],
  year: number,
  month: number,
): { necessary: number; unnecessary: number } {
  let n = 0;
  let u = 0;
  for (const e of expenses) {
    if (!inMonth(e, year, month)) continue;
    if (e.necessary) n += e.amount;
    else u += e.amount;
  }
  return { necessary: n, unnecessary: u };
}

export function byCategory(expenses: Expense[], year: number, month: number) {
  const out: Record<string, number> = {};
  for (const c of CATEGORIES) out[c] = 0;
  for (const e of expenses) {
    if (!inMonth(e, year, month)) continue;
    out[e.category] = (out[e.category] ?? 0) + e.amount;
  }
  return out;
}

export function dailyThisMonth(expenses: Expense[], year: number, month: number): number[] {
  const days = new Date(year, month + 1, 0).getDate();
  const arr = new Array(days).fill(0);
  for (const e of expenses) {
    if (!inMonth(e, year, month)) continue;
    const d = new Date(e.dateISO).getDate();
    arr[d - 1] += e.amount;
  }
  return arr;
}