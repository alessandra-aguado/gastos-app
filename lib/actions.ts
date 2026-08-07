"use server";

import { prisma, ensureSeeded } from "./db";
import { revalidatePath } from "next/cache";
import { currentMonthKey } from "./queries";

async function registrarActividad(entity: string, action: "crear" | "editar" | "eliminar", label: string) {
  await prisma.activityLog.create({ data: { entity, action, label } });
}

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

export async function updateTransaction(formData: FormData) {
  const id = String(formData.get("id"));
  const amount = parseFloat(String(formData.get("amount")));
  const date = String(formData.get("date"));
  const categoryId = String(formData.get("categoryId"));
  const paymentMethodId = String(formData.get("paymentMethodId"));
  const notes = String(formData.get("notes") || "");
  const merchant = String(formData.get("merchant") || "");

  if (!id || !amount || !date || !categoryId || !paymentMethodId) {
    throw new Error("Faltan campos requeridos");
  }

  const anterior = await prisma.transaction.findUnique({ where: { id } });
  if (!anterior) throw new Error("Gasto no encontrado");

  // Revierte el efecto que tenia el gasto anterior sobre una deuda de tarjeta
  // vinculada, y aplica el nuevo (por si cambio el monto o el medio de pago).
  await sincronizarDeudaTarjeta(anterior.paymentMethodId, -anterior.amount);

  await prisma.transaction.update({
    where: { id },
    data: {
      amount,
      date: new Date(date),
      merchant: merchant || null,
      notes: notes || null,
      categoryId,
      paymentMethodId,
    },
  });

  await sincronizarDeudaTarjeta(paymentMethodId, amount);

  await registrarActividad("Gasto", "editar", `Gasto de S/ ${amount.toFixed(0)} editado${merchant ? ` (${merchant})` : ""}`);

  revalidatePath("/");
  revalidatePath("/gastos");
  revalidatePath("/presupuesto");
  revalidatePath("/debo");
}

export async function eliminarTransaccion(formData: FormData) {
  const id = String(formData.get("id"));
  const gasto = await prisma.transaction.delete({ where: { id } });

  // Revierte el efecto en la deuda de tarjeta vinculada, si aplica.
  await sincronizarDeudaTarjeta(gasto.paymentMethodId, -gasto.amount);

  await registrarActividad("Gasto", "eliminar", `Gasto de S/ ${gasto.amount.toFixed(0)} eliminado${gasto.merchant ? ` (${gasto.merchant})` : ""}`);

  revalidatePath("/");
  revalidatePath("/gastos");
  revalidatePath("/presupuesto");
  revalidatePath("/debo");
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

  const categoriaBudget = await prisma.category.findUnique({ where: { id: categoryId } });
  await registrarActividad("Presupuesto", "editar", `Límite de "${categoriaBudget?.name ?? "categoría"}" fijado en S/ ${amountLimit.toFixed(0)}`);

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

  await registrarActividad("Meta", "crear", `Meta "${name}" creada (objetivo S/ ${targetAmount.toFixed(0)})`);

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
  const metaAporte = await prisma.savingsGoal.update({
    where: { id: savingsGoalId },
    data: { currentAmount: { increment: amount } },
  });

  await registrarActividad("Meta", "editar", `Aporte de S/ ${amount.toFixed(0)} a "${metaAporte.name}"`);

  revalidatePath("/metas");
}

export async function marcarMetaCompletada(formData: FormData) {
  const id = String(formData.get("id"));
  const metaCompletada = await prisma.savingsGoal.update({ where: { id }, data: { status: "completada" } });
  await registrarActividad("Meta", "editar", `Meta "${metaCompletada.name}" marcada como completada`);
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

  await registrarActividad("Meta", "editar", `Meta "${name}" editada`);

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

  await registrarActividad("Inversión", "crear", `Inversión en "${platform}" registrada (S/ ${amountContributed.toFixed(0)})`);

  revalidatePath("/inversiones");
}

export async function updateValorInversion(formData: FormData) {
  const id = String(formData.get("id"));
  const currentValue = parseFloat(String(formData.get("currentValue") || "0"));
  const invValor = await prisma.investment.update({ where: { id }, data: { currentValue } });
  await registrarActividad("Inversión", "editar", `Valor actual de "${invValor.platform}" actualizado a S/ ${currentValue.toFixed(0)}`);
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

  await registrarActividad("Inversión", "editar", `Inversión "${platform}" editada`);

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

  await registrarActividad("Cuenta", "crear", `Cuenta "${name}" creada (${bank}, saldo inicial S/ ${(balance || 0).toFixed(0)})`);

  revalidatePath("/cuentas");
  revalidatePath("/");
}

