import { getSettings, getFijos, getDeudas, getTopCategories, getPaymentMethods, getSimulationItems, getDebtPaymentPlans, getPlannedExpensesCredito, agruparPlanificadosPorCorte, nextMonthKeys } from "@/lib/queries";
import { formatMonto } from "@/lib/format";
import { Calculator } from "lucide-react";
import SimulationItemModal from "./SimulationItemModal";
import SimulationItemRow from "./SimulationItemRow";

export const dynamic = "force-dynamic";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function etiquetaMes(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
}

export default async function SimuladorPage() {
  const months = nextMonthKeys(3);
  const [settings, fijos, deudas, categories, medios, items, planesPago, planificadosCredito] = await Promise.all([
    getSettings(),
    getFijos(),
    getDeudas(),
    getTopCategories(),
    getPaymentMethods(),
    getSimulationItems(months),
    getDebtPaymentPlans(months),
    getPlannedExpensesCredito(),
  ]);
  const planificadosPorMedioYMes = agruparPlanificadosPorCorte(planificadosCredito, months);

  const decimales = settings?.decimales ?? 0;
  const ingresoBase = settings?.monthlyIncome || 0;
  const alertaDefault = settings?.alertaTarjetaDefault ?? 30;

  const planPorDeudaMes: Record<string, Record<string, number>> = {};
  for (const p of planesPago) {
    if (!planPorDeudaMes[p.debtId]) planPorDeudaMes[p.debtId] = {};
    planPorDeudaMes[p.debtId][p.month] = p.amount;
  }

  const fijosSinTarjeta = fijos.filter((f) => f.paymentMethod?.type !== "credito").reduce((s, f) => s + f.amount, 0);
  const fijosConTarjetaPorMedio: Record<string, number> = {};
  for (const f of fijos) {
    if (f.paymentMethod?.type === "credito" && f.paymentMethodId) {
      fijosConTarjetaPorMedio[f.paymentMethodId] = (fijosConTarjetaPorMedio[f.paymentMethodId] || 0) + f.amount;
    }
  }

  const tarjetas = deudas.filter((d) => d.type === "tarjeta_credito" && d.status !== "pagada");
  function cuotasTarjetasMes(mes: string) {
    return tarjetas.reduce((s, d) => s + (planPorDeudaMes[d.id]?.[mes] ?? d.minPayment ?? 0), 0);
  }

  const deudasActivas = deudas.filter((d) => d.status !== "pagada" && (d.type === "tarjeta_credito" || d.direction === "yo_debo"));

  const itemsPorMes: Record<string, typeof items> = {};
  for (const m of months) itemsPorMes[m] = items.filter((i) => i.month === m);

  const filas: { mes: string; itemsMes: typeof items; ingresosHip: number; gastosHip: number; cuotasTarjetas: number; saldoDelMes: number; saldoAcumulado: number }[] = [];
  for (const mes of months) {
    const itemsMes = itemsPorMes[mes];
    const ingresosHip = itemsMes.filter((i) => i.type === "ingreso").reduce((s, i) => s + i.amount, 0);
    const gastosHip = itemsMes.filter((i) => i.type === "gasto" || i.type === "prestamo").reduce((s, i) => s + i.amount, 0);
    const cuotas = cuotasTarjetasMes(mes);
    const saldoDelMes = ingresoBase + ingresosHip - fijosSinTarjeta - cuotas - gastosHip;
    const previo = filas.length > 0 ? filas[filas.length - 1].saldoAcumulado : 0;
    filas.push({ mes, itemsMes, ingresosHip, gastosHip, cuotasTarjetas: cuotas, saldoDelMes, saldoAcumulado: previo + saldoDelMes });
  }

  const proyeccionTarjetas = tarjetas.map((d) => {
    let balance = d.balance;
    const umbral = d.alertaPorcentaje ?? alertaDefault;
    const porMes = months.map((mes) => {
      const itemsMes = itemsPorMes[mes];
      const cargosFijos = d.paymentMethodId ? fijosConTarjetaPorMedio[d.paymentMethodId] || 0 : 0;
      const cargosHip = itemsMes.filter((i) => (i.type === "gasto" || i.type === "prestamo") && i.paymentMethodId === d.paymentMethodId).reduce((s, i) => s + i.amount, 0);
      const cargosPlanificados = d.paymentMethodId ? planificadosPorMedioYMes[d.paymentMethodId]?.[mes] || 0 : 0;
      const pagoExtra = itemsMes.filter((i) => i.type === "pago_deuda" && i.debtId === d.id).reduce((s, i) => s + i.amount, 0);
      const planMes = planPorDeudaMes[d.id]?.[mes];
      const pagoDeuda = planMes ?? (d.minPayment || 0);
      balance = Math.max(0, balance + cargosFijos + cargosHip + cargosPlanificados - pagoDeuda - pagoExtra);
      const pctUso = d.creditLimit ? Math.min(999, Math.round((balance / d.creditLimit) * 100)) : null;
      return { mes, balance, pctUso, umbral, segunPlan: planMes !== undefined, cargosPlanificados };
    });
    return { deuda: d, porMes };
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold flex items-center gap-2"><Calculator size={22} strokeWidth={1.75} />Simulador</h1>
      <p className="text-muted text-sm mt-2">
        Un espacio de prueba para jugar con escenarios de varios meses — nada de lo que agregues aquí se vuelve un gasto, deuda o fijo real.
      </p>

      <div className="mt-6 space-y-4">
        {filas.map(({ mes, itemsMes, saldoDelMes, cuotasTarjetas: cuotasMes, saldoAcumulado: acumulado }) => (
          <div key={mes} className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium capitalize">{etiquetaMes(mes)}</p>
              <SimulationItemModal month={mes} categorias={categories} medios={medios} deudas={deudasActivas} />
            </div>

            <div className="flex justify-between items-center text-sm text-muted py-1">
              <span>Ingreso mensual</span>
              <span className="text-foreground">S/ {formatMonto(ingresoBase, decimales)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted py-1">
              <span>Fijos (débito/efectivo)</span>
              <span className="text-foreground">− S/ {formatMonto(fijosSinTarjeta, decimales)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted py-1 mb-2">
              <span>Cuotas de tarjetas</span>
              <span className="text-foreground">− S/ {formatMonto(cuotasMes, decimales)}</span>
            </div>

            {itemsMes.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden mb-3">
                {itemsMes.map((it, idx) => (
                  <SimulationItemRow key={it.id} item={it} month={mes} categorias={categories} medios={medios} deudas={deudasActivas} ultimo={idx === itemsMes.length - 1} />
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-2.5 border-t border-border">
              <span className="text-sm text-muted">Saldo de este mes</span>
              <span className={`text-base font-medium ${saldoDelMes < 0 ? "text-warning" : ""}`}>S/ {formatMonto(saldoDelMes, decimales)}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-muted">Saldo acumulado desde hoy</span>
              <span className={`text-sm font-medium ${acumulado < 0 ? "text-warning" : "text-positive"}`}>S/ {formatMonto(acumulado, decimales)}</span>
            </div>
          </div>
        ))}

        {proyeccionTarjetas.length > 0 && (
          <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
            <p className="text-sm font-medium mb-1">Proyección de tus tarjetas</p>
            <p className="text-xs text-muted mb-3">
              Si sigues cargándoles tus fijos y solo pagas la cuota mínima, así se vería su saldo.
            </p>
            <div className="space-y-4">
              {proyeccionTarjetas.map(({ deuda, porMes }) => (
                <div key={deuda.id}>
                  <p className="text-sm font-medium mb-1.5">{deuda.counterpartName || "Tarjeta de crédito"}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {porMes.map(({ mes, balance, pctUso, umbral, segunPlan, cargosPlanificados }) => (
                      <div key={mes} className="border border-border rounded-lg p-2.5">
                        <p className="text-[11px] text-muted capitalize mb-1">{etiquetaMes(mes).split(" ")[0]}</p>
                        <p className={`text-sm font-medium ${pctUso !== null && pctUso >= umbral ? "text-warning" : ""}`}>S/ {formatMonto(balance, decimales)}</p>
                        {pctUso !== null && (
                          <p className={`text-[11px] ${pctUso >= umbral ? "text-warning" : "text-muted"}`}>{pctUso}% de tu línea</p>
                        )}
                        <p className="text-[10px] text-muted mt-0.5">{segunPlan ? "según tu plan" : "pago mínimo est."}</p>
                        {cargosPlanificados > 0 && (
                          <p className="text-[10px] text-accent mt-0.5">+ S/ {formatMonto(cargosPlanificados, decimales)} planificado</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
