import { getTopCategories, getSpendByTopCategory, getBudgets, getFijos, getDeudas, getSettings, getGastoVariableReal } from "@/lib/queries";
import { formatMonto } from "@/lib/format";
import { PieChart } from "lucide-react";
import CategoryIcon from "../components/CategoryIcon";
import { setBudget } from "@/lib/actions";
import PresupuestoTabs from "../components/PresupuestoTabs";
import IngresoMensualField from "./IngresoMensualField";

export const dynamic = "force-dynamic";

export default async function PresupuestoPage() {
  const [categories, spendByCategory, budgets, fijos, deudas, settings, gastoVariableReal] = await Promise.all([
    getTopCategories(),
    getSpendByTopCategory(),
    getBudgets(),
    getFijos(),
    getDeudas(),
    getSettings(),
    getGastoVariableReal(),
  ]);
  const budgetMap: Record<string, number> = {};
  for (const b of budgets) budgetMap[b.categoryId] = b.amountLimit;

  const totalFijos = fijos.reduce((s, f) => s + f.amount, 0);
  const cuotasTarjetas = deudas
    .filter((d) => d.type === "tarjeta_credito" && d.status !== "pagada")
    .reduce((s, d) => s + (d.minPayment || 0), 0);
  const decimales = settings?.decimales ?? 0;
  const ingresoMensual = settings?.monthlyIncome || 0;
  const disponibleAntesDePlanes = ingresoMensual - totalFijos - cuotasTarjetas;
  const totalPlanVariable = budgets.reduce((s, b) => s + b.amountLimit, 0);
  const disponibleDespuesDePlanes = disponibleAntesDePlanes - totalPlanVariable;
  const diffVariable = totalPlanVariable - gastoVariableReal;

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
                  S/ {formatMonto(spent, decimales)} {limit > 0 ? `/ S/ ${formatMonto(limit, decimales)}` : ""}
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
                <span className="text-foreground">− S/ {formatMonto(totalFijos, decimales)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted py-1.5">
                <span>
                  Deuda, cuotas de tarjetas <span className="bg-accent-soft text-accent text-[10px] px-1.5 py-0.5 rounded ml-1">Auto</span>
                </span>
                <span className="text-foreground">− S/ {formatMonto(cuotasTarjetas, decimales)}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 mt-1.5 border-t border-border">
                <span className="text-sm text-muted">Disponible antes de planes</span>
                <span className="text-base font-medium">S/ {formatMonto(disponibleAntesDePlanes, decimales)}</span>
              </div>
              {!settings?.monthlyIncome && (
                <p className="text-xs text-muted mt-2.5">Define tu ingreso mensual arriba para ver el disponible real.</p>
              )}
            </div>

            <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
              <div className="flex justify-between items-center text-sm text-muted py-1.5">
                <span>
                  Gastos variables planificados <span className="bg-accent-soft text-accent text-[10px] px-1.5 py-0.5 rounded ml-1">Auto</span>
                </span>
                <span className="text-foreground">− S/ {formatMonto(totalPlanVariable, decimales)}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 mt-1.5 border-t border-border">
                <span className="text-sm text-muted">Disponible después de planes</span>
                <span className="text-base font-medium">S/ {formatMonto(disponibleDespuesDePlanes, decimales)}</span>
              </div>
              {totalPlanVariable === 0 && (
                <p className="text-xs text-muted mt-2.5">
                  Define límites por categoría en la pestaña &quot;Límites&quot; para planificar tus gastos variables.
                </p>
              )}
            </div>

            <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
              <p className="text-sm font-medium mb-3">Planificado vs. real este mes</p>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-muted">Planificado (límites por categoría)</span>
                <span>S/ {formatMonto(totalPlanVariable, decimales)}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-muted">Gastado (variable, sin fijos)</span>
                <span>S/ {formatMonto(gastoVariableReal, decimales)}</span>
              </div>
              {totalPlanVariable > 0 && (
                <div className="h-2 rounded-full bg-background overflow-hidden mb-2.5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((gastoVariableReal / totalPlanVariable) * 100))}%`,
                      background: gastoVariableReal > totalPlanVariable ? "#e11d48" : "var(--accent)",
                    }}
                  />
                </div>
              )}
              <p className={`text-xs ${totalPlanVariable === 0 ? "text-muted" : diffVariable >= 0 ? "text-positive" : "text-warning"}`}>
                {totalPlanVariable === 0
                  ? "Aún no tienes límites definidos, así que no hay con qué comparar tu gasto real."
                  : diffVariable >= 0
                  ? `Vas bien: te quedan S/ ${formatMonto(diffVariable, decimales)} de tu plan este mes.`
                  : `Te excediste por S/ ${formatMonto(Math.abs(diffVariable), decimales)} sobre lo planificado.`}
              </p>
            </div>
          </div>
        }
      />
      </div>
    </div>
  );
}
