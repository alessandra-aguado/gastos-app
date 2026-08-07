"use server";

import { prisma, ensureSeeded } from "./db";
import { revalidatePath } from "next/cache";
import { currentMonthKey } from "./queries";

export async function createTransaction(formData: FormData) {
  await ensureSeeded();

  const amount = parseFloat(String(formData.get("amount")));
  const date = String(formData.get("date"));
  const categoryId = String(formData.get("categoryId"));
  const paymentMethodId = String(formData.get("paymentMethodId"));
  const notes = String(formData.get("notes") || "");
  const merchant = String(formData.get("merchant") || "");

  if (!amount || !date || !categoryId || !paymentMethodId) {
    throw new Error("Faltan campos requeridos");
  }

  await prisma.transaction.create({
    data: {
      amount,
      date: new Date(date),
      merchant: merchant || null,
      source: "manual",
      status: "confirmado",
      notes: notes || null,
      categoryId,
      paymentMethodId,
    },
  });

  revalidatePath("/");
  revalidatePath("/gastos");
  revalidatePath("/presupuesto");
}

export async function setBudget(formData: FormData) {
  const categoryId = String(formData.get("categoryId"));
  const amountLimit = parseFloat(String(formData.get("amountLimit")));
  const month = currentMonthKey();

  await prisma.budget.upsert({
    where: { categoryId_month: { categoryId, month } },
    update: { amountLimit },
    create: { categoryId, month, amountLimit },
  });

  revalidatePath("/presupuesto");
  revalidatePath("/");
}

// ================= Metas =================

export async function createMeta(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const method = String(formData.get("method") || "efectivo");
  const motivo = String(formData.get("motivo") || "") || null;
  const timeframeRaw = formData.get("timeframeMonths");
  const timeframeMonths = timeframeRaw ? parseInt(String(timeframeRaw), 10) : null;
  const targetDateRaw = String(formData.get("targetDate") || "");
  const isPercentageGoal = String(formData.get("isPercentageGoal") || "") === "on";
  const isEmergencyFund = String(formData.get("isEmergencyFund") || "") === "on";

  if (!name) throw new Error("Falta el nombre de la meta");

  let targetAmount: number;
  let totalValue: number | null = null;
  let percentage: number | null = null;

  if (isPercentageGoal) {
    totalValue = parseFloat(String(formData.get("totalValue") || "0"));
    percentage = parseFloat(String(formData.get("percentage") || "0"));
    if (!totalValue || !percentage) throw new Error("Falta el valor total o el porcentaje");
    targetAmount = Math.round((totalValue * percentage) / 100);
  } else {
    targetAmount = parseFloat(String(formData.get("targetAmount") || "0"));
    if (!targetAmount) throw new Error("Falta el monto objetivo");
  }

  await prisma.savingsGoal.create({
    data: {
      name,
      targetAmount,
      method,
      motivo,
      timeframeMonths,
      isPercentageGoal,
      totalValue,
      percentage,
      isEmergencyFund,
      targetDate: targetDateRaw ? new Date(targetDateRaw) : null,
    },
  });

  revalidatePath("/metas");
  revalidatePath("/debo");
}

export async function addContribucion(formData: FormData) {
  const savingsGoalId = String(formData.get("savingsGoalId"));
  const amount = parseFloat(String(formData.get("amount") || "0"));
  if (!savingsGoalId || !amount) throw new Error("Faltan datos del aporte");

  await prisma.savingsContribution.create({
    data: { savingsGoalId, amount, date: new Date() },
  });
  await prisma.savingsGoal.update({
    where: { id: savingsGoalId },
    data: { currentAmount: { increment: amount } },
  });

  revalidatePath("/metas");
}

export async function marcarMetaCompletada(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.savingsGoal.update({ where: { id }, data: { status: "completada" } });
  revalidatePath("/metas");
}

// ================= Inversiones =================

