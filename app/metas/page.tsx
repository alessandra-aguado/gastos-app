import { getMetas } from "@/lib/queries";
import { Target } from "lucide-react";
import MetaCard from "./MetaCard";
import NuevaMetaModal from "./NuevaMetaModal";

export const dynamic = "force-dynamic";

export default async function MetasPage() {
  const metas = await getMetas();
  const total = metas.reduce((s, m) => s + m.currentAmount, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Target size={22} strokeWidth={1.75} />Metas</h1>
          <p className="text-muted text-sm mt-1">S/ {total.toLocaleString("es-PE")} ahorrados en {metas.length} metas</p>
        </div>
        <NuevaMetaModal />
      </div>

      {metas.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center text-muted text-sm">
          Aún no tienes metas. Crea la primera con &quot;+ Nueva meta&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {metas.map((m) => (
            <MetaCard key={m.id} meta={m} />
          ))}
        </div>
      )}
    </div>
  );
}
