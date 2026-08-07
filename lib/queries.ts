import { prisma, ensureSeeded } from "./db";

export function currentMonthRange(base = new Date()) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return { start, end };
}

export function currentMonthKey(base = new Date()) {
  return base.toISOString().slice(0, 7); // "2026-08"
}

export function previousMonthKey(base = new Date()) {
  const d = new Date(base.getFullYear(), base.getMonth() - 1, 1);
  return d.toISOString().slice(0, 7);
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

export async function getSettings() {
  return prisma.settings.findUnique({ where: { id: "singleton" } });
}

// ---------- Ingresos ----------
export async function getIngresos() {
  return prisma.income.findMany({ orderBy: { date: "desc" } });
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

export async function listTransactionsByCategory(topCategoryId: string, range?: DateRange) {
  const { start, end } = range ?? currentMonthRange();
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

// Gasto variable real: transacciones que NO vienen de un Fijo marcado como pagado
// (para no duplicar el monto de Fijos en la proyeccion de Presupuesto).
export async function getGastoVariableReal(range?: DateRange) {
  const { start, end } = range ?? currentMonthRange();
  const result = await prisma.transaction.aggregate({
    where: { date: { gte: start, lt: end }, fixedExpenseId: null },
    _sum: { amount: true },
  });
  return result._sum.amount || 0;
}

// Racha de días consecutivos con al menos un gasto registrado.
export async function getRachaData() {
  const txs = await prisma.transaction.findMany({ select: { date: true }, orderBy: { date: "asc" } });
  const dias = new Set<string>();
  for (const t of txs) {
    const d = new Date(t.date);
    dias.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  const diasOrdenados = Array.from(dias).sort();

  let mejorRacha = 0;
  let corrida = 0;
  let anterior: Date | null = null;
  for (const key of diasOrdenados) {
    const [y, m, d] = key.split("-").map(Number);
    const fecha = new Date(y, m - 1, d);
    if (anterior) {
      const diff = Math.round((fecha.getTime() - anterior.getTime()) / 86400000);
      corrida = diff === 1 ? corrida + 1 : 1;
    } else {
      corrida = 1;
    }
    mejorRacha = Math.max(mejorRacha, corrida);
    anterior = fecha;
  }

  const hoy = new Date();
  const hoyKey = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const cursor = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  // si hoy aún no tiene gasto registrado, no rompemos la racha todavía: contamos desde ayer.
  if (!dias.has(hoyKey)) cursor.setDate(cursor.getDate() - 1);
  let rachaActual = 0;
  while (true) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (!dias.has(key)) break;
    rachaActual += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { diasConGasto: diasOrdenados, rachaActual, mejorRacha };
}

// Días del mes (1-31) en que hay algún fijo o cuota de tarjeta por vencer, para marcarlos en el calendario de racha.
export async function getDiasVencimiento() {
  const [fijos, deudas] = await Promise.all([
    prisma.fixedExpense.findMany({ select: { dueMode: true, dueDay: true, rangeEnd: true } }),
    prisma.debt.findMany({ where: { status: "activa", type: "tarjeta_credito" }, select: { dueDay: true } }),
  ]);
  const dias = new Set<number>();
  for (const f of fijos) {
    const day = f.dueMode === "unica" ? f.dueDay : f.rangeEnd;
    if (day) dias.add(day);
  }
  for (const d of deudas) {
    if (d.dueDay) dias.add(d.dueDay);
  }
  return Array.from(dias).sort((a, b) => a - b);
}

// Total gastado por mes, los últimos 6 meses (incluye el actual).
// Actualiza (o crea) el snapshot del mes actual con los totales reales de
// ahorro (metas activas), inversion y deuda. Los meses pasados quedan
// congelados tal como estaban la ultima vez que se visito Inicio en ese mes:
// no hay forma de reconstruir su valor exacto retroactivamente.
async function actualizarSnapshotMesActual() {
  const month = currentMonthKey();
  const [metas, inversiones, deudas] = await Promise.all([
    prisma.savingsGoal.findMany({ where: { status: "activa" } }),
    prisma.investment.findMany(),
    prisma.debt.findMany({ where: { status: "activa" } }),
  ]);
  const ahorro = metas.reduce((s, m) => s + m.currentAmount, 0);
  const inversion = inversiones.reduce((s, i) => s + (i.currentValue ?? i.amountContributed), 0);
  const deuda = deudas.reduce((s, d) => s + d.balance, 0);

  await prisma.monthlySnapshot.upsert({
    where: { month },
    update: { ahorro, inversion, deuda },
    create: { month, ahorro, inversion, deuda },
  });
}

// Serie de los ultimos 6 meses (mismo rango que getMonthlyTrend) con datos
// reales de ahorro/inversion/deuda. Los meses sin snapshot guardado quedan
// en null (no se inventan valores).
export async function getTendenciaFinanciera() {
  await actualizarSnapshotMesActual();

  const now = new Date();
  const meses: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const snapshots = await prisma.monthlySnapshot.findMany({ where: { month: { in: meses } } });
  const porMes: Record<string, { ahorro: number; inversion: number; deuda: number }> = {};
  for (const s of snapshots) {
    porMes[s.month] = { ahorro: s.ahorro, inversion: s.inversion, deuda: s.deuda };
  }

  return {
    ahorro: meses.map((m) => porMes[m]?.ahorro ?? null),
    inversion: meses.map((m) => porMes[m]?.inversion ?? null),
    deuda: meses.map((m) => porMes[m]?.deuda ?? null),
  };
}

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

// ---------- Ahorro ----------
export async function getSavingsPlan(month: string) {
  return prisma.savingsPlan.findUnique({ where: { month } });
}

export async function getAhorroSummary() {
  const [metas, inversiones] = await Promise.all([
    prisma.savingsGoal.findMany({ where: { status: "activa" } }),
    prisma.investment.findMany(),
  ]);
  const colchon = metas
    .filter((m) => m.isEmergencyFund)
    .reduce((s, m) => s + m.currentAmount, 0);
  const metasSinColchon = metas.filter((m) => !m.isEmergencyFund);
  const totalMetas = metasSinColchon.reduce((s, m) => s + m.currentAmount, 0);
  const totalInversiones = inversiones.reduce((s, i) => s + (i.currentValue ?? i.amountContributed), 0);
  return {
    total: colchon + totalMetas + totalInversiones,
    colchon,
    totalMetas,
    countMetas: metasSinColchon.length,
    totalInversiones,
    countInversiones: inversiones.length,
  };
}

// ---------- Cuentas ----------
export async function getCuentas() {
  return prisma.account.findMany({ orderBy: [{ bank: "asc" }, { createdAt: "asc" }] });
}

export async function getCuentaPorId(id: string) {
  return prisma.account.findUnique({ where: { id } });
}

export async function getFundMovements(accountId: string) {
  return prisma.fundMovement.findMany({ where: { accountId }, orderBy: { date: "desc" } });
}

// ---------- Historial de cambios ----------
export async function getActivityLog(limit = 150) {
  return prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}

// ---------- Reconciliacion de cuentas ----------
export async function getReconciliacionCuentas() {
  const cuentas = await getCuentas();
  const relevantes = cuentas.filter((c) => c.type !== "puntos" && c.type !== "custodia");
  const month = currentMonthKey();
  const prevMonth = previousMonthKey();

  const checkIns = await prisma.accountCheckIn.findMany({
    where: { accountId: { in: relevantes.map((c) => c.id) }, month: { in: [month, prevMonth] } },
  });

  const porCuenta = relevantes.map((c) => {
    const actual = checkIns.find((k) => k.accountId === c.id && k.month === month);
    const anterior = checkIns.find((k) => k.accountId === c.id && k.month === prevMonth);
    return {
      id: c.id,
      name: c.name,
      bank: c.bank,
      balance: c.balance,
      confirmadoEsteMes: !!actual,
      saldoAnterior: anterior?.balance ?? null,
    };
  });

  const hayHistorialMesAnterior = checkIns.some((k) => k.month === prevMonth);
  const totalActual = porCuenta.reduce((s, c) => s + c.balance, 0);
  const totalAnterior = hayHistorialMesAnterior
    ? porCuenta.reduce((s, c) => s + (c.saldoAnterior ?? c.balance), 0)
    : null;

  return {
    month,
    prevMonth,
    cuentas: porCuenta,
    totalActual,
    totalAnterior,
    delta: totalAnterior !== null ? totalActual - totalAnterior : null,
    pendientes: porCuenta.filter((c) => !c.confirmadoEsteMes).length,
  };
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
