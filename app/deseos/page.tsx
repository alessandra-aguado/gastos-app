import { getDeseos, getTopCategories } from "@/lib/queries";
import { Gift } from "lucide-react";
import DeseoRow from "./DeseoRow";
import NuevoDeseoModal from "./NuevoDeseoModal";

export const dynamic = "force-dynamic";

export default async function DeseosPage() {
  const [deseos, categorias] = await Promise.all([getDeseos(), getTopCategories()]);
  const total = deseos.reduce((s, d) => s + d.estimatedPrice, 0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Gift size={22} strokeWidth={1.75} />Deseos</h1>
          <p className="text-muted text-sm mt-1">{deseos.length} deseo{deseos.length === 1 ? "" : "s"} · S/ {total.toLocaleString("es-PE")} en total</p>
        </div>
        <NuevoDeseoModal categorias={categorias} />
      </div>

      {deseos.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center text-muted text-sm">
          Aún no tienes deseos guardados. Agrega el primero con &quot;+ Nuevo deseo&quot;.
        </div>
      ) : (
        <div className="space-y-2.5">
          {deseos.map((d) => (
            <DeseoRow key={d.id} deseo={d} />
          ))}
        </div>
      )}
    </div>
  );
}