export async function createInversion(formData: FormData) {
  const platform = String(formData.get("platform") || "").trim();
  const instrumentType = String(formData.get("instrumentType") || "").trim();
  const kind = String(formData.get("kind") || "variable");
  const amountContributed = parseFloat(String(formData.get("amountContributed") || "0"));
  const currentValueRaw = formData.get("currentValue");
  const teaRaw = formData.get("tea");

  if (!platform || !amountContributed) throw new Error("Faltan datos de la inversión");

  await prisma.investment.create({
    data: {
      platform,
      instrumentType: instrumentType || "General",
      kind,
      amountContributed,
      date: new Date(),
      currentValue: currentValueRaw ? parseFloat(String(currentValueRaw)) : null,
      tea: kind === "fija" && teaRaw ? parseFloat(String(teaRaw)) : null,
    },
  });

  revalidatePath("/inversiones");
}

export async function updateValorInversion(formData: FormData) {
  const id = String(formData.get("id"));
  const currentValue = parseFloat(String(formData.get("currentValue") || "0"));
  await prisma.investment.update({ where: { id }, data: { currentValue } });
  revalidatePath("/inversiones");
}

// ================= Cuentas =================

export async function createCuenta(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const bank = String(formData.get("bank") || "").trim();
  const type = String(formData.get("type") || "corriente");
  const balance = parseFloat(String(formData.get("balance") || "0"));

  if (!name || !bank) throw new Error("Faltan datos de la cuenta");

  await prisma.account.create({
    data: { name, bank, type, balance: balance || 0, lastCheckIn: new Date() },
  });

  revalidatePath("/cuentas");
  revalidatePath("/");
}

export async function updateSaldoCuenta(formData: FormData) {
  const id = String(formData.get("id"));
  const balance = parseFloat(String(formData.get("balance") || "0"));
  await prisma.account.update({ where: { id }, data: { balance, lastCheckIn: new Date() } });
  revalidatePath("/cuentas");
  revalidatePath("/");
}

// ================= Debo =================

export async function createDeuda(formData: FormData) {
  const type = String(formData.get("type") || "tarjeta_credito");
  const counterpartName = String(formData.get("counterpartName") || "").trim() || null;
  const direction = String(formData.get("direction") || "") || null;
  const balance = parseFloat(String(formData.get("balance") || "0"));
  const principalRaw = formData.get("principalAmount");
  const principalAmount = principalRaw && String(principalRaw) ? parseFloat(String(principalRaw)) : balance;
  const creditLimitRaw = formData.get("creditLimit");
  const minPaymentRaw = formData.get("minPayment");
  const dueDayRaw = formData.get("dueDay");

  if (!balance) throw new Error("Falta el monto de la deuda");

  await prisma.debt.create({
    data: {
      type,
      counterpartName,
      direction: type === "prestamo_personal" ? direction : null,
      principalAmount,
      balance,
      creditLimit: type === "tarjeta_credito" && creditLimitRaw ? parseFloat(String(creditLimitRaw)) : null,
      minPayment: type === "tarjeta_credito" && minPaymentRaw ? parseFloat(String(minPaymentRaw)) : null,
      dueDay: dueDayRaw ? parseInt(String(dueDayRaw), 10) : null,
    },
  });

  revalidatePath("/debo");
  revalidatePath("/");
}

export async function registrarPagoDeuda(formData: FormData) {
  const debtId = String(formData.get("debtId"));
  const amount = parseFloat(String(formData.get("amount") || "0"));
  if (!debtId || !amount) throw new Error("Faltan datos del pago");

  const debt = await prisma.debt.findUnique({ where: { id: debtId } });
  if (!debt) throw new Error("Deuda no encontrada");

  const nuevoBalance = Math.max(0, debt.balance - amount);

  await prisma.debtPayment.create({ data: { debtId, amount, date: new Date() } });
  await prisma.debt.update({
    where: { id: debtId },
    data: { balance: nuevoBalance, status: nuevoBalance === 0 ? "pagada" : "activa" },
  });

  revalidatePath("/debo");
  revalidatePath("/");
}

export async function marcarCobrado(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.debt.update({ where: { id }, data: { balance: 0, status: "pagada" } });
  revalidatePath("/debo");
  revalidatePath("/");
}

// ================= Fijos =================

