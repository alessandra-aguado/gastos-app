import { getDeseos, getTopCategories, getSettings, getPaymentMethods } from "@/lib/queries";
import { formatMonto } from "@/lib/format";
import { Gift } from "lucide-react";
import DeseoRow from "./DeseoRow";
import DeseoModal from "./DeseoModal";

export const dynamic = "force-dynamic";

export default async function DeseosPage() {
  const [deseos, categorias, settings, medios] = await Promise.all([getDeseos(), getTopCategories(), getSettings(), getPaymentMethods()]);
  const decimales = settings?.decimales ?? 0;
  const total = deseos.reduce((s, d) => s + d.estimatedPrice, 0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Gift size={22} strokeWidth={1.75} />Deseos</h1>
          <p className="text-muted text-sm mt-1">{deseos.length} deseo{deseos.length === 1 ? "" : "s"} · S/ {formatMonto(total, decimales)} en total</p>
        </div>
        <DeseoModal categorias={categorias} />
      </div>

      {deseos.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center text-muted text-sm">
          Aún no tienes deseos guardados. Agrega el primero con &quot;+ Nuevo deseo&quot;.
        </div>
      ) : (
        <div className="space-y-2.5">
          {deseos.map((d) => (
            <DeseoRow key={d.id} deseo={d} categorias={categorias} medios={medios} />
          ))}
        </div>
      )}
    </div>
  );
}
