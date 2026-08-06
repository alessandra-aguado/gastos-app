"use server";

import db from "./db";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { currentMonth } from "./queries";

export async function createTransaction(formData: FormData) {
  const amount = parseFloat(String(formData.get("amount")));
  const date = String(formData.get("date"));
  const categoryId = String(formData.get("categoryId"));
  const paymentMethodId = String(formData.get("paymentMethodId"));
  const notes = String(formData.get("notes") || "");
  const merchant = String(formData.get("merchant") || "");

  if (!amount || !date || !categoryId || !paymentMethodId) {
    throw new Error("Faltan campos requeridos");
  }

  db.prepare(
    `INSERT INTO "Transaction" (id, amount, date, merchant, source, status, notes, categoryId, paymentMethodId)
     VALUES (?, ?, ?, ?, 'manual', 'confirmado', ?, ?, ?)`
  ).run(randomUUID(), amount, date, merchant, notes, categoryId, paymentMethodId);

  revalidatePath("/");
  revalidatePath("/gastos");
  revalidatePath("/presupuesto");
}

export async function setBudget(formData: FormData) {
  const categoryId = String(formData.get("categoryId"));
  const amountLimit = parseFloat(String(formData.get("amountLimit")));
  const month = currentMonth();

  db.prepare(
    `INSERT INTO Budget (id, categoryId, month, amountLimit)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(categoryId, month) DO UPDATE SET amountLimit = excluded.amountLimit`
  ).run(randomUUID(), categoryId, month, amountLimit);

  revalidatePath("/presupuesto");
  revalidatePath("/");
}
