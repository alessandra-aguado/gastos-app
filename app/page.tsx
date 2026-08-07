import Link from "next/link";
import RachaChip from "./components/RachaChip";
import PatrimonioCard from "./components/PatrimonioCard";
import {
  getMonthSummary,
  getDailySpend,
  getSpendByTopCategory,
  getTopCategories,
  getBudgets,
  getMonthlyTrend,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const summary = await getMonthSummary();
  const dailyMap = await getDailySpend();
  const spendByCategory = await getSpendByTopCategory();
  const categories = await getTopCategories();
  const budgets = await getBudgets();
  const trend = await getMonthlyTrend();

  const totalBudget = budgets.reduce((s, b) => s + b.amountLimit, 0);
  const budgetPct = totalBudget > 0 ? Math.round((summary.total / totalBudget) * 100) : null;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const maxSpend = Math.max(1, ...Object.values(dailyMap));

  const ingresoMensual = 3500; // referencia estática, aún no hay modelo de Ingreso real
  const deudaTotal = 2890; // de Debo, aún mockup
  const ahorroTotal = 11720; // de Metas, aún mockup
  const maxTrend = Math.max(ingresoMensual, ...trend.map((m) => m.total));

  const chips = [
    { icon: "📊", label: "Presupuesto", value: budgetPct !== null ? `${budgetPct}% usado` : "sin definir" },
    { icon: "🎯", label: "Metas", value: "3 activas" },
    { icon: "💳", label: "Debo", value: "S/ 2,890" },
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

      <section className="flex flex-wrap items-start gap-3">
        {chips.map((c) => (
          <div key={c.label} className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2 text-sm">
            <span>{c.icon}</span>
            <span className="text-muted">{c.label}</span>
            <span className="font-medium">{c.value}</span>
          </div>
        ))}
        <RachaChip />
      </section>

      <PatrimonioCard />

      <section className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium">Tendencia general</p>
          <p className="text-xs text-muted">Gasto es real · ingreso, deuda y ahorro son referencia</p>
        </div>
        <div className="flex gap-5 mt-4">
          <div className="flex-1">
            <div className="relative h-28 flex items-end gap-2">
              <div
                className="absolute left-0 right-0 border-t border-dashed"
                style={{ borderColor: "var(--muted)", bottom: `${(ingresoMensual / maxTrend) * 100}%` }}
              />
              {trend.map((m) => (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end z-10">
                  <div
                    className="w-full rounded-t"
                    style={{ height: `${(m.total / maxTrend) * 100}%`, background: m.total > 0 ? "var(--accent)" : "var(--border)", minHeight: 2 }}
                    title={`${m.label}: S/ ${m.total.toFixed(0)}`}
                  />
                  <span className="text-[10px] text-muted">{m.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted mt-2">— — Ingreso de referencia: S/ {ingresoMensual.toLocaleString("es-PE")}/mes</p>
          </div>
          <div className="flex flex-col gap-3 justify-center border-l border-border pl-5 shrink-0">
            <div>
              <p className="text-xs text-muted">Deuda total</p>
              <p className="text-lg font-semibold">S/ {deudaTotal.toLocaleString("es-PE")}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Ahorro total</p>
              <p className="text-lg font-semibold text-positive">S/ {ahorroTotal.toLocaleString("es-PE")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-6">
        <p className="text-sm font-medium mb-4">Gasto diario</p>
        {summary.count === 0 ? (
          <p className="text-sm text-muted">Aún no registras gastos este mes. Dale a &quot;+ Registrar gasto&quot; para empezar.</p>
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
