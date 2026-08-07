"use server";

import { prisma, ensureSeeded } from "./db";
import { revalidatePath } from "next/cache";
import { currentMonthKey } from "./queries";

// Si el gasto se paga con una tarjeta de credito vinculada a una Deuda, ese
// gasto tambien incrementa el saldo que debes en esa tarjeta.
async function sincronizarDeudaTarjeta(paymentMethodId: string | null, monto: number) {
  if (!paymentMethodId || !monto) return;
  const medio = await prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
  if (!medio || medio.type !== "credito") return;
  const deuda = await prisma.debt.findUnique({ where: { paymentMethodId } });
  if (!deuda) return;
  await prisma.debt.update({
    where: { id: deuda.id },
    data: { balance: deuda.balance + monto, status: "activa" },
  });
  revalidatePath("/debo");
}

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

  await sincronizarDeudaTarjeta(paymentMethodId, amount);

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

export async function updateMeta(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const motivo = String(formData.get("motivo") || "") || null;
  const targetDateRaw = String(formData.get("targetDate") || "");
  const targetAmount = parseFloat(String(formData.get("targetAmount") || "0"));

  if (!id || !name || !targetAmount) throw new Error("Faltan datos de la meta");

  await prisma.savingsGoal.update({
    where: { id },
    data: { name, motivo, targetAmount, targetDate: targetDateRaw ? new Date(targetDateRaw) : null },
  });

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
  const dateRaw = String(formData.get("date") || "");
  const termMonthsRaw = formData.get("termMonths");

  if (!platform || !amountContributed) throw new Error("Faltan datos de la inversión");

  const fecha = dateRaw ? new Date(dateRaw) : new Date();
  const termMonths = kind === "fija" && termMonthsRaw ? parseInt(String(termMonthsRaw), 10) : null;
  const maturityDate = termMonths ? new Date(fecha.getFullYear(), fecha.getMonth() + termMonths, fecha.getDate()) : null;

  await prisma.investment.create({
    data: {
      platform,
      instrumentType: instrumentType || "General",
      kind,
      amountContributed,
      date: fecha,
      currentValue: currentValueRaw ? parseFloat(String(currentValueRaw)) : null,
      tea: kind === "fija" && teaRaw ? parseFloat(String(teaRaw)) : null,
      termMonths,
      maturityDate,
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

export async function updateInversion(formData: FormData) {
  const id = String(formData.get("id"));
  const platform = String(formData.get("platform") || "").trim();
  const instrumentType = String(formData.get("instrumentType") || "").trim();
  const amountContributed = parseFloat(String(formData.get("amountContributed") || "0"));
  const teaRaw = formData.get("tea");

  if (!id || !platform || !amountContributed) throw new Error("Faltan datos de la inversión");

  await prisma.investment.update({
    where: { id },
    data: {
      platform,
      instrumentType: instrumentType || "General",
      amountContributed,
      tea: teaRaw ? parseFloat(String(teaRaw)) : null,
    },
  });

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
  const month = currentMonthKey();
  await prisma.account.update({ where: { id }, data: { balance, lastCheckIn: new Date() } });
  await prisma.accountCheckIn.upsert({
    where: { accountId_month: { accountId: id, month } },
    update: { balance, date: new Date() },
    create: { accountId: id, month, balance },
  });
  revalidatePath("/cuentas");
  revalidatePath("/");
}

export async function updateCuenta(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const bank = String(formData.get("bank") || "").trim();
  const type = String(formData.get("type") || "corriente");

  if (!id || !name || !bank) throw new Error("Faltan datos de la cuenta");

  await prisma.account.update({ where: { id }, data: { name, bank, type } });

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

  if (balance === null || balance === undefined || isNaN(balance) || balance < 0) throw new Error("Falta el monto de la deuda");

  const startDateRaw = String(formData.get("startDate") || "");
  const interestRateRaw = formData.get("interestRate");
  const paymentMethodIdRaw = String(formData.get("paymentMethodId") || "").trim() || null;
  const paymentMethodId = type === "tarjeta_credito" ? paymentMethodIdRaw : null;

  if (paymentMethodId) {
    const yaVinculada = await prisma.debt.findUnique({ where: { paymentMethodId } });
    if (yaVinculada) throw new Error("Ese medio de pago ya está vinculado a otra deuda.");
  }

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
      startDate: startDateRaw ? new Date(startDateRaw) : new Date(),
      interestRate: type === "prestamo_personal" && interestRateRaw ? parseFloat(String(interestRateRaw)) : null,
      paymentMethodId,
    },
  });

  revalidatePath("/debo");
  revalidatePath("/");
  revalidatePath("/cuentas");
}

export async function updateDeuda(formData: FormData) {
  const id = String(formData.get("id"));
  const counterpartName = String(formData.get("counterpartName") || "").trim() || null;
  const balance = parseFloat(String(formData.get("balance") || "0"));
  const creditLimitRaw = formData.get("creditLimit");
  const minPaymentRaw = formData.get("minPayment");
  const dueDayRaw = formData.get("dueDay");
  const startDateRaw = String(formData.get("startDate") || "");
  const interestRateRaw = formData.get("interestRate");

  if (!id || balance === null || balance === undefined || isNaN(balance) || balance < 0) throw new Error("Faltan datos de la deuda");

  const deuda = await prisma.debt.findUnique({ where: { id } });
  if (!deuda) throw new Error("Deuda no encontrada");

  const paymentMethodIdRaw = String(formData.get("paymentMethodId") || "").trim() || null;
  const paymentMethodId = deuda.type === "tarjeta_credito" ? paymentMethodIdRaw : deuda.paymentMethodId;

  if (paymentMethodId && paymentMethodId !== deuda.paymentMethodId) {
    const yaVinculada = await prisma.debt.findUnique({ where: { paymentMethodId } });
    if (yaVinculada && yaVinculada.id !== id) throw new Error("Ese medio de pago ya está vinculado a otra deuda.");
  }

  await prisma.debt.update({
    where: { id },
    data: {
      counterpartName,
      balance,
      creditLimit: deuda.type === "tarjeta_credito" && creditLimitRaw ? parseFloat(String(creditLimitRaw)) : deuda.creditLimit,
      minPayment: deuda.type === "tarjeta_credito" && minPaymentRaw ? parseFloat(String(minPaymentRaw)) : deuda.minPayment,
      dueDay: dueDayRaw ? parseInt(String(dueDayRaw), 10) : deuda.dueDay,
      startDate: startDateRaw ? new Date(startDateRaw) : deuda.startDate,
      interestRate: deuda.type === "prestamo_personal" && interestRateRaw ? parseFloat(String(interestRateRaw)) : deuda.interestRate,
      paymentMethodId,
    },
  });

  revalidatePath("/debo");
  revalidatePath("/");
  revalidatePath("/cuentas");
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

export async function updateFijo(formData: FormData) {
  const id = String(formData.get("id"));
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

  if (!id || !name || !categoryId || !amount) throw new Error("Faltan datos del fijo");

  await prisma.fixedExpense.update({
    where: { id },
    data: {
      name,
      categoryId,
      amount,
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
  await sincronizarDeudaTarjeta(fijo.paymentMethodId, fijo.amount);

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
  const link = String(formData.get("link") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!name || !estimatedPrice) throw new Error("Faltan datos del deseo");

  await prisma.wishlistItem.create({
    data: { name, estimatedPrice, categoryId, isNecessary, link, notes },
  });

  revalidatePath("/deseos");
}

export async function updateDeseo(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const estimatedPrice = parseFloat(String(formData.get("estimatedPrice") || "0"));
  const categoryId = String(formData.get("categoryId") || "") || null;
  const isNecessary = String(formData.get("isNecessary") || "") === "on";
  const link = String(formData.get("link") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!id || !name || !estimatedPrice) throw new Error("Faltan datos del deseo");

  await prisma.wishlistItem.update({
    where: { id },
    data: { name, estimatedPrice, categoryId, isNecessary, link, notes },
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

// ================= Ingresos =================

export async function createIngreso(formData: FormData) {
  const amount = parseFloat(String(formData.get("amount") || "0"));
  const date = String(formData.get("date") || "");
  const type = String(formData.get("type") || "variable");
  const source = String(formData.get("source") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!amount || !date) throw new Error("Faltan datos del ingreso");

  await prisma.income.create({
    data: { amount, date: new Date(date), type, source, notes },
  });

  revalidatePath("/ingresos");
}

export async function updateIngreso(formData: FormData) {
  const id = String(formData.get("id"));
  const amount = parseFloat(String(formData.get("amount") || "0"));
  const date = String(formData.get("date") || "");
  const type = String(formData.get("type") || "variable");
  const source = String(formData.get("source") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!id || !amount || !date) throw new Error("Faltan datos del ingreso");

  await prisma.income.update({
    where: { id },
    data: { amount, date: new Date(date), type, source, notes },
  });

  revalidatePath("/ingresos");
}

export async function eliminarIngreso(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.income.delete({ where: { id } });
  revalidatePath("/ingresos");
}

// ================= Ahorro =================

export async function upsertSavingsPlan(formData: FormData) {
  const month = String(formData.get("month") || "").trim();
  if (!month) throw new Error("Falta el mes del plan de ahorro");
  const totalAmount = parseFloat(String(formData.get("totalAmount") || "0")) || 0;
  const colchonAmount = parseFloat(String(formData.get("colchonAmount") || "0")) || 0;
  const inversionAmount = parseFloat(String(formData.get("inversionAmount") || "0")) || 0;
  const metasAmount = parseFloat(String(formData.get("metasAmount") || "0")) || 0;
  await prisma.savingsPlan.upsert({
    where: { month },
    update: { totalAmount, colchonAmount, inversionAmount, metasAmount },
    create: { month, totalAmount, colchonAmount, inversionAmount, metasAmount },
  });
  revalidatePath("/ahorro");
}

// ================= Ajustes generales =================

export async function updateIngresoMensual(formData: FormData) {
  const monthlyIncome = parseFloat(String(formData.get("monthlyIncome") || "0"));
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { monthlyIncome },
    create: { id: "singleton", monthlyIncome },
  });
  revalidatePath("/presupuesto");
}

// ================= Ajustes =================

export async function createCategoria(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const icon = String(formData.get("icon") || "").trim() || null;
  const color = String(formData.get("color") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;

  if (!name) throw new Error("Falta el nombre de la categoría");

  await prisma.category.create({ data: { name, icon, color, description } });

  revalidatePath("/ajustes");
  revalidatePath("/presupuesto");
  revalidatePath("/gastos");
  revalidatePath("/");
}

export async function createMedioDePago(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "debito");
  const bankOrIssuer = String(formData.get("bankOrIssuer") || "").trim() || null;
  const closingDayRaw = formData.get("closingDay");
  const billingDayRaw = formData.get("billingDay");

  if (!name) throw new Error("Falta el nombre del medio de pago");

  const medio = await prisma.paymentMethod.create({
    data: {
      name,
      type,
      bankOrIssuer,
      closingDay: type === "credito" && closingDayRaw ? parseInt(String(closingDayRaw), 10) : null,
      billingDay: type === "credito" && billingDayRaw ? parseInt(String(billingDayRaw), 10) : null,
    },
  });

  // Débito y billetera digital representan plata real en algún lado: se refleja
  // como Cuenta para que aparezca en Cuentas y sume al patrimonio.
  // Efectivo no tiene "banco"; crédito es deuda y vive en Debo, no en Cuentas.
  if (type === "debito" || type === "billetera_digital") {
    await prisma.account.create({
      data: {
        name,
        bank: bankOrIssuer || name,
        type: type === "debito" ? "corriente" : "billetera",
        balance: 0,
        paymentMethodId: medio.id,
      },
    });
  }

  revalidatePath("/ajustes");
  revalidatePath("/cuentas");
  revalidatePath("/");
}

// ================= Eliminar =================

export async function eliminarMeta(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.savingsGoal.delete({ where: { id } });
  revalidatePath("/metas");
  revalidatePath("/debo");
}

export async function eliminarInversion(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.investment.delete({ where: { id } });
  revalidatePath("/inversiones");
}

export async function eliminarCuenta(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.account.delete({ where: { id } });
  revalidatePath("/cuentas");
  revalidatePath("/");
}

export async function eliminarDeuda(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.debt.delete({ where: { id } });
  revalidatePath("/debo");
  revalidatePath("/");
}

export async function eliminarFijo(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.fixedExpense.delete({ where: { id } });
  revalidatePath("/fijos");
}

export async function eliminarDeseo(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.wishlistItem.delete({ where: { id } });
  revalidatePath("/deseos");
}

export async function updateCategoria(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const icon = String(formData.get("icon") || "").trim() || null;
  const color = String(formData.get("color") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;

  if (!id || !name) throw new Error("Faltan datos de la categoría");

  await prisma.category.update({ where: { id }, data: { name, icon, color, description } });

  revalidatePath("/ajustes");
  revalidatePath("/presupuesto");
  revalidatePath("/gastos");
  revalidatePath("/");
}

export async function eliminarCategoria(id: string): Promise<{ ok: boolean; error?: string }> {
  const enUso = await prisma.transaction.count({ where: { categoryId: id } });
  if (enUso > 0) {
    return { ok: false, error: `No se puede eliminar: tiene ${enUso} gasto${enUso === 1 ? "" : "s"} asociado${enUso === 1 ? "" : "s"}.` };
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath("/ajustes");
  revalidatePath("/presupuesto");
  revalidatePath("/gastos");
  revalidatePath("/");
  return { ok: true };
}

export async function eliminarCategoriasBulk(ids: string[]): Promise<{ ok: boolean; error?: string; eliminados: number }> {
  const conGastos = await prisma.transaction.groupBy({ by: ["categoryId"], where: { categoryId: { in: ids } } });
  const idsConGastos = new Set(conGastos.map((g) => g.categoryId));
  const idsEliminables = ids.filter((id) => !idsConGastos.has(id));

  if (idsEliminables.length > 0) {
    await prisma.category.deleteMany({ where: { id: { in: idsEliminables } } });
  }

  revalidatePath("/ajustes");
  revalidatePath("/presupuesto");
  revalidatePath("/gastos");
  revalidatePath("/");

  if (idsConGastos.size > 0) {
    return {
      ok: false,
      error: `${idsConGastos.size} categoría${idsConGastos.size === 1 ? "" : "s"} no se eliminaron porque tienen gastos asociados.`,
      eliminados: idsEliminables.length,
    };
  }
  return { ok: true, eliminados: idsEliminables.length };
}

export async function updateMedioDePago(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "debito");
  const bankOrIssuer = String(formData.get("bankOrIssuer") || "").trim() || null;
  const closingDayRaw = formData.get("closingDay");
  const billingDayRaw = formData.get("billingDay");

  if (!id || !name) throw new Error("Faltan datos del medio de pago");

  await prisma.paymentMethod.update({
    where: { id },
    data: {
      name,
      type,
      bankOrIssuer,
      closingDay: type === "credito" && closingDayRaw ? parseInt(String(closingDayRaw), 10) : null,
      billingDay: type === "credito" && billingDayRaw ? parseInt(String(billingDayRaw), 10) : null,
    },
  });

  const cuentaVinculada = await prisma.account.findUnique({ where: { paymentMethodId: id } });
  const debeTenerCuenta = type === "debito" || type === "billetera_digital";

  if (debeTenerCuenta) {
    if (cuentaVinculada) {
      await prisma.account.update({
        where: { id: cuentaVinculada.id },
        data: { name, bank: bankOrIssuer || name, type: type === "debito" ? "corriente" : "billetera" },
      });
    } else {
      await prisma.account.create({
        data: { name, bank: bankOrIssuer || name, type: type === "debito" ? "corriente" : "billetera", balance: 0, paymentMethodId: id },
      });
    }
  } else if (cuentaVinculada) {
    // cambió a credito/efectivo: desvincula la cuenta pero no la borra, para no perder el saldo ya registrado
    await prisma.account.update({ where: { id: cuentaVinculada.id }, data: { paymentMethodId: null } });
  }

  revalidatePath("/ajustes");
  revalidatePath("/cuentas");
  revalidatePath("/");
}

export async function eliminarMedioDePago(id: string): Promise<{ ok: boolean; error?: string }> {
  const [enTx, enFijos] = await Promise.all([
    prisma.transaction.count({ where: { paymentMethodId: id } }),
    prisma.fixedExpense.count({ where: { paymentMethodId: id } }),
  ]);
  const enUso = enTx + enFijos;
  if (enUso > 0) {
    return { ok: false, error: `No se puede eliminar: está en uso en ${enUso} registro${enUso === 1 ? "" : "s"}.` };
  }

  // desvincula la cuenta asociada (si la hay) para no perder el saldo ya registrado
  await prisma.account.updateMany({ where: { paymentMethodId: id }, data: { paymentMethodId: null } });
  await prisma.paymentMethod.delete({ where: { id } });

  revalidatePath("/ajustes");
  revalidatePath("/cuentas");
  return { ok: true };
}

export async function eliminarMediosDePagoBulk(ids: string[]): Promise<{ ok: boolean; error?: string; eliminados: number }> {
  const [enTx, enFijos] = await Promise.all([
    prisma.transaction.groupBy({ by: ["paymentMethodId"], where: { paymentMethodId: { in: ids } } }),
    prisma.fixedExpense.groupBy({ by: ["paymentMethodId"], where: { paymentMethodId: { in: ids } } }),
  ]);
  const idsEnUso = new Set<string>([
    ...enTx.map((g) => g.paymentMethodId).filter((v): v is string => !!v),
    ...enFijos.map((g) => g.paymentMethodId).filter((v): v is string => !!v),
  ]);
  const idsEliminables = ids.filter((id) => !idsEnUso.has(id));

  if (idsEliminables.length > 0) {
    await prisma.account.updateMany({ where: { paymentMethodId: { in: idsEliminables } }, data: { paymentMethodId: null } });
    await prisma.paymentMethod.deleteMany({ where: { id: { in: idsEliminables } } });
  }

  revalidatePath("/ajustes");
  revalidatePath("/cuentas");

  if (idsEnUso.size > 0) {
    return {
      ok: false,
      error: `${idsEnUso.size} medio${idsEnUso.size === 1 ? "" : "s"} de pago no se eliminaron porque están en uso.`,
      eliminados: idsEliminables.length,
    };
  }
  return { ok: true, eliminados: idsEliminables.length };
}
