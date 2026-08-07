import { getInversiones } from "@/lib/queries";
import { TrendingUp } from "lucide-react";
import InversionModal from "./InversionModal";
import InversionRow from "./InversionRow";
import DescargarCSV from "../components/DescargarCSV";

export const dynamic = "force-dynamic";

function valorActual(inv: { kind: string; tea: number | null; amountContributed: number; currentValue: number | null; date: Date }) {
  if (inv.kind === "fija" && inv.tea) {
    const dias = (Date.now() - new Date(inv.date).getTime()) / 86400000;
    const ganancia = inv.amountContributed * (inv.tea / 100) * (dias / 365);
    return inv.amountContributed + ganancia;
  }
  return inv.currentValue ?? inv.amountContributed;
}

export default async function InversionesPage() {
  const inversiones = await getInversiones();

  const invertido = inversiones.reduce((s, i) => s + i.amountContributed, 0);
  const actual = inversiones.reduce((s, i) => s + valorActual(i), 0);
  const rentabilidad = invertido > 0 ? ((actual - invertido) / invertido) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><TrendingUp size={22} strokeWidth={1.75} />Inversiones</h1>
          <p className="text-muted text-sm mt-1">
            S/ {invertido.toFixed(0)} invertido · valor actual S/ {actual.toFixed(0)} · {rentabilidad >= 0 ? "+" : ""}{rentabilidad.toFixed(1)}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DescargarCSV
            filename="inversiones.csv"
            headers={["Plataforma", "Tipo de instrumento", "Modalidad", "Monto invertido", "Fecha", "Valor actual", "TEA", "Plazo (meses)", "Vencimiento"]}
            rows={inversiones.map((inv) => [
              inv.platform,
              inv.instrumentType,
              inv.kind === "fija" ? "Renta fija" : "Renta variable",
              inv.amountContributed.toFixed(2),
              new Date(inv.date).toLocaleDateString("es-PE"),
              valorActual(inv).toFixed(2),
              inv.tea ?? "",
              inv.termMonths ?? "",
              inv.maturityDate ? new Date(inv.maturityDate).toLocaleDateString("es-PE") : "",
            ])}
          />
          <InversionModal />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-3">
          <p className="text-xs text-muted mb-1">Invertido</p>
          <p className="text-base font-medium">S/ {invertido.toFixed(0)}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-3">
          <p className="text-xs text-muted mb-1">Valor actual</p>
          <p className="text-base font-medium">S/ {actual.toFixed(0)}</p>
        </div>
        <div className="bg-positive-soft rounded-xl p-3">
          <p className="text-xs text-positive mb-1">Rentabilidad</p>
          <p className="text-base font-medium text-positive">{rentabilidad >= 0 ? "+" : ""}{rentabilidad.toFixed(1)}%</p>
        </div>
      </div>

      <div className="space-y-2.5 mb-6">
        {inversiones.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted text-sm">
            Aún no registras inversiones. Agrega tu primer aporte abajo.
          </div>
        ) : (
          inversiones.map((inv) => {
            const va = valorActual(inv);
            const gananciaPct = inv.amountContributed > 0 ? ((va - inv.amountContributed) / inv.amountContributed) * 100 : 0;
            return <InversionRow key={inv.id} inv={inv} valorActual={va} gananciaPct={gananciaPct} />;
          })
        )}
      </div>
    </div>
  );
}
