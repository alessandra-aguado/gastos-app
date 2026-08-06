import Link from "next/link";
import {
  getMonthSummary,
  getDailySpend,
  getSpendByTopCategory,
  getTopCategories,
  getBudgets,
} from "@/lib/queries";

export default async function Home() {
  const summary = getMonthSummary();
  const daily = getDailySpend();
  const spendByCategory = getSpendByTopCategory();
  const categories = getTopCategories();
  const budgets = getBudgets();

  const totalBudget = budgets.reduce((s, b) => s + b.amountLimit, 0);
  const budgetPct = totalBudget > 0 ? Math.round((summary.total / totalBudget) * 100) : null;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyMap: Record<string, number> = {};
  for (const d of daily) dailyMap[d.date.slice(8, 10)] = d.total;
  const maxSpend = Math.max(1, ...Object.values(dailyMap));

  const chips = [
    { icon: "📊", label: "Presupuesto", value: budgetPct !== null ? `${budgetPct}% usado` : "sin definir" },
    { icon: "🎯", label: "Metas", value: "próxima fase" },
    { icon: "💳", label: "Debo", value: "próxima fase" },
    { icon: "🔥", label: "Racha", value: "próxima fase" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hola, Ale 👋</h1>
          <p className="text-muted text-sm mt-1">
            Así vas en {now.toLocaleDateString("es-PE", { month: "long", year: "numeric" })}
          </p>
        </div>
        <Link
          href="/registrar"
          className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
        >
          + Registrar gasto
        </Link>
      </header>

      <section className="bg-surface border border-border rounded-2xl p-6 flex flex-wrap items-center gap-8">
        <div>
          <p className="text-xs text-muted">Gastado este mes</p>
          <p className="text-3xl font-semibold mt-1">S/ {summary.total.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Transacciones</p>
          <p className="text-3xl font-semibold mt-1">{summary.count}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Promedio por gasto</p>
          <p className="text-3xl font-semibold mt-1">S/ {summary.avg.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Pendientes por clasificar</p>
          <p className="text-3xl font-semibold mt-1 text-positive">{summary.pending}</p>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        {chips.map((c) => (
          <div key={c.label} className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2 text-sm">
            <span>{c.icon}</span>
            <span className="text-muted">{c.label}</span>
            <span className="font-medium">{c.value}</span>
          </div>
        ))}
      </section>

      <section className="bg-surface border border-border rounded-2xl p-6">
        <p className="text-sm font-medium mb-4">Gasto diario</p>
        {summary.count === 0 ? (
          <p className="text-sm text-muted">Aún no registras gastos este mes. Dale a "+ Registrar gasto" para empezar.</p>
        ) : (
          <div className="flex items-end gap-1 h-32 overflow-x-auto">
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = String(i + 1).padStart(2, "0");
              const v = dailyMap[day] || 0;
              return (
                <div key={day} className="flex-1 min-w-[6px] flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full rounded-t"
                    style={{ height: `${(v / maxSpend) * 100}%`, background: v > 0 ? "var(--accent)" : "var(--border)" }}
                    title={`${day}: S/ ${v.toFixed(0)}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <p className="text-sm font-medium mb-3">Por categoría</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/gastos?cat=${c.id}`}
              className="bg-surface border border-border rounded-2xl p-4 text-left hover:border-accent transition-colors"
            >
              <span className="text-xl">{c.icon}</span>
              <p className="text-sm mt-2">{c.name}</p>
              <p className="text-lg font-semibold mt-0.5">S/ {(spendByCategory[c.id] || 0).toFixed(0)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