export async function updateSaldoCuenta(formData: FormData) {
  const id = String(formData.get("id"));
  const balance = parseFloat(String(formData.get("balance") || "0"));
  const month = currentMonthKey();
  const cuentaAnterior = await prisma.account.findUnique({ where: { id } });
  await prisma.account.update({ where: { id }, data: { balance, lastCheckIn: new Date() } });
  await prisma.accountCheckIn.upsert({
    where: { accountId_month: { accountId: id, month } },
    update: { balance, date: new Date() },
    create: { accountId: id, month, balance },
  });
  if (cuentaAnterior && cuentaAnterior.balance !== balance) {
    await registrarActividad(
      "Cuenta",
      "editar",
      `Saldo de "${cuentaAnterior.name}" actualizado: S/ ${cuentaAnterior.balance.toFixed(0)} → S/ ${balance.toFixed(0)}`
    );
  }
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

  await registrarActividad("Cuenta", "editar", `Datos de cuenta actualizados: "${name}" (${bank})`);

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

  const deudaCreada = await prisma.debt.create({
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

  await registrarActividad(
    "Deuda",
    "crear",
    `Deuda ${deudaCreada.type === "tarjeta_credito" ? "de tarjeta" : `con "${deudaCreada.counterpartName ?? "alguien"}"`} creada (S/ ${balance.toFixed(0)})`
  );

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

  const etiquetaDeuda = deuda.counterpartName ? ` con "${deuda.counterpartName}"` : "";
  if (deuda.balance !== balance) {
    await registrarActividad("Deuda", "editar", `Saldo de deuda${etiquetaDeuda} actualizado: S/ ${deuda.balance.toFixed(0)} → S/ ${balance.toFixed(0)}`);
  } else {
    await registrarActividad("Deuda", "editar", `Datos de deuda${etiquetaDeuda} editados`);
  }

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

  await registrarActividad(
    "Deuda",
    "editar",
    `Pago de S/ ${amount.toFixed(0)} registrado${debt.counterpartName ? ` (${debt.counterpartName})` : ""}, saldo restante S/ ${nuevoBalance.toFixed(0)}`
  );

  revalidatePath("/debo");
  revalidatePath("/");
}

export async function marcarCobrado(formData: FormData) {
  const id = String(formData.get("id"));
  const deudaCobrada = await prisma.debt.update({ where: { id }, data: { balance: 0, status: "pagada" } });
  await registrarActividad("Deuda", "editar", `Deuda${deudaCobrada.counterpartName ? ` con "${deudaCobrada.counterpartName}"` : ""} marcada como cobrada/pagada`);
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

  await registrarActividad("Fijo", "crear", `Fijo "${name}" creado (S/ ${amount.toFixed(0)}/mes)`);

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

  await registrarActividad("Fijo", "editar", `Fijo "${name}" editado`);

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

  await registrarActividad("Fijo", "editar", `Fijo "${fijo.name}" marcado como pagado este mes (S/ ${fijo.amount.toFixed(0)})`);

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

  await registrarActividad("Deseo", "crear", `Deseo "${name}" agregado (S/ ${estimatedPrice.toFixed(0)})`);

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

  await registrarActividad("Deseo", "editar", `Deseo "${name}" editado`);

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

  await registrarActividad("Deseo", "editar", `Deseo "${item.name}" convertido en meta de ahorro`);

  revalidatePath("/deseos");
  revalidatePath("/metas");
}

export async function marcarDeseoComprado(formData: FormData) {
  const id = String(formData.get("id"));
  const deseoComprado = await prisma.wishlistItem.update({ where: { id }, data: { status: "comprado" } });
  await registrarActividad("Deseo", "editar", `Deseo "${deseoComprado.name}" marcado como comprado`);
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

  await registrarActividad("Ingreso", "crear", `Ingreso registrado: S/ ${amount.toFixed(0)}${source ? ` (${source})` : ""}`);

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

  await registrarActividad("Ingreso", "editar", `Ingreso editado: S/ ${amount.toFixed(0)}${source ? ` (${source})` : ""}`);

  revalidatePath("/ingresos");
}

export async function eliminarIngreso(formData: FormData) {
  const id = String(formData.get("id"));
  const ingresoEliminado = await prisma.income.delete({ where: { id } });
  await registrarActividad("Ingreso", "eliminar", `Ingreso de S/ ${ingresoEliminado.amount.toFixed(0)} eliminado`);
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
  await registrarActividad("Ahorro", "editar", `Plan de ahorro de ${month} actualizado: S/ ${totalAmount.toFixed(0)}`);
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
  await registrarActividad("Presupuesto", "editar", `Ingreso mensual actualizado a S/ ${monthlyIncome.toFixed(0)}`);
  revalidatePath("/presupuesto");
}

export async function updateDecimales(formData: FormData) {
  const decimales = Math.min(3, Math.max(0, parseInt(String(formData.get("decimales") || "0"), 10) || 0));

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { decimales },
    create: { id: "singleton", decimales },
  });

  await registrarActividad("Ajustes", "editar", `Formato de montos actualizado a ${decimales} decimal${decimales === 1 ? "" : "es"}`);

  revalidatePath("/", "layout");
}

