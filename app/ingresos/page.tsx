import { getIngresos, getSettings } from "@/lib/queries";
import { formatMonto } from "@/lib/format";
import { CircleDollarSign } from "lucide-react";
import IngresoModal from "./IngresoModal";
import IngresoRow from "./IngresoRow";
import DescargarReporte from "../components/DescargarReporte";

export const dynamic = "force-dynamic";

function mesActualKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function IngresosPage() {
  const [ingresos, settings] = await Promise.all([getIngresos(), getSettings()]);
  const decimales = settings?.decimales ?? 0;
  const mesActual = mesActualKey();

  const delMes = ingresos.filter((i) => {
    const d = new Date(i.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return key === mesActual;
  });
  const totalMes = delMes.reduce((s, i) => s + i.amount, 0);
  const fijoMes = delMes.filter((i) => i.type === "fijo").reduce((s, i) => s + i.amount, 0);
  const variableMes = delMes.filter((i) => i.type === "variable").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><CircleDollarSign size={22} strokeWidth={1.75} />Ingresos</h1>
          <p className="text-muted text-sm mt-1">
            S/ {formatMonto(totalMes, decimales)} este mes · S/ {formatMonto(fijoMes, decimales)} fijo · S/ {formatMonto(variableMes, decimales)} variable
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DescargarReporte
            filename="ingresos"
            title="Ingresos"
            subtitle={`S/ ${formatMonto(totalMes, decimales)} este mes · ${ingresos.length} registros · generado el ${new Date().toLocaleDateString("es-PE")}`}
            headers={["Fecha", "Tipo", "Monto", "Fuente", "Notas"]}
            rows={ingresos.map((i) => [
              new Date(i.date).toLocaleDateString("es-PE"),
              i.type === "fijo" ? "Fijo" : "Variable",
              i.amount.toFixed(2),
              i.source || "",
              i.notes || "",
            ])}
          />
          <IngresoModal />
        </div>
      </div>

      {ingresos.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center text-muted text-sm">
          Aún no registras ingresos. Agrega el primero con &quot;+ Nuevo ingreso&quot;.
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
          {ingresos.map((i, idx) => (
            <IngresoRow key={i.id} ingreso={i} ultimo={idx === ingresos.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}
