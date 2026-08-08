import Link from "next/link";
import { ShoppingCart, LayoutList, CalendarDays } from "lucide-react";
import { getTopCategories, getSpendByTopCategory, listTransactionsByCategory, getMonthlyTrend, getPaymentMethods, getSettings, getMonthTransactions, monthRangeFromKey, currentMonthKey } from "@/lib/queries";
import { formatMonto } from "@/lib/format";
import CategoryIcon from "../components/CategoryIcon";
import { colorForIndex } from "@/lib/categoryColors";
import RangoSelector from "../components/RangoSelector";
import { rangeForPreset, parsePreset, formatRangeLabel, toDateInputValue } from "@/lib/dateRanges";
import TransactionRow from "./TransactionRow";
import DescargarReporte from "../components/DescargarReporte";
import GastoCalendario from "./GastoCalendario";

export const dynamic = "force-dynamic";

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; rango?: string; desde?: string; hasta?: string; vista?: string; mes?: string }>;
}) {
  const { cat, rango, desde, hasta, vista, mes } = await searchParams;
  const preset = parsePreset(rango);
  const range = rangeForPreset(preset, desde, hasta);
  const rangeLabel = formatRangeLabel(preset, range.start, range.end);

  const categories = await getTopCategories();
  const spendByCategory = await getSpendByTopCategory(range);
  const settings = await getSettings();
  const decimales = settings?.decimales ?? 0;

  if (!cat && vista === "calendario") {
    const mesKey = mes || currentMonthKey();
    const monthRange = monthRangeFromKey(mesKey);
    const [transacciones, medios] = await Promise.all([getMonthTransactions(monthRange), getPaymentMethods()]);

    const porDia: Record<string, typeof transacciones> = {};
    for (const t of transacciones) {
      const key = t.date.toISOString().slice(0, 10);
      if (!porDia[key]) porDia[key] = [];
      porDia[key].push(t);
    }

    const [y, m] = mesKey.split("-").map(Number);
    const diasEnMes = new Date(y, m, 0).getDate();
    const dias = Array.from({ length: diasEnMes }, (_, i) => {
      const dia = i + 1;
      const key = `${y}-${String(m).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      const txs = porDia[key] || [];
      return { dia, date: key, total: txs.reduce((s, t) => s + t.amount, 0), transacciones: txs };
    });
    const totalMes = dias.reduce((s, d) => s + d.total, 0);
    const maxTotal = Math.max(1, ...dias.map((d) => d.total));
    // Lunes = 0 ... Domingo = 6, para que la grilla empiece en lunes.
    const primerDiaSemana = (new Date(y, m - 1, 1).getDay() + 6) % 7;

    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2"><ShoppingCart size={22} strokeWidth={1.75} />Gastos</h1>
            <div className="flex gap-1 mt-3 bg-background border border-border rounded-lg p-0.5 w-fit">
              <Link href="/gastos" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md text-muted hover:text-foreground transition-colors">
                <LayoutList size={13} /> Lista
              </Link>
              <Link href="/gastos?vista=calendario" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-surface shadow-sm font-medium">
                <CalendarDays size={13} /> Calendario
              </Link>
            </div>
          </div>
          <Link
            href="/registrar"
            className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            + Registrar gasto
          </Link>
        </div>

        <div className="mt-6">
          <GastoCalendario
            mesKey={mesKey}
            dias={dias}
            primerDiaSemana={primerDiaSemana}
            decimales={decimales}
            categorias={categories}
            medios={medios}
            maxTotal={maxTotal}
            totalMes={totalMes}
          />
        </div>
      </div>
    );
  }

  if (cat) {
    const category = categories.find((c) => c.id === cat);
    const transactions = await listTransactionsByCategory(cat, range);
    const medios = await getPaymentMethods();

    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex justify-between items-start">
          <div>
            <Link href="/gastos" className="text-sm text-muted hover:text-accent">
              ← Todas las categorías
            </Link>
            <h1 className="text-2xl font-semibold mt-2 flex items-center gap-2">
              <CategoryIcon icon={category?.icon} size={22} />
              {category?.name}
            </h1>
            <p className="text-muted text-sm mt-1">
              S/ {formatMonto(spendByCategory[cat] || 0, decimales)} en {rangeLabel.toLowerCase()} · {transactions.length} transacciones
            </p>
          </div>
          <DescargarReporte
            filename={`gastos-${(category?.name || "categoria").toLowerCase().replace(/\s+/g, "-")}`}
            title={`Gastos — ${category?.name || "Categoría"}`}
            subtitle={`S/ ${formatMonto(spendByCategory[cat] || 0, decimales)} en ${rangeLabel.toLowerCase()} · ${transactions.length} transacciones · generado el ${new Date().toLocaleDateString("es-PE")}`}
            headers={["Fecha", "Monto", "Comercio", "Medio de pago", "Notas"]}
            rows={transactions.map((t) => [
              new Date(t.date).toLocaleDateString("es-PE"),
              t.amount.toFixed(2),
              t.merchant || "",
              t.paymentMethod?.name || "",
              t.notes || "",
            ])}
          />
        </div>

        <div className="mt-6 space-y-2">
          {transactions.length === 0 && (
            <p className="text-sm text-muted">Sin gastos registrados en esta categoría en este período.</p>
          )}
          {transactions.map((t) => (
            <TransactionRow key={t.id} transaccion={t} categorias={categories} medios={medios} />
          ))}
        </div>
      </div>
    );
  }

  const trend = await getMonthlyTrend();
  const maxTrend = Math.max(1, ...trend.map((m) => m.total));

  const conCategoriasConGasto = categories
    .map((c, i) => ({ ...c, monto: spendByCategory[c.id] || 0, color: c.color || colorForIndex(i) }))
    .filter((c) => c.monto > 0)
    .sort((a, b) => b.monto - a.monto);
  const totalRango = conCategoriasConGasto.reduce((s, c) => s + c.monto, 0);

  const gradientStops = conCategoriasConGasto
    .reduce<{ acumulado: number; stops: string[] }>(
      (acc, c) => {
        const desdePct = (acc.acumulado / totalRango) * 100;
        const nuevoAcumulado = acc.acumulado + c.monto;
        const hastaPct = (nuevoAcumulado / totalRango) * 100;
        acc.stops.push(`${c.color} ${desdePct}% ${hastaPct}%`);
        return { acumulado: nuevoAcumulado, stops: acc.stops };
      },
      { acumulado: 0, stops: [] }
    )
    .stops.join(", ");

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><ShoppingCart size={22} strokeWidth={1.75} />Gastos</h1>
          <div className="flex gap-1 mt-3 mb-1 bg-background border border-border rounded-lg p-0.5 w-fit">
            <Link href="/gastos" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-surface shadow-sm font-medium">
              <LayoutList size={13} /> Lista
            </Link>
            <Link href="/gastos?vista=calendario" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md text-muted hover:text-foreground transition-colors">
              <CalendarDays size={13} /> Calendario
            </Link>
          </div>
          <RangoSelector
            preset={preset}
            label={rangeLabel}
            desde={desde || toDateInputValue(range.start)}
            hasta={hasta || toDateInputValue(new Date(range.end.getTime() - 86400000))}
            basePath="/gastos"
          />
        </div>
        <Link
          href="/registrar"
          className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          + Registrar gasto
        </Link>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5 mt-6">
        <p className="text-sm font-medium mb-4">Por categoría</p>
        {totalRango === 0 ? (
          <p className="text-sm text-muted">Aún no hay gastos en este período para graficar.</p>
        ) : (
          <div className="flex items-center gap-8">
            <div
              className="w-44 h-44 rounded-full shrink-0 relative"
              style={{ background: `conic-gradient(${gradientStops})` }}
            >
              <div className="absolute inset-4 bg-surface rounded-full flex flex-col items-center justify-center">
                <span className="text-xs text-muted">Total</span>
                <span className="text-base font-semibold">S/ {formatMonto(totalRango, decimales)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 flex-1 min-w-0">
              {conCategoriasConGasto.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: c.color }}>
                    <CategoryIcon icon={c.icon} size={11} />
                  </div>
                  <span className="text-muted truncate flex-1">{c.name}</span>
                  <span className="font-medium">{Math.round((c.monto / totalRango) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5 mt-4">
        <p className="text-sm font-medium mb-4">Tendencia, últimos 6 meses</p>
        <div className="flex items-end gap-2 h-32">
          {trend.map((m) => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div
                className="w-full rounded-t"
                style={{ height: `${(m.total / maxTrend) * 100}%`, background: m.total > 0 ? "var(--accent)" : "var(--border)", minHeight: 2 }}
                title={`${m.label}: S/ ${formatMonto(m.total, decimales)}`}
              />
              <span className="text-[10px] text-muted">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
        {categories.map((c, i) => (
          <Link
            key={c.id}
            href={`/gastos?cat=${c.id}&rango=${preset}${desde ? `&desde=${desde}` : ""}${hasta ? `&hasta=${hasta}` : ""}`}
            className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4 hover:border-accent transition-colors"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: c.color || colorForIndex(i) }}>
              <CategoryIcon icon={c.icon} size={16} />
            </div>
            <p className="text-sm mt-2">{c.name}</p>
            <p className="text-lg font-semibold mt-0.5">S/ {formatMonto(spendByCategory[c.id] || 0, decimales)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