export async function updateReglaIngreso(formData: FormData) {
  const pctFijos = parseFloat(String(formData.get("pctFijos") || "0")) || 0;
  const pctVariable = parseFloat(String(formData.get("pctVariable") || "0")) || 0;
  const pctAhorro = parseFloat(String(formData.get("pctAhorro") || "0")) || 0;

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { pctFijos, pctVariable, pctAhorro },
    create: { id: "singleton", pctFijos, pctVariable, pctAhorro },
  });

  await registrarActividad(
    "Presupuesto",
    "editar",
    `Regla de reparto de ingreso actualizada: ${pctFijos}% fijos / ${pctVariable}% variable / ${pctAhorro}% ahorro`
  );

  revalidatePath("/ajustes");
  revalidatePath("/ahorro");
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

  await registrarActividad("Categoría", "crear", `Categoría "${name}" creada`);

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

  await registrarActividad("Medio de pago", "crear", `Medio de pago "${name}" creado (${type})`);

  revalidatePath("/ajustes");
  revalidatePath("/cuentas");
  revalidatePath("/");
}

// ================= Eliminar =================

export async function eliminarMeta(formData: FormData) {
  const id = String(formData.get("id"));
  const metaEliminada = await prisma.savingsGoal.delete({ where: { id } });
  await registrarActividad("Meta", "eliminar", `Meta "${metaEliminada.name}" eliminada`);
  revalidatePath("/metas");
  revalidatePath("/debo");
}

export async function eliminarInversion(formData: FormData) {
  const id = String(formData.get("id"));
  const inversionEliminada = await prisma.investment.delete({ where: { id } });
  await registrarActividad("Inversión", "eliminar", `Inversión "${inversionEliminada.platform}" eliminada`);
  revalidatePath("/inversiones");
}

export async function eliminarCuenta(formData: FormData) {
  const id = String(formData.get("id"));
  const cuentaEliminada = await prisma.account.delete({ where: { id } });
  await registrarActividad("Cuenta", "eliminar", `Cuenta "${cuentaEliminada.name}" eliminada`);
  revalidatePath("/cuentas");
  revalidatePath("/");
}

// ================= Movimientos de fondos custodia =================

export async function createFundMovement(formData: FormData) {
  const accountId = String(formData.get("accountId"));
  const type = String(formData.get("type"));
  const amount = parseFloat(String(formData.get("amount")));
  const date = String(formData.get("date"));
  const description = String(formData.get("description") || "").trim();

  if (!accountId || !amount || !date || (type !== "ingreso" && type !== "gasto")) {
    throw new Error("Faltan campos requeridos");
  }
  const cuenta = await prisma.account.findUnique({ where: { id: accountId } });
  if (!cuenta || cuenta.type !== "custodia") throw new Error("Cuenta inválida");

  const delta = type === "ingreso" ? amount : -amount;
  await prisma.$transaction([
    prisma.fundMovement.create({
      data: { accountId, type, amount, date: new Date(date), description: description || null },
    }),
    prisma.account.update({ where: { id: accountId }, data: { balance: { increment: delta } } }),
  ]);

  await registrarActividad(
    "Fondo",
    "crear",
    `${type === "ingreso" ? "Entrada" : "Gasto"} de S/ ${amount.toFixed(0)} en "${cuenta.name}"${description ? ` (${description})` : ""}`
  );
  revalidatePath("/cuentas");
  revalidatePath(`/cuentas/${accountId}`);
}

