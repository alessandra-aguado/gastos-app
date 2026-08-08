import { getTopCategories, getSpendByTopCategory, getBudgets, getFijos, getDeudas, getSettings, getGastoVariableReal, getPlannedExpenses, getGastoDelMesPorMedio, getPaymentMethods, getCuentas, getDebtPaymentPlans, getPlannedExpensesCredito, agruparPlanificadosPorCorte, getSavingsPlan, nextMonthKeys, currentMonthKey } from "@/lib/queries";
import { formatMonto } from "@/lib/format";
import { PieChart } from "lucide-react";
import CategoryIcon from "../components/CategoryIcon";
import { setBudget } from "@/lib/actions";
import PresupuestoTabs from "../components/PresupuestoTabs";
import IngresoMensualField from "./IngresoMensualField";
import PlannedExpenseModal from "./PlannedExpenseModal";
import PlannedExpenseRow from "./PlannedExpenseRow";
import PlanPagoDeudaRow from "./PlanPagoDeudaRow";
import SavingsPlanField from "../ahorro/SavingsPlanField";
import LineaExpandible from "./LineaExpandible";

export const dynamic = "force-dynamic";

export default async function PresupuestoPage() {
  const [categories, spendByCategory, budgets, fijos, deudas, settings, gastoVariableReal, planificados, gastoPorMedio, medios, cuentas] = await Promise.all([
    getTopCategories(),
    getSpendByTopCategory(),
    getBudgets(),
    getFijos(),
    getDeudas(),
    getSettings(),
    getGastoVariableReal(),
    getPlannedExpenses(),
    getGastoDelMesPorMedio(),
    getPaymentMethods(),
    getCuentas(),
  ]);

  const mesActual = currentMonthKey();
  const mesesPlan = nextMonthKeys(3);
  const [planesPago, planificadosCredito, planAhorro] = await Promise.all([
    getDebtPaymentPlans(mesesPlan),
    getPlannedExpensesCredito(),
    getSavingsPlan(mesActual),
  ]);
  const planificadosPorMedioYMes = agruparPlanificadosPorCorte(planificadosCredito, mesesPlan);
  const tarjetasActivas = deudas.filter((d) => d.type === "tarjeta_credito" && d.status !== "pagada");
  const planesPorDeuda: Record<string, typeof planesPago> = {};
  for (const p of planesPago) {
    if (!planesPorDeuda[p.debtId]) planesPorDeuda[p.debtId] = [];
    planesPorDeuda[p.debtId].push(p);
  }
  const planMesActualPorDeuda: Record<string, number> = {};
  for (const p of planesPago) {
    if (p.month === mesActual) planMesActualPorDeuda[p.debtId] = p.amount;
  }
  const budgetMap: Record<string, number> = {};
  for (const b of budgets) budgetMap[b.categoryId] = b.amountLimit;

  // Fijos pagados con tarjeta de crédito no salen de tu bolsillo este mes: se suman
  // a la deuda de esa tarjeta, y es la cuota de esa tarjeta la que sí te toca pagar.
  // Por eso no se restan del disponible junto con los fijos de débito/efectivo — eso
  // sería contarlos dos veces (una como Fijo, otra escondidos en la cuota de la tarjeta).
  const fijosConTarjeta = fijos.filter((f) => f.paymentMethod?.type === "credito");
  const fijosSinTarjeta = fijos.filter((f) => f.paymentMethod?.type !== "credito");
  const totalFijos = fijosSinTarjeta.reduce((s, f) => s + f.amount, 0);
  const totalFijosTarjeta = fijosConTarjeta.reduce((s, f) => s + f.amount, 0);

  const cuotasTarjetas = tarjetasActivas.reduce((s, d) => s + (planMesActualPorDeuda[d.id] ?? d.minPayment ?? 0), 0);
  const usaPlanDePago = tarjetasActivas.some((d) => planMesActualPorDeuda[d.id] !== undefined);
  const decimales = settings?.decimales ?? 0;
  const ingresoMensual = settings?.monthlyIncome || 0;
  const ahorroPlanMes = planAhorro?.totalAmount || 0;
  const disponibleAntesDePlanes = ingresoMensual - totalFijos - cuotasTarjetas - ahorroPlanMes;
  const totalPlanVariable = budgets.reduce((s, b) => s + b.amountLimit, 0);
  const disponibleDespuesDePlanes = disponibleAntesDePlanes - totalPlanVariable;
  const diffVariable = totalPlanVariable - gastoVariableReal;

  const pendientes = planificados.filter((p) => p.status === "pendiente");
  const totalPlanificadoPendiente = pendientes.reduce((s, p) => s + p.amount, 0);

  const cuentaPorMedio: Record<string, (typeof cuentas)[number]> = {};
  for (const c of cuentas) {
    if (c.paymentMethodId) cuentaPorMedio[c.paymentMethodId] = c;
  }
  const planificadoPorMedio: Record<string, number> = {};
  for (const p of pendientes) {
    if (p.paymentMethodId) planificadoPorMedio[p.paymentMethodId] = (planificadoPorMedio[p.paymentMethodId] || 0) + p.amount;
  }
  const proyeccionPorMedio = medios
    .filter((m) => cuentaPorMedio[m.id] && (planificadoPorMedio[m.id] || gastoPorMedio[m.id]))
    .map((m) => {
      const cuenta = cuentaPorMedio[m.id];
      const gastado = gastoPorMedio[m.id] || 0;
      const planificado = planificadoPorMedio[m.id] || 0;
      const saldoProyectado = cuenta.balance - gastado - planificado;
      return { medio: m, cuenta, gastado, planificado, saldoProyectado };
    });

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
                  step="any"
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
        planificados={
          <div className="space-y-3">
            <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
              <p className="text-sm font-medium mb-1">Plan de ahorro/inversión de este mes</p>
              <p className="text-xs text-muted mb-3">
                Lo que separas antes de gastar. Se resta de tu disponible en Proyección, igual que un fijo.
              </p>
              <SavingsPlanField month={mesActual} plan={planAhorro} />
            </div>

            {tarjetasActivas.length > 0 && (
              <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
                <p className="text-sm font-medium mb-1">Plan de pago de tarjetas</p>
                <p className="text-xs text-muted mb-3">
                  ¿En qué mes piensas pagar cada tarjeta y por cuánto? Esto reemplaza el cálculo automático de pago mínimo en Proyección y el Simulador.
                </p>
                {tarjetasActivas.map((d) => (
                  <PlanPagoDeudaRow key={d.id} deuda={d} planes={planesPorDeuda[d.id] || []} mesesDisponibles={mesesPlan} planificadoPorMes={d.paymentMethodId ? planificadosPorMedioYMes[d.paymentMethodId] : undefined} />
                ))}
              </div>
            )}

            <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium">
                  Gastos planificados (por hacer)
                  {totalPlanificadoPendiente > 0 && <span className="text-muted font-normal"> · S/ {formatMonto(totalPlanificadoPendiente, decimales)}</span>}
                </p>
                <PlannedExpenseModal categorias={categories} medios={medios} />
              </div>
              <p className="text-xs text-muted mb-3">
                Cosas concretas que crees que vas a gastar o prestar este mes, con su medio de pago, para ver si te alcanza antes de que pasen.
              </p>
              {pendientes.length === 0 ? (
                <div className="border border-dashed border-border rounded-lg p-4 text-center text-muted text-xs">
                  Sin gastos planificados este mes.
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  {pendientes.map((p, idx) => (
                    <PlannedExpenseRow key={p.id} item={p} categorias={categories} medios={medios} ultimo={idx === pendientes.length - 1} />
                  ))}
                </div>
              )}
            </div>

            {proyeccionPorMedio.length > 0 && (
              <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
                <p className="text-sm font-medium mb-1">Saldo proyectado por medio de pago</p>
                <p className="text-xs text-muted mb-3">
                  Tu último saldo confirmado, menos lo que ya gastaste este mes con ese medio, menos lo planificado pendiente.
                </p>
                <div className="space-y-2.5">
                  {proyeccionPorMedio.map(({ medio, cuenta, gastado, planificado, saldoProyectado }) => (
                    <div key={medio.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{medio.name}</p>
                        <p className="text-xs text-muted">
                          S/ {formatMonto(cuenta.balance, decimales)} confirmado
                          {gastado > 0 ? ` · − S/ ${formatMonto(gastado, decimales)} gastado` : ""}
                          {planificado > 0 ? ` · − S/ ${formatMonto(planificado, decimales)} planificado` : ""}
                        </p>
                      </div>
                      <span className={`font-medium ${saldoProyectado < 0 ? "text-warning" : ""}`}>
                        S/ {formatMonto(saldoProyectado, decimales)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        }
        proyeccion={
          <div className="space-y-3">
            <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
              <IngresoMensualField monthlyIncome={settings?.monthlyIncome ?? null} />
              <LineaExpandible
                label="Fijos"
                badge="Auto"
                total={totalFijos}
                filas={fijosSinTarjeta.map((f) => ({ label: f.name, sublabel: f.paymentMethod?.name, amount: f.amount }))}
              />
              <LineaExpandible
                label="Deuda, cuotas de tarjetas"
                badge={usaPlanDePago ? "Tu plan" : "Auto"}
                total={cuotasTarjetas}
                filas={tarjetasActivas.map((d) => ({
                  label: d.counterpartName || "Tarjeta de crédito",
                  sublabel: planMesActualPorDeuda[d.id] !== undefined ? "según tu plan" : "pago mínimo",
                  amount: planMesActualPorDeuda[d.id] ?? d.minPayment ?? 0,
                }))}
              />
              {usaPlanDePago && (
                <p className="text-xs text-muted -mt-1 mb-1">Incluye tu plan de pago de tarjetas de la pestaña &quot;Planificados&quot; para este mes.</p>
              )}
              {ahorroPlanMes > 0 && (
                <div className="flex justify-between items-center text-sm text-muted py-1.5">
                  <span>
                    Ahorro/Inversión planificado <span className="bg-accent-soft text-accent text-[10px] px-1.5 py-0.5 rounded ml-1">Tu plan</span>
                  </span>
                  <span className="text-foreground">− S/ {formatMonto(ahorroPlanMes, decimales)}</span>
                </div>
              )}
              {totalFijosTarjeta > 0 && (
                <div className="flex justify-between items-center text-xs text-muted py-1">
                  <span>Fijos con tarjeta (ya en tu deuda, no se resta aparte)</span>
                  <span>S/ {formatMonto(totalFijosTarjeta, decimales)}</span>
                </div>
              )}
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