export async function createFijo(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const categoryId = String(formData.get("categoryId"));
  const amount = parseFloat(String(formData.get("amount") || "0"));
  const paymentMethodId = String(formData.get("paymentMethodId") || "") || null;
  const dueMode = String(formData.get("dueMode") || "unica");
  const dueDayRaw = formData.get("dueDay");
  const rangeStartRaw = formData.get("rangeStart");
  const rangeEndRaw = formData.get("rangeEnd");
  const reminderDaysRaw = formData.get("reminderDays");
  const syncCalendar = String(formData.get("syncCalendar") || "") === "on";

  if (!name || !categoryId || !amount) throw new Error("Faltan datos del fijo");

  await prisma.fixedExpense.create({
    data: {
      name,
      categoryId,
      amount,
      frequency: "mensual",
      paymentMethodId,
      dueMode,
      dueDay: dueMode === "unica" && dueDayRaw ? parseInt(String(dueDayRaw), 10) : null,
      rangeStart: dueMode === "rango" && rangeStartRaw ? parseInt(String(rangeStartRaw), 10) : null,
      rangeEnd: dueMode === "rango" && rangeEndRaw ? parseInt(String(rangeEndRaw), 10) : null,
      reminderDays: reminderDaysRaw ? parseInt(String(reminderDaysRaw), 10) : 3,
      syncCalendar,
    },
  });

  revalidatePath("/fijos");
}

export async function marcarFijoPagado(formData: FormData) {
  const id = String(formData.get("id"));
  const fijo = await prisma.fixedExpense.findUnique({ where: { id } });
  if (!fijo) throw new Error("Fijo no encontrado");

  const month = currentMonthKey();

  await prisma.transaction.create({
    data: {
      amount: fijo.amount,
      date: new Date(),
      merchant: fijo.name,
      source: "manual",
      status: "confirmado",
      categoryId: fijo.categoryId,
      paymentMethodId: fijo.paymentMethodId,
      fixedExpenseId: fijo.id,
    },
  });

  await prisma.fixedExpense.update({ where: { id }, data: { lastPaidMonth: month } });

  revalidatePath("/fijos");
  revalidatePath("/");
  revalidatePath("/gastos");
}

// ================= Deseos =================

export async function createDeseo(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const estimatedPrice = parseFloat(String(formData.get("estimatedPrice") || "0"));
  const categoryId = String(formData.get("categoryId") || "") || null;
  const isNecessary = String(formData.get("isNecessary") || "") === "on";

  if (!name || !estimatedPrice) throw new Error("Faltan datos del deseo");

  await prisma.wishlistItem.create({
    data: { name, estimatedPrice, categoryId, isNecessary },
  });

  revalidatePath("/deseos");
}

export async function convertirDeseoEnMeta(formData: FormData) {
  const wishlistItemId = String(formData.get("wishlistItemId"));
  const item = await prisma.wishlistItem.findUnique({ where: { id: wishlistItemId } });
  if (!item) throw new Error("Deseo no encontrado");

  await prisma.savingsGoal.create({
    data: {
      name: item.name,
      targetAmount: item.estimatedPrice,
      method: String(formData.get("method") || "efectivo"),
      motivo: String(formData.get("motivo") || "") || null,
      originWishlistId: item.id,
    },
  });

  await prisma.wishlistItem.update({ where: { id: item.id }, data: { status: "convertido_a_meta" } });

  revalidatePath("/deseos");
  revalidatePath("/metas");
}

export async function marcarDeseoComprado(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.wishlistItem.update({ where: { id }, data: { status: "comprado" } });
  revalidatePath("/deseos");
}

// ================= Ajustes =================

export async function createCategoria(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const icon = String(formData.get("icon") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;

  if (!name) throw new Error("Falta el nombre de la categoría");

  await prisma.category.create({ data: { name, icon, description } });

  revalidatePath("/ajustes");
  revalidatePath("/presupuesto");
  revalidatePath("/gastos");
}

export async function createMedioDePago(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "debito");
  const bankOrIssuer = String(formData.get("bankOrIssuer") || "").trim() || null;

  if (!name) throw new Error("Falta el nombre del medio de pago");

  await prisma.paymentMethod.create({ data: { name, type, bankOrIssuer } });

  revalidatePath("/ajustes");
}