export async function updateFundMovement(formData: FormData) {
  const id = String(formData.get("id"));
  const type = String(formData.get("type"));
  const amount = parseFloat(String(formData.get("amount")));
  const date = String(formData.get("date"));
  const description = String(formData.get("description") || "").trim();

  if (!id || !amount || !date || (type !== "ingreso" && type !== "gasto")) {
    throw new Error("Faltan campos requeridos");
  }
  const anterior = await prisma.fundMovement.findUnique({ where: { id } });
  if (!anterior) throw new Error("Movimiento no encontrado");

  const deltaReversa = anterior.type === "ingreso" ? -anterior.amount : anterior.amount;
  const deltaNuevo = type === "ingreso" ? amount : -amount;

  await prisma.$transaction([
    prisma.fundMovement.update({
      where: { id },
      data: { type, amount, date: new Date(date), description: description || null },
    }),
    prisma.account.update({
      where: { id: anterior.accountId },
      data: { balance: { increment: deltaReversa + deltaNuevo } },
    }),
  ]);

  await registrarActividad("Fondo", "editar", `Movimiento editado: S/ ${amount.toFixed(0)} (${type})`);
  revalidatePath("/cuentas");
  revalidatePath(`/cuentas/${anterior.accountId}`);
}

export async function eliminarFundMovement(formData: FormData) {
  const id = String(formData.get("id"));
  const mov = await prisma.fundMovement.delete({ where: { id } });
  const delta = mov.type === "ingreso" ? -mov.amount : mov.amount;
  await prisma.account.update({ where: { id: mov.accountId }, data: { balance: { increment: delta } } });
  await registrarActividad("Fondo", "eliminar", `Movimiento de S/ ${mov.amount.toFixed(0)} eliminado`);
  revalidatePath("/cuentas");
  revalidatePath(`/cuentas/${mov.accountId}`);
}

export async function eliminarDeuda(formData: FormData) {
  const id = String(formData.get("id"));
  const deudaEliminada = await prisma.debt.delete({ where: { id } });
  await registrarActividad("Deuda", "eliminar", `Deuda${deudaEliminada.counterpartName ? ` con "${deudaEliminada.counterpartName}"` : ""} eliminada`);
  revalidatePath("/debo");
  revalidatePath("/");
}

export async function eliminarFijo(formData: FormData) {
  const id = String(formData.get("id"));
  const fijoEliminado = await prisma.fixedExpense.delete({ where: { id } });
  await registrarActividad("Fijo", "eliminar", `Fijo "${fijoEliminado.name}" eliminado`);
  revalidatePath("/fijos");
}

export async function eliminarDeseo(formData: FormData) {
  const id = String(formData.get("id"));
  const deseoEliminado = await prisma.wishlistItem.delete({ where: { id } });
  await registrarActividad("Deseo", "eliminar", `Deseo "${deseoEliminado.name}" eliminado`);
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

  await registrarActividad("Categoría", "editar", `Categoría "${name}" editada`);

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

  const categoriaEliminada = await prisma.category.delete({ where: { id } });
  await registrarActividad("Categoría", "eliminar", `Categoría "${categoriaEliminada.name}" eliminada`);

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
    const categoriasEliminadas = await prisma.category.findMany({ where: { id: { in: idsEliminables } }, select: { name: true } });
    await prisma.category.deleteMany({ where: { id: { in: idsEliminables } } });
    await registrarActividad(
      "Categoría",
      "eliminar",
      `${idsEliminables.length} categoría${idsEliminables.length === 1 ? "" : "s"} eliminada${idsEliminables.length === 1 ? "" : "s"}: ${categoriasEliminadas.map((c) => c.name).join(", ")}`
    );
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

  await registrarActividad("Medio de pago", "editar", `Medio de pago "${name}" editado`);

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
  const medioEliminado = await prisma.paymentMethod.delete({ where: { id } });
  await registrarActividad("Medio de pago", "eliminar", `Medio de pago "${medioEliminado.name}" eliminado`);

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
    const mediosEliminados = await prisma.paymentMethod.findMany({ where: { id: { in: idsEliminables } }, select: { name: true } });
    await prisma.account.updateMany({ where: { paymentMethodId: { in: idsEliminables } }, data: { paymentMethodId: null } });
    await prisma.paymentMethod.deleteMany({ where: { id: { in: idsEliminables } } });
    await registrarActividad(
      "Medio de pago",
      "eliminar",
      `${idsEliminables.length} medio${idsEliminables.length === 1 ? "" : "s"} de pago eliminado${idsEliminables.length === 1 ? "" : "s"}: ${mediosEliminados.map((m) => m.name).join(", ")}`
    );
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
