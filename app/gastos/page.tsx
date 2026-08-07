import Link from "next/link";
import { getTopCategories, getSpendByTopCategory, listTransactionsByCategory, getMonthlyTrend } from "@/lib/queries";

export const dynamic = "force-dynamic";

const PALETTE = ["#6d4aff", "#5b6cff", "#f97316", "#16a34a", "#a778e0", "#e07ba7", "#7bb8e0", "#c4a15b"];

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

  const trend = await getMonthlyTrend();
  const maxTrend = Math.max(1, ...trend.map((m) => m.total));

  const conCategoriasConGasto = categories
    .map((c, i) => ({ ...c, monto: spendByCategory[c.id] || 0, color: PALETTE[i % PALETTE.length] }))
    .filter((c) => c.monto > 0)
    .sort((a, b) => b.monto - a.monto);
  const totalMes = conCategoriasConGasto.reduce((s, c) => s + c.monto, 0);

  const gradientStops = conCategoriasConGasto
    .reduce<{ acumulado: number; stops: string[] }>(
      (acc, c) => {
        const desde = (acc.acumulado / totalMes) * 100;
        const nuevoAcumulado = acc.acumulado + c.monto;
        const hasta = (nuevoAcumulado / totalMes) * 100;
        acc.stops.push(`${c.color} ${desde}% ${hasta}%`);
        return { acumulado: nuevoAcumulado, stops: acc.stops };
      },
      { acumulado: 0, stops: [] }
    )
    .stops.join(", ");

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold">🛒 Gastos</h1>
      <p className="text-muted text-sm mt-2">Detalle de tus gastos por categoría este mes.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
          <p className="text-sm font-medium mb-4">Por categoría</p>
          {totalMes === 0 ? (
            <p className="text-sm text-muted">Aún no hay gastos este mes para graficar.</p>
          ) : (
            <div className="flex items-center gap-5">
              <div
                className="w-32 h-32 rounded-full shrink-0 relative"
                style={{ background: `conic-gradient(${gradientStops})` }}
              >
                <div className="absolute inset-3 bg-surface rounded-full flex flex-col items-center justify-center">
                  <span className="text-xs text-muted">Total</span>
                  <span className="text-sm font-semibold">S/ {totalMes.toFixed(0)}</span>
                </div>
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                {conCategoriasConGasto.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className="text-muted truncate flex-1">{c.name}</span>
                    <span className="font-medium">{Math.round((c.monto / totalMes) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
          <p className="text-sm font-medium mb-4">Tendencia, últimos 6 meses</p>
          <div className="flex items-end gap-2 h-32">
            {trend.map((m) => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  className="w-full rounded-t"
                  style={{ height: `${(m.total / maxTrend) * 100}%`, background: m.total > 0 ? "var(--accent)" : "var(--border)", minHeight: 2 }}
                  title={`${m.label}: S/ ${m.total.toFixed(0)}`}
                />
                <span className="text-[10px] text-muted">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/gastos?cat=${c.id}`}
            className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4 hover:border-accent transition-colors"
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
