import { getTopCategories, getSpendByTopCategory, getBudgets, getFijos, getDeudas, getSettings } from "@/lib/queries";
import { PieChart } from "lucide-react";
import CategoryIcon from "../components/CategoryIcon";
import { setBudget } from "@/lib/actions";
import PresupuestoTabs from "../components/PresupuestoTabs";
import IngresoMensualField from "./IngresoMensualField";

export const dynamic = "force-dynamic";

export default async function PresupuestoPage() {
  const [categories, spendByCategory, budgets, fijos, deudas, settings] = await Promise.all([
    getTopCategories(),
    getSpendByTopCategory(),
    getBudgets(),
    getFijos(),
    getDeudas(),
    getSettings(),
  ]);
  const budgetMap: Record<string, number> = {};
  for (const b of budgets) budgetMap[b.categoryId] = b.amountLimit;

  const totalFijos = fijos.reduce((s, f) => s + f.amount, 0);
  const cuotasTarjetas = deudas
    .filter((d) => d.type === "tarjeta_credito" && d.status !== "pagada")
    .reduce((s, d) => s + (d.minPayment || 0), 0);
  const ingresoMensual = settings?.monthlyIncome || 0;
  const disponibleAntesDePlanes = ingresoMensual - totalFijos - cuotasTarjetas;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold flex items-center gap-2"><PieChart size={22} strokeWidth={1.75} />Presupuesto</h1>
      <p className="text-muted text-sm mt-2">
        Define un límite mensual por categoría, o revisa cuánto tienes disponible este mes.
      </p>

      <div className="mt-6">
      <PresupuestoTabs
        limites={
      <div className="space-y-3">
        {categories.map((c) => {
          const limit = budgetMap[c.id] || 0;
          const spent = spendByCategory[c.id] || 0;
          const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
          const over = limit > 0 && spent > limit;

          return (
            <div key={c.id} className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: c.color || "#F2F2F3" }}>
                    <CategoryIcon icon={c.icon} size={13} />
                  </span>
                  {c.name}
                </p>
                <p className="text-sm text-muted">
                  S/ {spent.toFixed(0)} {limit > 0 ? `/ S/ ${limit.toFixed(0)}` : ""}
                </p>
              </div>

              {limit > 0 && (
                <div className="mt-2 h-2 rounded-full bg-background overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: over ? "#e11d48" : "var(--accent)",
                    }}
                  />
                </div>
              )}

              <form action={setBudget} className="mt-3 flex items-center gap-2">
                <input type="hidden" name="categoryId" value={c.id} />
                <input
                  name="amountLimit"
                  type="number"
                  step="1"
                  placeholder="Límite mensual (S/)"
                  defaultValue={limit || undefined}
                  className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm bg-background"
                />
                <button
                  type="submit"
                  className="text-sm px-3 py-1.5 rounded-lg border border-border hover:border-accent transition-colors"
                >
                  Guardar
                </button>
              </form>
            </div>
          );
        })}
      </div>
        }
        proyeccion={
          <div className="space-y-3">
            <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
              <IngresoMensualField monthlyIncome={settings?.monthlyIncome ?? null} />
              <div className="flex justify-between items-center text-sm text-muted py-1.5">
                <span>
                  Fijos <span className="bg-accent-soft text-accent text-[10px] px-1.5 py-0.5 rounded ml-1">Auto</span>
                </span>
                <span className="text-foreground">− S/ {totalFijos.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted py-1.5">
                <span>
                  Deuda, cuotas de tarjetas <span className="bg-accent-soft text-accent text-[10px] px-1.5 py-0.5 rounded ml-1">Auto</span>
                </span>
                <span className="text-foreground">− S/ {cuotasTarjetas.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 mt-1.5 border-t border-border">
                <span className="text-sm text-muted">Disponible antes de planes</span>
                <span className="text-base font-medium">S/ {disponibleAntesDePlanes.toFixed(0)}</span>
              </div>
              {!settings?.monthlyIncome && (
                <p className="text-xs text-muted mt-2.5">Define tu ingreso mensual arriba para ver el disponible real.</p>
              )}
            </div>

            <div className="border border-dashed border-border rounded-xl p-5 text-center text-muted text-sm">
              Los gastos variables planeados (y su contraste con lo que termines gastando de verdad) llegan en la próxima actualización.
            </div>
          </div>
        }
      />
      </div>
    </div>
  );
}
