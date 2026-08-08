import { getSettings, getFijos, getDeudas, getTopCategories, getPaymentMethods, getSimulationItems, getDebtPaymentPlans, getPlannedExpensesCredito, getPlannedExpensesPendientesTodas, getIngresosEnMeses, expandirIngresosPorMes, mesEfectivoPlanificado, agruparPlanificadosPorCorte, mesDeFacturacion, nextMonthKeys } from "@/lib/queries";
import { simularPagoTotalDeuda } from "@/lib/actions";
import { formatMonto } from "@/lib/format";
import { Calculator } from "lucide-react";
import SimulationItemModal from "./SimulationItemModal";
import SimulationItemRow from "./SimulationItemRow";
import LineaExpandible from "../components/LineaExpandible";
import SaldoAnteriorField from "./SaldoAnteriorField";

export const dynamic = "force-dynamic";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function etiquetaMes(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
}

function mesAnteriorA(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function toDateInput(d: Date) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export default async function SimuladorPage() {
  const months = nextMonthKeys(3);
  const [settings, fijos, deudas, categories, medios, items, planesPago, planificadosCredito, planificadosPendientes, ingresosRegistrados] = await Promise.all([
    getSettings(),
    getFijos(),
    getDeudas(),
    getTopCategories(),
    getPaymentMethods(),
    getSimulationItems(months),
    getDebtPaymentPlans(months),
    getPlannedExpensesCredito(),
    getPlannedExpensesPendientesTodas(),
    getIngresosEnMeses(months),
  ]);
  const planificadosPorMedioYMes = agruparPlanificadosPorCorte(planificadosCredito, months);

  // Ingresos que ya registraste en la seccion de Ingresos (reales o a futuro,
  // ej. un pago que sabes que te va a llegar) — se toman automaticamente para
  // el Simulador en vez de tener que volver a "hardcodearlos" como item
  // hipotetico aparte. Los recurrentes (ej. arriendo mensual) se repiten en
  // cada mes de su rango.
  const ingresosPorMes = expandirIngresosPorMes(ingresosRegistrados, months);
  function ingresosFilasMes(mes: string) {
    return (ingresosPorMes[mes] || []).map((i) => ({
      label: i.source || (i.type === "fijo" ? "Ingreso fijo" : "Ingreso"),
      sublabel: (i.recurrente ? "mensual · " : "") + new Date(i.date).toLocaleDateString("es-PE", { day: "numeric", month: "short" }),
      amount: i.amount,
    }));
  }
  function ingresosRealesMes(mes: string) {
    return (ingresosPorMes[mes] || []).reduce((s, i) => s + i.amount, 0);
  }

  // Todos los planificados pendientes, agrupados por el mes en el que
  // realmente van a impactar (fecha de corte si es tarjeta, mes calendario si
  // es debito/efectivo/billetera). Los que NO son con tarjeta salen de tu
  // bolsillo ese mes, asi que se restan del saldo igual que un gasto.
  const planificadosPorMesEfectivo: Record<string, typeof planificadosPendientes> = {};
  for (const p of planificadosPendientes) {
    const mes = mesEfectivoPlanificado(p);
    if (!planificadosPorMesEfectivo[mes]) planificadosPorMesEfectivo[mes] = [];
    planificadosPorMesEfectivo[mes].push(p);
  }
  function planificadosNoCreditoMes(mes: string) {
    return (planificadosPorMesEfectivo[mes] || []).filter((p) => p.paymentMethod?.type !== "credito");
  }

  const decimales = settings?.decimales ?? 0;
  const alertaDefault = settings?.alertaTarjetaDefault ?? 30;

  const planPorDeudaMes: Record<string, Record<string, number>> = {};
  for (const p of planesPago) {
    if (!planPorDeudaMes[p.debtId]) planPorDeudaMes[p.debtId] = {};
    planPorDeudaMes[p.debtId][p.month] = p.amount;
  }

  const fijosSinTarjetaLista = fijos.filter((f) => f.paymentMethod?.type !== "credito");
  const fijosSinTarjeta = fijosSinTarjetaLista.reduce((s, f) => s + f.amount, 0);
  const fijosSinTarjetaFilas = fijosSinTarjetaLista.map((f) => ({ label: f.name, sublabel: f.paymentMethod?.name, amount: f.amount }));
  const fijosConTarjetaPorMedio: Record<string, number> = {};
  for (const f of fijos) {
    if (f.paymentMethod?.type === "credito" && f.paymentMethodId) {
      fijosConTarjetaPorMedio[f.paymentMethodId] = (fijosConTarjetaPorMedio[f.paymentMethodId] || 0) + f.amount;
    }
  }

  const tarjetas = deudas.filter((d) => d.type === "tarjeta_credito" && d.status !== "pagada");
  const pagoTotalDefault = settings?.tarjetaPagoDefault === "total";

  const deudasActivas = deudas.filter((d) => d.status !== "pagada" && (d.type === "tarjeta_credito" || d.direction === "yo_debo"));

  const itemsPorMes: Record<string, typeof items> = {};
  for (const m of months) itemsPorMes[m] = items.filter((i) => i.month === m);

  const proyeccionTarjetas = tarjetas.map((d) => {
    let balance = d.balance;
    const umbral = d.alertaPorcentaje ?? alertaDefault;
    const porMes = months.map((mes, idx) => {
      const itemsMes = itemsPorMes[mes];
      const cargosFijos = d.paymentMethodId ? fijosConTarjetaPorMedio[d.paymentMethodId] || 0 : 0;
      const cargosHip = itemsMes.filter((i) => (i.type === "gasto" || i.type === "prestamo") && i.paymentMethodId === d.paymentMethodId).reduce((s, i) => s + i.amount, 0);
      const cargosPlanificados = d.paymentMethodId ? planificadosPorMedioYMes[d.paymentMethodId]?.[mes] || 0 : 0;
      const pagoExtra = itemsMes.filter((i) => i.type === "pago_deuda" && i.debtId === d.id).reduce((s, i) => s + i.amount, 0);
      const planMes = planPorDeudaMes[d.id]?.[mes];
      // Sin un plan explicito para el mes: si tu default es "pago total",
      // pagas TODO lo que vas a deber en este corte — lo que ya debes MAS lo
      // que le sigas cargando (fijos, planificados, hipoteticos) — porque asi
      // es como realmente pagas tus tarjetas (todo de una, con tu sueldo). Si
      // tu default es "minimo", solo se paga la cuota minima del saldo actual
      // y lo demas se acumula para el siguiente corte.
      const pagoDeuda = planMes ?? (pagoTotalDefault ? balance + cargosFijos + cargosHip + cargosPlanificados : (d.minPayment || 0));
      // Cuanto habria que agregar como "pago extra" para dejar la tarjeta en
      // cero este mes, sin contar dos veces lo que ya se resta por plan/minimo.
      const montoParaPagoTotal = idx === 0 ? Math.max(0, balance - pagoDeuda) : null;
      balance = Math.max(0, balance + cargosFijos + cargosHip + cargosPlanificados - pagoDeuda - pagoExtra);
      const pctUso = d.creditLimit ? Math.min(999, Math.round((balance / d.creditLimit) * 100)) : null;
      return { mes, balance, pctUso, umbral, segunPlan: planMes !== undefined, cargosPlanificados, montoParaPagoTotal, pagoDeuda };
    });
    return { deuda: d, porMes };
  });

  // Las cuotas que se restan del saldo mensual usan exactamente el mismo
  // pagoDeuda calculado arriba (plan explicito, o el default global), asi
  // que "Cuotas de tarjetas" y "Proyeccion de tus tarjetas" siempre coinciden.
  const pagoDeudaPorDeudaYMes: Record<string, Record<string, number>> = {};
  for (const { deuda, porMes } of proyeccionTarjetas) {
    pagoDeudaPorDeudaYMes[deuda.id] = {};
    for (const p of porMes) pagoDeudaPorDeudaYMes[deuda.id][p.mes] = p.pagoDeuda;
  }
  function cuotasTarjetasMes(mes: string) {
    return tarjetas.reduce((s, d) => s + (pagoDeudaPorDeudaYMes[d.id]?.[mes] ?? 0), 0);
  }
  // Desglose de "cuanto vas a pagar en total de esta tarjeta este corte":
  // la deuda pendiente que ya tienes registrada, mas todo lo que le sigas
  // cargando antes de que cierre el corte (fijos recurrentes, hipoteticos del
  // simulador, y compras planificadas). La suma de este detalle es EXACTAMENTE
  // el monto que se muestra arriba en "pago total", para que no se confundan.
  function detalleTarjetaMes(d: (typeof tarjetas)[number], mes: string) {
    const detalle: { label: string; sublabel?: string; amount: number; id?: string; fecha?: string }[] = [];
    detalle.push({ label: "Deuda pendiente", sublabel: "lo que ya debes hoy", amount: d.balance });
    if (!d.paymentMethodId) return detalle;
    for (const f of fijos) {
      if (f.paymentMethodId === d.paymentMethodId && f.paymentMethod?.type === "credito") {
        detalle.push({ label: f.name, sublabel: "fijo recurrente", amount: f.amount });
      }
    }
    const itemsMes = itemsPorMes[mes] || [];
    for (const it of itemsMes) {
      if ((it.type === "gasto" || it.type === "prestamo") && it.paymentMethodId === d.paymentMethodId) {
        detalle.push({ label: it.description, sublabel: "hipotético del simulador", amount: it.amount });
      }
    }
    for (const p of planificadosCredito) {
      if (p.paymentMethodId !== d.paymentMethodId) continue;
      const mesCorte = p.date ? mesDeFacturacion(new Date(p.date), p.paymentMethod?.billingDay) : months[0];
      if (mesCorte !== mes) continue;
      detalle.push({
        label: p.description,
        sublabel: "planificado",
        amount: p.amount,
        id: p.id,
        fecha: p.date ? toDateInput(new Date(p.date)) : undefined,
      });
    }
    return detalle;
  }

  function cuotasTarjetasFilasMes(mes: string) {
    return tarjetas.map((d) => {
      const pagoDeuda = pagoDeudaPorDeudaYMes[d.id]?.[mes] ?? 0;
      return {
        label: d.counterpartName || "Tarjeta de crédito",
        sublabel: planPorDeudaMes[d.id]?.[mes] !== undefined ? "según tu plan" : pagoTotalDefault ? "pago total" : "pago mínimo",
        amount: pagoDeuda,
        detalle: detalleTarjetaMes(d, mes),
      };
    });
  }

  const filas: { mes: string; itemsMes: typeof items; ingresosHip: number; ingresosReales: number; gastosHip: number; cuotasTarjetas: number; totalPlanificados: number; saldoDelMes: number; saldoAcumulado: number; traeDeMesAnterior: number }[] = [];
  for (const mes of months) {
    const itemsMes = itemsPorMes[mes];
    const ingresosHip = itemsMes.filter((i) => i.type === "ingreso").reduce((s, i) => s + i.amount, 0);
    const ingresosReales = ingresosRealesMes(mes);
    const gastosHip = itemsMes.filter((i) => i.type === "gasto" || i.type === "prestamo").reduce((s, i) => s + i.amount, 0);
    // Pago extra a deuda tambien sale de tu bolsillo este mes (ademas de la
    // cuota minima/plan que ya se resta en "cuotas"), asi que debe restarse
    // del saldo igual que un gasto hipotetico.
    const pagoDeudaHip = itemsMes.filter((i) => i.type === "pago_deuda").reduce((s, i) => s + i.amount, 0);
    // Gastos/prestamos planificados REALES (no hipoteticos del Simulador) que
    // no son con tarjeta: tambien salen de tu bolsillo este mes.
    const totalPlanificados = planificadosNoCreditoMes(mes).reduce((s, p) => s + p.amount, 0);
    const cuotas = cuotasTarjetasMes(mes);
    // Lo que sobro del mes anterior no desaparece: es plata real que sigue
    // en tu cuenta y con la que cuentas para vivir este mes (cobras a fin de
    // mes y ese sueldo te sostiene el mes SIGUIENTE), asi que se suma como
    // disponible ademas del ingreso de este mes.
    const traeDeMesAnterior = filas.length > 0 ? filas[filas.length - 1].saldoAcumulado : (settings?.saldoAnteriorSimulador || 0);
    const saldoDelMes = ingresosHip + ingresosReales - fijosSinTarjeta - cuotas - gastosHip - pagoDeudaHip - totalPlanificados;
    filas.push({ mes, itemsMes, ingresosHip, ingresosReales, gastosHip, cuotasTarjetas: cuotas, totalPlanificados, saldoDelMes, saldoAcumulado: traeDeMesAnterior + saldoDelMes, traeDeMesAnterior });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold flex items-center gap-2"><Calculator size={22} strokeWidth={1.75} />Simulador</h1>
      <p className="text-muted text-sm mt-2">
        Un espacio de prueba para jugar con escenarios de varios meses — nada de lo que agregues aquí se vuelve un gasto, deuda o fijo real.
      </p>

      <div className="mt-6 space-y-4">
        {filas.map(({ mes, itemsMes, saldoDelMes, cuotasTarjetas: cuotasMes, totalPlanificados, ingresosReales, saldoAcumulado: acumulado, traeDeMesAnterior }, idx) => (
          <div key={mes} className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium capitalize">{etiquetaMes(mes)}</p>
              <SimulationItemModal month={mes} categorias={categories} medios={medios} deudas={deudasActivas} />
            </div>

            {idx > 0 ? (
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-muted">Saldo anterior <span className="text-[11px]">({etiquetaMes(filas[idx - 1].mes).split(" ")[0]})</span></span>
                <span className={traeDeMesAnterior < 0 ? "text-warning" : "text-positive"}>S/ {formatMonto(traeDeMesAnterior, decimales)}</span>
              </div>
            ) : (
              <SaldoAnteriorField
                saldoAnterior={settings?.saldoAnteriorSimulador || 0}
                mesAnteriorLabel={etiquetaMes(mesAnteriorA(mes)).split(" ")[0]}
              />
            )}

            {ingresosReales > 0 && (
              <LineaExpandible
                label="Ingresos registrados"
                badge="Real"
                signo="+"
                total={ingresosReales}
                filas={ingresosFilasMes(mes)}
              />
            )}
            <LineaExpandible label="Fijos (débito/efectivo)" total={fijosSinTarjeta} filas={fijosSinTarjetaFilas} />
            <LineaExpandible label="Cuotas de tarjetas" total={cuotasMes} filas={cuotasTarjetasFilasMes(mes)} />
            {totalPlanificados > 0 && (
              <LineaExpandible
                label="Gastos planificados (débito/efectivo)"
                total={totalPlanificados}
                filas={planificadosNoCreditoMes(mes).map((p) => ({
                  label: p.description,
                  sublabel: p.kind === "prestamo" ? `préstamo a ${p.counterpartName}` : p.category?.name || undefined,
                  amount: p.amount,
                  id: p.id,
                  fecha: p.date ? toDateInput(new Date(p.date)) : undefined,
                }))}
              />
            )}
            <div className="mb-2" />

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
              {pagoTotalDefault
                ? "Asumimos que pagas cada tarjeta en su totalidad cada mes (puedes cambiarlo en Ajustes)."
                : "Si sigues cargándoles tus fijos y solo pagas la cuota mínima, así se vería su saldo."}
            </p>
            <div className="space-y-4">
              {proyeccionTarjetas.map(({ deuda, porMes }) => (
                <div key={deuda.id}>
                  <p className="text-sm font-medium mb-1.5">{deuda.counterpartName || "Tarjeta de crédito"}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {porMes.map(({ mes, balance, pctUso, umbral, segunPlan, cargosPlanificados, montoParaPagoTotal }) => (
                      <div key={mes} className="border border-border rounded-lg p-2.5">
                        <p className="text-[11px] text-muted capitalize mb-1">{etiquetaMes(mes).split(" ")[0]}</p>
                        <p className={`text-sm font-medium ${pctUso !== null && pctUso >= umbral ? "text-warning" : ""}`}>S/ {formatMonto(balance, decimales)}</p>
                        {pctUso !== null && (
                          <p className={`text-[11px] ${pctUso >= umbral ? "text-warning" : "text-muted"}`}>{pctUso}% de tu línea</p>
                        )}
                        <p className="text-[10px] text-muted mt-0.5">{segunPlan ? "según tu plan" : pagoTotalDefault ? "pago total est." : "pago mínimo est."}</p>
                        {cargosPlanificados > 0 && (
                          <p className="text-[10px] text-accent mt-0.5">+ S/ {formatMonto(cargosPlanificados, decimales)} planificado</p>
                        )}
                        {montoParaPagoTotal !== null && (
                          montoParaPagoTotal === 0 ? (
                            <p className="text-[10px] text-muted mt-1.5">Tu plan ya cubre todo el saldo</p>
                          ) : (
                            <form action={simularPagoTotalDeuda} className="mt-1.5">
                              <input type="hidden" name="debtId" value={deuda.id} />
                              <input type="hidden" name="month" value={mes} />
                              <input type="hidden" name="amount" value={montoParaPagoTotal} />
                              <input type="hidden" name="description" value={`Pago total simulado de ${deuda.counterpartName || "tarjeta"}`} />
                              <button className="text-[10px] text-accent font-medium hover:underline">Simular pago total</button>
                            </form>
                          )
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
