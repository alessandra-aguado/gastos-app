import Link from "next/link";
import { getTopCategories, getSpendByTopCategory, listTransactionsByCategory } from "@/lib/queries";

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const categories = await getTopCategories();
  const spendByCategory = await getSpendByTopCategory();

  if (cat) {
    const category = categories.find((c) => c.id === cat);
    const transactions = await listTransactionsByCategory(cat);

    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/gastos" className="text-sm text-muted hover:text-accent">
          ← Todas las categorías
        </Link>
        <h1 className="text-2xl font-semibold mt-2">
          {category?.icon} {category?.name}
        </h1>
        <p className="text-muted text-sm mt-1">
          S/ {(spendByCategory[cat] || 0).toFixed(0)} este mes · {transactions.length} transacciones
        </p>

        <div className="mt-6 space-y-2">
          {transactions.length === 0 && (
            <p className="text-sm text-muted">Sin gastos registrados en esta categoría este mes.</p>
          )}
          {transactions.map((t) => (
            <div
              key={t.id}
              className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium">{t.merchant || t.category?.name}</p>
                <p className="text-xs text-muted">
                  {t.date.toISOString().slice(0, 10)} · {t.paymentMethod?.name}
                  {t.notes ? ` · ${t.notes}` : ""}
                </p>
              </div>
              <p className="font-semibold">S/ {t.amount.toFixed(0)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold">🛒 Gastos</h1>
      <p className="text-muted text-sm mt-2">Detalle de tus gastos por categoría este mes.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/gastos?cat=${c.id}`}
            className="bg-surface border border-border rounded-2xl p-4 hover:border-accent transition-colors"
          >
            <span className="text-xl">{c.icon}</span>
            <p className="text-sm mt-2">{c.name}</p>
            <p className="text-lg font-semibold mt-0.5">S/ {(spendByCategory[c.id] || 0).toFixed(0)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
