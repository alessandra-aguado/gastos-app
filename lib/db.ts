import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const TOP_CATEGORIES = [
  { id: "supermercado", name: "Supermercado", icon: "🛒", description: "Compras en supermercado tipo Tottus, Plaza Vea, Metro, Wong." },
  { id: "mercado", name: "Mercado", icon: "🥬", description: "Compras en mercado o puestos, no supermercado." },
  { id: "transporte", name: "Transporte", icon: "🚌", description: "Movilidad: micro, taxi, corredor, apps de transporte." },
  { id: "salidas_comer", name: "Salidas a comer", icon: "🍽️", description: "Restaurantes, delivery de comida, cafés." },
  { id: "entretenimiento", name: "Entretenimiento", icon: "🎬", description: "Cine, streaming, salidas de ocio." },
  { id: "salud", name: "Salud", icon: "💊", description: "Farmacia, consultas médicas, medicinas." },
  { id: "salud_fisica", name: "Salud física", icon: "🏋️", description: "Gimnasio, deporte, actividad física." },
  { id: "educacion", name: "Educación", icon: "📚", description: "Cursos, materiales de estudio, exámenes." },
  { id: "suscripciones", name: "Suscripciones", icon: "🔁", description: "Netflix, Spotify y otros recibos recurrentes." },
  { id: "viajes", name: "Viajes", icon: "✈️", description: "Pasajes, hospedaje, gastos de viaje." },
  { id: "mascota", name: "Mascota", icon: "🐾", description: "Veterinaria, alimento y cuidado de mascota." },
  { id: "familia", name: "Familia", icon: "👨‍👩‍👧", description: "Gastos o invitaciones relacionadas a la familia." },
  { id: "amigos", name: "Amigos", icon: "🧑‍🤝‍🧑", description: "Salidas o gastos con amigos." },
  { id: "regalos", name: "Regalos", icon: "🎁", description: "Compras hechas específicamente para regalar." },
  { id: "otros", name: "Otros", icon: "🔹", description: "Cualquier gasto que no calce en otra categoría." },
];

const SUBCATEGORIES = [
  { id: "supermercado_abarrotes", name: "Abarrotes", parentId: "supermercado" },
  { id: "supermercado_frutas", name: "Frutas y verduras", parentId: "supermercado" },
  { id: "supermercado_otros", name: "Otros", parentId: "supermercado" },
  { id: "mercado_frutas", name: "Frutas y verduras", parentId: "mercado" },
  { id: "mercado_carnes", name: "Carnes", parentId: "mercado" },
  { id: "mercado_otros", name: "Otros", parentId: "mercado" },
  { id: "transporte_micro", name: "Micro", parentId: "transporte" },
  { id: "transporte_taxi", name: "Taxi", parentId: "transporte" },
  { id: "transporte_corredor", name: "Corredor", parentId: "transporte" },
];

const PAYMENT_METHODS = [
  { id: "debito", name: "Débito", type: "debito" },
  { id: "credito", name: "Crédito", type: "credito" },
  { id: "billetera", name: "Billetera digital", type: "billetera_digital" },
  { id: "efectivo", name: "Efectivo", type: "efectivo" },
];

export async function ensureSeeded() {
  // Usa upsert (en vez de create) para que sea seguro llamarlo varias veces
  // en paralelo, como hace Next.js al prerenderizar durante el build.
  for (const c of TOP_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: {},
      create: { id: c.id, name: c.name, icon: c.icon, description: c.description },
    });
  }
  for (const s of SUBCATEGORIES) {
    await prisma.category.upsert({
      where: { id: s.id },
      update: {},
      create: { id: s.id, name: s.name, parentId: s.parentId },
    });
  }
  for (const p of PAYMENT_METHODS) {
    await prisma.paymentMethod.upsert({
      where: { id: p.id },
      update: {},
      create: { id: p.id, name: p.name, type: p.type },
    });
  }
}
