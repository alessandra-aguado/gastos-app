import { getTopCategories, getSpendByTopCategory, getBudgets } from "@/lib/queries";
import { setBudget } from "@/lib/actions";
import PresupuestoTabs from "../components/PresupuestoTabs";

export const dynamic = "force-dynamic";

export default async function PresupuestoPage() {
  const categories = await getTopCategories();
  const spendByCategory = await getSpendByTopCategory();
  const budgets = await getBudgets();
  const budgetMap: Record<string, number> = {};
  for (const b of budgets) budgetMap[b.categoryId] = b.amountLimit;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold">📊 Presupuesto</h1>
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
            <div key={c.id} className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {c.icon} {c.name}
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
            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex justify-between items-center text-sm text-muted mb-2.5">
                <span>Ingreso mensual</span>
                <span className="text-foreground font-medium">S/ 3,500</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted py-1.5">
                <span>
                  Fijos <span className="bg-accent-soft text-accent text-[10px] px-1.5 py-0.5 rounded ml-1">Auto</span>
                </span>
                <span className="text-foreground">− S/ 800</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted py-1.5">
                <span>
                  Debo, cuotas de agosto <span className="bg-accent-soft text-accent text-[10px] px-1.5 py-0.5 rounded ml-1">Auto</span>
                </span>
                <span className="text-foreground">− S/ 450</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 mt-1.5 border-t border-border">
                <span className="text-sm text-muted">Disponible antes de planes</span>
                <span className="text-base font-medium">S/ 2,250</span>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-sm text-muted">Gastos planeados</span>
                <button className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">+ Agregar plan</button>
              </div>
              <div className="flex justify-between items-center text-sm py-1.5">
                <span>Concierto <span className="text-muted">· Entretenimiento</span></span>
                <span>S/ 80</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1.5">
                <span>Taxi al concierto <span className="text-muted">· Transporte</span></span>
                <span>S/ 20</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1.5">
                <span>Salida con Marco <span className="text-muted">· Amigos</span></span>
                <span>S/ 50</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 mt-1.5 border-t border-border">
                <span className="text-sm text-muted">Subtotal planeado</span>
                <span className="text-sm font-medium">S/ 150</span>
              </div>
            </div>

            <div className="bg-accent-soft rounded-2xl p-5">
              <p className="text-xs text-accent">Disponible real este mes</p>
              <p className="text-2xl font-semibold text-accent">S/ 2,100</p>
              <p className="text-[11px] text-accent mt-0.5">3,500 − 800 fijos − 450 debo − 150 planeado</p>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex justify-between text-sm text-muted mb-2">
                <span>Real vs proyectado, planes de agosto</span>
                <span className="text-foreground">S/ 62 de S/ 150</span>
              </div>
              <div className="h-1.5 rounded-full bg-background overflow-hidden">
                <div className="h-full rounded-full bg-accent" style={{ width: "41%" }} />
              </div>
              <p className="text-xs text-muted mt-2.5">Al cerrar el mes verás aquí el contraste final entre lo proyectado y lo que gastaste de verdad.</p>
            </div>
          </div>
        }
      />
      </div>
    </div>
  );
}
