import db from "./db";

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  parentId: string | null;
};

export type PaymentMethod = { id: string; name: string; type: string };

export function currentMonth() {
  return new Date().toISOString().slice(0, 7); // "2026-08"
}

export function getCategories(): Category[] {
  return db.prepare("SELECT * FROM Category ORDER BY parentId IS NOT NULL, name").all() as Category[];
}

export function getTopCategories(): Category[] {
  return db.prepare("SELECT * FROM Category WHERE parentId IS NULL ORDER BY name").all() as Category[];
}

export function getPaymentMethods(): PaymentMethod[] {
  return db.prepare("SELECT * FROM PaymentMethod ORDER BY name").all() as PaymentMethod[];
}

export function getMonthSummary(month = currentMonth()) {
  const rows = db
    .prepare(`SELECT amount FROM "Transaction" WHERE date LIKE ? `)
    .all(`${month}%`) as { amount: number }[];

  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const count = rows.length;
  const avg = count > 0 ? total / count : 0;
  const pending = (
    db.prepare(`SELECT COUNT(*) as c FROM "Transaction" WHERE status = 'pendiente_revision'`).get() as { c: number }
  ).c;

  return { total, count, avg, pending };
}

export function getDailySpend(month = currentMonth()) {
  const rows = db
    .prepare(`SELECT date, SUM(amount) as total FROM "Transaction" WHERE date LIKE ? GROUP BY date ORDER BY date`)
    .all(`${month}%`) as { date: string; total: number }[];
  return rows;
}

export function getSpendByTopCategory(month = currentMonth()) {
  const rows = db
    .prepare(
      `SELECT c.id as categoryId, COALESCE(c.parentId, c.id) as topId, SUM(t.amount) as total
       FROM "Transaction" t
       JOIN Category c ON c.id = t.categoryId
       WHERE t.date LIKE ?
       GROUP BY topId`
    )
    .all(`${month}%`) as { topId: string; total: number }[];

  const map: Record<string, number> = {};
  for (const r of rows) map[r.topId] = r.total;
  return map;
}

export function listTransactionsByCategory(topCategoryId: string, month = currentMonth()) {
  return db
    .prepare(
      `SELECT t.*, c.name as categoryName, pm.name as paymentMethodName
       FROM "Transaction" t
       LEFT JOIN Category c ON c.id = t.categoryId
       LEFT JOIN PaymentMethod pm ON pm.id = t.paymentMethodId
       WHERE t.date LIKE ? AND (t.categoryId = ? OR c.parentId = ?)
       ORDER BY t.date DESC`
    )
    .all(`${month}%`, topCategoryId, topCategoryId);
}

export function getBudgets(month = currentMonth()) {
  return db.prepare(`SELECT * FROM Budget WHERE month = ?`).all(month) as {
    id: string;
    categoryId: string;
    month: string;
    amountLimit: number;
  }[];
}
