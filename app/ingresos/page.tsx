import { getIngresos } from "@/lib/queries";
import { CircleDollarSign } from "lucide-react";
import IngresoModal from "./IngresoModal";
import IngresoRow from "./IngresoRow";
import DescargarCSV from "../components/DescargarCSV";

export const dynamic = "force-dynamic";

function mesActualKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function IngresosPage() {
  const ingresos = await getIngresos();
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
            S/ {totalMes.toLocaleString("es-PE")} este mes · S/ {fijoMes.toLocaleString("es-PE")} fijo · S/ {variableMes.toLocaleString("es-PE")} variable
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DescargarCSV
            filename="ingresos.csv"
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
