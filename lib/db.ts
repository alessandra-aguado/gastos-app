import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "gastos.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS Category (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  parentId TEXT REFERENCES Category(id)
);

CREATE TABLE IF NOT EXISTS PaymentMethod (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  bankOrIssuer TEXT
);

CREATE TABLE IF NOT EXISTS "Transaction" (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  merchant TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'confirmado',
  notes TEXT,
  categoryId TEXT REFERENCES Category(id),
  paymentMethodId TEXT REFERENCES PaymentMethod(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Budget (
  id TEXT PRIMARY KEY,
  categoryId TEXT NOT NULL REFERENCES Category(id),
  month TEXT NOT NULL,
  amountLimit REAL NOT NULL,
  UNIQUE(categoryId, month)
);
`);

function seedIfEmpty() {
  const count = (db.prepare("SELECT COUNT(*) as c FROM Category").get() as { c: number }).c;
  if (count > 0) return;

  const insertCat = db.prepare(
    "INSERT INTO Category (id, name, icon, description, parentId) VALUES (?, ?, ?, ?, ?)"
  );

  const topLevel: { id: string; name: string; icon: string; description: string }[] = [
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

  for (const c of topLevel) insertCat.run(c.id, c.name, c.icon, c.description, null);

  const subcats: { id: string; name: string; parentId: string }[] = [
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
  for (const s of subcats) insertCat.run(s.id, s.name, null, null, s.parentId);

  const insertPM = db.prepare("INSERT INTO PaymentMethod (id, name, type, bankOrIssuer) VALUES (?, ?, ?, ?)");
  insertPM.run("debito", "Débito", "debito", null);
  insertPM.run("credito", "Crédito", "credito", null);
  insertPM.run("billetera", "Billetera digital", "billetera_digital", null);
  insertPM.run("efectivo", "Efectivo", "efectivo", null);
}

seedIfEmpty();

export default db;
