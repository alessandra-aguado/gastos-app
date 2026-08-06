import { getTopCategories, getSpendByTopCategory, getBudgets } from "@/lib/queries";
import { setBudget } from "@/lib/actions";

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
        Define un límite mensual por categoría. Cuando te acerques al límite, en fases siguientes te avisamos.
      </p>

      <div className="mt-6 space-y-3">
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
    </div>
  );
}
