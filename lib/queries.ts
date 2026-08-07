import { prisma, ensureSeeded } from "./db";

export function currentMonthRange(base = new Date()) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return { start, end };
}

export function currentMonthKey(base = new Date()) {
  return base.toISOString().slice(0, 7); // "2026-08"
}

export async function getCategories() {
  await ensureSeeded();
  return prisma.category.findMany({ orderBy: [{ name: "asc" }] });
}

export async function getTopCategories() {
  await ensureSeeded();
  return prisma.category.findMany({ where: { parentId: null }, orderBy: { name: "asc" } });
}

export async function getPaymentMethods() {
  await ensureSeeded();
  return prisma.paymentMethod.findMany({ orderBy: { name: "asc" } });
}

export type DateRange = { start: Date; end: Date };

export async function getMonthSummary(range?: DateRange) {
  const { start, end } = range ?? currentMonthRange();
  const txs = await prisma.transaction.findMany({
    where: { date: { gte: start, lt: end } },
    select: { amount: true, status: true },
  });
  const total = txs.reduce((s, t) => s + t.amount, 0);
  const count = txs.length;
  const avg = count > 0 ? total / count : 0;
  const pending = txs.filter((t) => t.status === "pendiente_revision").length;
  return { total, count, avg, pending };
}

// Devuelve la lista de días del rango con su gasto: [{ date: "2026-08-06", amount: 137.5 }, ...]
export async function getDailySpend(range?: DateRange): Promise<{ date: string; amount: number }[]> {
  const { start, end } = range ?? currentMonthRange();
  const txs = await prisma.transaction.findMany({
    where: { date: { gte: start, lt: end } },
    select: { date: true, amount: true },
  });
  const map: Record<string, number> = {};
  for (const t of txs) {
    const key = t.date.toISOString().slice(0, 10);
    map[key] = (map[key] || 0) + t.amount;
  }
  const dias: { date: string; amount: number }[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    dias.push({ date: key, amount: map[key] || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

export async function getSpendByTopCategory(range?: DateRange): Promise<Record<string, number>> {
  const { start, end } = range ?? currentMonthRange();
  const txs = await prisma.transaction.findMany({
    where: { date: { gte: start, lt: end } },
    select: { amount: true, category: { select: { id: true, parentId: true } } },
  });
  const map: Record<string, number> = {};
  for (const t of txs) {
    if (!t.category) continue;
    const topId = t.category.parentId ?? t.category.id;
    map[topId] = (map[topId] || 0) + t.amount;
  }
  return map;
}

export async function listTransactionsByCategory(topCategoryId: string) {
  const { start, end } = currentMonthRange();
  return prisma.transaction.findMany({
    where: {
      date: { gte: start, lt: end },
      OR: [{ categoryId: topCategoryId }, { category: { parentId: topCategoryId } }],
    },
    include: { category: true, paymentMethod: true },
    orderBy: { date: "desc" },
  });
}

export async function getBudgets(range?: DateRange) {
  if (!range) return prisma.budget.findMany({ where: { month: currentMonthKey() } });
  // Suma los presupuestos de todos los meses que toca el rango.
  const meses = new Set<string>();
  const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
  const fin = new Date(range.end.getFullYear(), range.end.getMonth(), 1);
  while (cursor <= fin) {
    meses.add(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return prisma.budget.findMany({ where: { month: { in: Array.from(meses) } } });
}

// Total gastado por mes, los últimos 6 meses (incluye el actual).
export async function getMonthlyTrend() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const txs = await prisma.transaction.findMany({
    where: { date: { gte: start } },
    select: { date: true, amount: true },
  });

  const months: { key: string; label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("es-PE", { month: "short" }), total: 0 });
  }
  for (const t of txs) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const m = months.find((m) => m.key === key);
    if (m) m.total += t.amount;
  }
  return months;
}

// ---------- Metas ----------
export async function getMetas() {
  return prisma.savingsGoal.findMany({
    include: { contributions: { orderBy: { date: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
}

// ---------- Inversiones ----------
export async function getInversiones() {
  return prisma.investment.findMany({ orderBy: { createdAt: "desc" } });
}

// ---------- Cuentas ----------
export async function getCuentas() {
  return prisma.account.findMany({ orderBy: [{ bank: "asc" }, { createdAt: "asc" }] });
}

// ---------- Debo ----------
export async function getDeudas() {
  return prisma.debt.findMany({
    include: { payments: { orderBy: { date: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
}

// ---------- Fijos ----------
export async function getFijos() {
  return prisma.fixedExpense.findMany({
    include: { category: true, paymentMethod: true },
    orderBy: { createdAt: "asc" },
  });
}

// ---------- Deseos ----------
export async function getDeseos() {
  return prisma.wishlistItem.findMany({
    include: { category: true, savingsGoal: true },
    orderBy: { createdAt: "desc" },
  });
}
