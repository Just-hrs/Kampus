import type { Expense, ExpenseCategory } from "@/core/store";

// export const CATEGORY_META: Record<
//   ExpenseCategory,
//   { label: string; emoji: string; color: string }
// > = {
//   food: { label: "Food", emoji: "🍔", color: "var(--chart-1)" },
//   transport: { label: "Transport", emoji: "🚌", color: "var(--chart-2)" },
//   vibes: { label: "Vibes", emoji: "🎉", color: "var(--chart-3)" },
//   books: { label: "Books", emoji: "📚", color: "var(--chart-4)" },
//   subscriptions: { label: "Subs", emoji: "📺", color: "var(--chart-5)" },
//   coffee: { label: "Coffee", emoji: "☕", color: "var(--warning)" },
//   misc: { label: "Misc", emoji: "✨", color: "var(--muted-foreground)" },
// };

// export const CATEGORIES: ExpenseCategory[] = ["food", "transport", "vibes", "books", "subscriptions", "coffee", "misc"];

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

export function byCategory(
  expenses: Expense[],
  year: number,
  month: number
) {
  const out: Record<string, number> = {};

  for (const e of expenses) {
    if (!inMonth(e, year, month)) continue;

    out[e.category] =
      (out[e.category] ?? 0) + e.amount;
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


export function spendingPersonality(
  necessary: number,
  unnecessary: number
) {
  const total = necessary + unnecessary;

  if (total === 0) {
    return {
      title: "No data yet",
      message: "Track a few expenses to unlock patterns.",
    };
  }

  const vibeRatio = unnecessary / total;

  if (vibeRatio >= 0.75) {
    return {
      title: "Certified dopamine investor",
      message:
        "Most of your money goes toward instant gratification.",
    };
  }

  if (vibeRatio >= 0.55) {
    return {
      title: "Emotion-driven spender",
      message:
        "Your wants are quietly overpowering your needs.",
    };
  }

  if (vibeRatio >= 0.35) {
    return {
      title: "Balanced spender",
      message:
        "You spend on fun without completely losing control.",
    };
  }

  return {
    title: "Disciplined allocator",
    message:
      "Most spending supports survival, growth, or long-term goals.",
  };
}

export function biggestCategory(
  categories: Record<string, number>
) {
  let winner = "";
  let max = 0;

  for (const key in categories) {
    if (categories[key] > max) {
      max = categories[key];
      winner = key;
    }
  }

  return {
    category: winner,
    amount: max,
  };
}

export function spendingWarning(
  total: number,
  budget: number
) {
  if (budget <= 0) {
    return {
      level: "none",
      text: "No monthly budget set.",
    };
  }

  const ratio = total / budget;

  if (ratio >= 1.3) {
    return {
      level: "danger",
      text: "Financial violence detected.",
    };
  }

  if (ratio >= 1) {
    return {
      level: "warn",
      text: "You crossed your budget.",
    };
  }

  if (ratio >= 0.8) {
    return {
      level: "mid",
      text: "You're entering overspend territory.",
    };
  }

  return {
    level: "good",
    text: "Budget usage healthy.",
  };
}

export function burnRateProjection(
  total: number,
  currentDay: number,
  daysInMonth: number
) {
  if (currentDay === 0) return total;

  return (total / currentDay) * daysInMonth;
}