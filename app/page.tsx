import Link from "next/link";
import RachaChip from "./components/RachaChip";
import PatrimonioCard from "./components/PatrimonioCard";
import TendenciaGeneral from "./components/TendenciaGeneral";
import MesSelector from "./components/MesSelector";
import {
  getMonthSummary,
  getDailySpend,
  getSpendByTopCategory,
  getTopCategories,
  getBudgets,
  getMonthlyTrend,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const now = new Date();
  const mesKey = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [y, m] = mesKey.split("-").map(Number);
  const base = new Date(y, m - 1, 1);

  const summary = await getMonthSummary(base);
  const dailyMap = await getDailySpend(base);
  const spendByCategory = await getSpendByTopCategory(base);
  const categories = await getTopCategories();
  const budgets = await getBudgets(base);
  const trend = await getMonthlyTrend();

  const totalBudget = budgets.reduce((s, b) => s + b.amountLimit, 0);
  const budgetPct = totalBudget > 0 ? Math.round((summary.total / totalBudget) * 100) : null;

  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const maxSpend = Math.max(1, ...Object.values(dailyMap));
  const esMesActual = base.getFullYear() === now.getFullYear() && base.getMonth() === now.getMonth();

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
          <MesSelector mes={mesKey} />
        </div>
        <Link
          href="/registrar"
          className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          + Registrar gasto
        </Link>
      </header>

      <section className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-6 flex flex-wrap items-center gap-8">
        <div>
          <p className="text-xs text-muted">Gastado {esMesActual ? "este mes" : "en el mes"}</p>
          <p className="text-3xl font-bold mt-1">S/ {summary.total.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Transacciones</p>
          <p className="text-3xl font-bold mt-1">{summary.count}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Promedio por gasto</p>
          <p className="text-3xl font-bold mt-1">S/ {summary.avg.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Pendientes por clasificar</p>
          <p className="text-3xl font-bold mt-1 text-positive">{summary.pending}</p>
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
        <PatrimonioCard />
        <RachaChip />
      </section>

      <section className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-6">
        <TendenciaGeneral meses={trend.map((m) => m.label)} gastoReal={trend.map((m) => m.total)} />
      </section>

      <section className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-6">
        <p className="text-sm font-medium mb-4">Gasto diario</p>
        {summary.count === 0 ? (
          <p className="text-sm text-muted">
            {esMesActual
              ? 'Aún no registras gastos este mes. Dale a "+ Registrar gasto" para empezar.'
              : "No hay gastos registrados en este mes."}
          </p>
        ) : (
          <div className="flex items-end gap-1 h-36 overflow-x-auto">
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dayNum = i + 1;
              const day = String(dayNum).padStart(2, "0");
              const v = dailyMap[day] || 0;
              const mostrarEtiqueta = dayNum === 1 || dayNum % 5 === 0 || dayNum === daysInMonth;
              return (
                <div key={day} className="flex-1 min-w-[10px] flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full rounded-t"
                    style={{ height: `${(v / maxSpend) * 100}%`, background: v > 0 ? "var(--accent)" : "var(--border)", minHeight: 2 }}
                    title={`Día ${dayNum}: S/ ${v.toFixed(0)}`}
                  />
                  <span className="text-[9px] text-muted h-3">{mostrarEtiqueta ? dayNum : ""}</span>
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
              className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4 text-left hover:border-accent transition-colors"
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
