import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { getCuentaPorId, getFundMovements } from "@/lib/queries";
import MovimientoModal from "./MovimientoModal";
import MovimientoRow from "./MovimientoRow";
import DescargarCSV from "../../components/DescargarCSV";

export const dynamic = "force-dynamic";

export default async function CuentaCustodiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cuenta = await getCuentaPorId(id);
  if (!cuenta || cuenta.type !== "custodia") notFound();

  const movimientos = await getFundMovements(id);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link href="/cuentas" className="text-xs text-muted flex items-center gap-1 mb-4 hover:text-accent transition-colors w-fit">
        <ArrowLeft size={14} /> Cuentas
      </Link>

      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Users size={20} strokeWidth={1.75} />{cuenta.name}</h1>
          <p className="text-muted text-sm mt-1">Saldo actual: S/ {cuenta.balance.toLocaleString("es-PE")} · plata de {cuenta.bank}, no es tuya</p>
        </div>
        <div className="flex items-center gap-2">
          <DescargarCSV
            filename={`movimientos-${cuenta.name.toLowerCase().replace(/\s+/g, "-")}.csv`}
            headers={["Fecha", "Tipo", "Monto", "Descripción"]}
            rows={movimientos.map((m) => [
              new Date(m.date).toLocaleDateString("es-PE"),
              m.type === "ingreso" ? "Entrada" : "Gasto",
              m.amount.toFixed(2),
              m.description || "",
            ])}
          />
          <MovimientoModal accountId={id} />
        </div>
      </div>

      <p className="text-xs text-muted mb-6">
        Los movimientos de este fondo no afectan tus Gastos ni tu Presupuesto personal — son un registro aparte para llevar cuenta de en qué se usó esta plata.
      </p>

      {movimientos.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center text-muted text-sm">
          Aún no registras movimientos de este fondo. Agrega el primero con &quot;+ Nuevo movimiento&quot;.
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
          {movimientos.map((m, idx) => (
            <MovimientoRow key={m.id} accountId={id} movimiento={m} ultimo={idx === movimientos.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}
