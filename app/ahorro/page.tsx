import Link from "next/link";
import { PiggyBank, ArrowRight } from "lucide-react";
import { getAhorroSummary, getSavingsPlan, getSettings, currentMonthKey } from "@/lib/queries";
import { formatMonto } from "@/lib/format";
import SavingsPlanField from "./SavingsPlanField";

export default async function AhorroPage() {
  const month = currentMonthKey();
  const [summary, plan, settings] = await Promise.all([
    getAhorroSummary(),
    getSavingsPlan(month),
    getSettings(),
  ]);

  const decimales = settings?.decimales ?? 0;
  const ingreso = settings?.monthlyIncome ?? null;
  const pctFijos = settings?.pctFijos ?? 60;
  const pctVariable = settings?.pctVariable ?? 30;
  const pctAhorro = settings?.pctAhorro ?? 10;
  const sugeridoFijos = ingreso ? (ingreso * pctFijos) / 100 : null;
  const sugeridoVariable = ingreso ? (ingreso * pctVariable) / 100 : null;
  const sugeridoAhorro = ingreso ? (ingreso * pctAhorro) / 100 : null;
  const [anio, mes] = month.split("-");
  const nombreMes = new Date(Number(anio), Number(mes) - 1, 1).toLocaleDateString("es-PE", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-1">
        <PiggyBank size={22} className="text-accent" strokeWidth={1.75} />
        <h1 className="text-xl font-bold">Ahorro</h1>
      </div>
      <p className="text-sm text-muted mb-6">
        Todo lo que tienes guardado: fondo de emergencia, inversiones y metas.
      </p>

      <div className="bg-surface border border-border rounded-xl p-6 mb-4">
        <p className="text-xs text-muted">Ahorro total</p>
        <p className="text-3xl font-bold mt-1">
          S/ {formatMonto(summary.total, decimales)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-muted">Colchón (fondo de emergencia)</p>
          <p className="text-xl font-bold mt-1">
            S/ {formatMonto(summary.colchon, decimales)}
          </p>
        </div>
        <Link
          href="/inversiones"
          className="bg-surface border border-border rounded-xl p-4 hover:border-accent transition-colors"
        >
          <p className="text-xs text-muted flex items-center justify-between">
            Inversión <ArrowRight size={12} />
          </p>
          <p className="text-xl font-bold mt-1">
            S/ {formatMonto(summary.totalInversiones, decimales)}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {summary.countInversiones} {summary.countInversiones === 1 ? "activo" : "activos"}
          </p>
        </Link>
        <Link
          href="/metas"
          className="bg-surface border border-border rounded-xl p-4 hover:border-accent transition-colors"
        >
          <p className="text-xs text-muted flex items-center justify-between">
            Metas <ArrowRight size={12} />
          </p>
          <p className="text-xl font-bold mt-1">
            S/ {formatMonto(summary.totalMetas, decimales)}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {summary.countMetas} {summary.countMetas === 1 ? "meta activa" : "metas activas"}
          </p>
        </Link>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <p className="text-sm font-medium capitalize mb-3">Plan de ahorro · {nombreMes}</p>
        <SavingsPlanField month={month} plan={plan} />
        {sugeridoAhorro !== null ? (
          <p className="text-xs text-muted mt-3">
            Con tu regla de reparto ({pctFijos}/{pctVariable}/{pctAhorro} sobre S/{" "}
            {formatMonto(ingreso!, decimales)} de ingreso mensual): fijos S/{" "}
            {formatMonto(sugeridoFijos!, decimales)}, variable S/{" "}
            {formatMonto(sugeridoVariable!, decimales)}, ahorro sugerido S/{" "}
            {formatMonto(sugeridoAhorro, decimales)}.{" "}
            <Link href="/ajustes" className="text-accent hover:underline">
              Cambiar reparto
            </Link>
          </p>
        ) : (
          <p className="text-xs text-muted mt-3">
            Define tu ingreso mensual en Presupuesto para ver una sugerencia de reparto.
          </p>
        )}
      </div>

    </div>
  );
}
