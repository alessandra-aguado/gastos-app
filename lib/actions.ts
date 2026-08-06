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
