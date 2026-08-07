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

export async function getMonthSummary(base?: Date) {
  const { start, end } = currentMonthRange(base);
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

// Devuelve un mapa { "06": 137.5, "07": 20 } con el día del mes como llave.
export async function getDailySpend(base?: Date): Promise<Record<string, number>> {
  const { start, end } = currentMonthRange(base);
  const txs = await prisma.transaction.findMany({
    where: { date: { gte: start, lt: end } },
    select: { date: true, amount: true },
  });
  const map: Record<string, number> = {};
  for (const t of txs) {
    const day = t.date.toISOString().slice(8, 10);
    map[day] = (map[day] || 0) + t.amount;
  }
  return map;
}

export async function getSpendByTopCategory(base?: Date): Promise<Record<string, number>> {
  const { start, end } = currentMonthRange(base);
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

export async function getBudgets(base?: Date) {
  return prisma.budget.findMany({ where: { month: currentMonthKey(base) } });
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
