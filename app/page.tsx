import Link from "next/link";
import RachaChip from "./components/RachaChip";
import PatrimonioCard from "./components/PatrimonioCard";
import TendenciaGeneral from "./components/TendenciaGeneral";
import RangoSelector from "./components/RangoSelector";
import CategoryIcon from "./components/CategoryIcon";
import { Hand, PieChart, Target, CreditCard } from "lucide-react";
import { colorForIndex } from "@/lib/categoryColors";
import { rangeForPreset, parsePreset, formatRangeLabel, toDateInputValue } from "@/lib/dateRanges";
import {
  getMonthSummary,
  getDailySpend,
  getSpendByTopCategory,
  getTopCategories,
  getBudgets,
  getMonthlyTrend,
  getTendenciaFinanciera,
  getMetas,
  getDeudas,
  getCuentas,
  getRachaData,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string; desde?: string; hasta?: string }>;
}) {
  const { rango, desde, hasta } = await searchParams;
  const preset = parsePreset(rango);
  const range = rangeForPreset(preset, desde, hasta);
  const rangeLabel = formatRangeLabel(preset, range.start, range.end);

  const summary = await getMonthSummary(range);
  const dailySpend = await getDailySpend(range);
  const spendByCategory = await getSpendByTopCategory(range);
  const categories = await getTopCategories();
  const budgets = await getBudgets(range);
  const trend = await getMonthlyTrend();
  const tendenciaFinanciera = await getTendenciaFinanciera();
  const metas = await getMetas();
  const deudas = await getDeudas();
  const cuentas = await getCuentas();
  const racha = await getRachaData();

  const totalBudget = budgets.reduce((s, b) => s + b.amountLimit, 0);
  const budgetPct = totalBudget > 0 ? Math.round((summary.total / totalBudget) * 100) : null;

  const maxSpend = Math.max(1, ...dailySpend.map((d) => d.amount));
  const mostrarEtiquetaCada = dailySpend.length > 45 ? 10 : dailySpend.length > 20 ? 5 : 1;

  const metasActivas = metas.filter((m) => m.status !== "completada").length;
  const totalDebo = deudas
    .filter((d) => d.status !== "pagada" && (d.type === "tarjeta_credito" || d.direction === "yo_debo"))
    .reduce((s, d) => s + d.balance, 0);
  const patrimonio = cuentas.filter((c) => c.type !== "puntos").reduce((s, c) => s + c.balance, 0);

  const chips = [
    { Icon: PieChart, label: "Presupuesto", value: budgetPct !== null ? `${budgetPct}% usado` : "sin definir" },
    { Icon: Target, label: "Metas", value: `${metasActivas} activa${metasActivas === 1 ? "" : "s"}` },
    { Icon: CreditCard, label: "Deuda", value: `S/ ${totalDebo.toLocaleString("es-PE")}` },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">Hola, Ale <Hand size={22} strokeWidth={1.75} /></h1>
          <RangoSelector preset={preset} label={rangeLabel} desde={desde || toDateInputValue(range.start)} hasta={hasta || toDateInputValue(new Date(range.end.getTime() - 86400000))} />
        </div>
        <Link
          href="/registrar"
          className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          + Registrar gasto
        </Link>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
          <p className="text-xs text-muted">Gastado</p>
          <p className="text-3xl font-bold mt-1">S/ {summary.total.toFixed(0)}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
          <p className="text-xs text-muted">Transacciones</p>
          <p className="text-3xl font-bold mt-1">{summary.count}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
          <p className="text-xs text-muted">Promedio por gasto</p>
          <p className="text-3xl font-bold mt-1">S/ {summary.avg.toFixed(0)}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
          <p className="text-xs text-muted">Pendientes por clasificar</p>
          <p className="text-3xl font-bold mt-1 text-positive">{summary.pending}</p>
        </div>
        <RachaChip rachaActual={racha.rachaActual} />
      </section>

      <section className="flex flex-wrap items-start gap-3">
        {chips.map((c) => (
          <div key={c.label} className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2 text-sm">
            <c.Icon size={15} strokeWidth={1.75} className="text-muted" />
            <span className="text-muted">{c.label}</span>
            <span className="font-medium">{c.value}</span>
          </div>
        ))}
        <PatrimonioCard total={patrimonio} />
      </section>

      <section className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-6">
        <TendenciaGeneral
          meses={trend.map((m) => m.label)}
          gastoReal={trend.map((m) => m.total)}
          ahorro={tendenciaFinanciera.ahorro}
          inversion={tendenciaFinanciera.inversion}
          deuda={tendenciaFinanciera.deuda}
        />
      </section>

      <section className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-6">
        <p className="text-sm font-medium mb-4">Gasto diario</p>
        {summary.count === 0 ? (
          <p className="text-sm text-muted">
            Aún no hay gastos registrados en este período. Dale a &quot;+ Registrar gasto&quot; para empezar.
          </p>
        ) : (
          <div className="flex items-end gap-1 h-36 overflow-x-auto">
            {dailySpend.map((d, i) => {
              const dayNum = Number(d.date.slice(8, 10));
              const mostrarEtiqueta = i === 0 || i === dailySpend.length - 1 || i % mostrarEtiquetaCada === 0;
              return (
                <div key={d.date} className="flex-1 min-w-[10px] flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full rounded-t"
                    style={{ height: `${(d.amount / maxSpend) * 100}%`, background: d.amount > 0 ? "var(--accent)" : "var(--border)", minHeight: 2 }}
                    title={`${d.date}: S/ ${d.amount.toFixed(0)}`}
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
          {categories.map((c, i) => (
            <Link
              key={c.id}
              href={`/gastos?cat=${c.id}`}
              className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4 text-left hover:border-accent transition-colors"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: c.color || colorForIndex(i) }}>
                <CategoryIcon icon={c.icon} size={16} />
              </div>
              <p className="text-sm mt-2">{c.name}</p>
              <p className="text-lg font-semibold mt-0.5">S/ {(spendByCategory[c.id] || 0).toFixed(0)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
