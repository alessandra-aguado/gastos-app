import { getDeseos, getTopCategories, getSettings, getPaymentMethods } from "@/lib/queries";
import { formatMonto } from "@/lib/format";
import { Gift } from "lucide-react";
import DeseoRow from "./DeseoRow";
import DeseoModal from "./DeseoModal";
import CategoryIcon from "../components/CategoryIcon";

export const dynamic = "force-dynamic";

export default async function DeseosPage() {
  const [deseos, categorias, settings, medios] = await Promise.all([getDeseos(), getTopCategories(), getSettings(), getPaymentMethods()]);
  const decimales = settings?.decimales ?? 0;
  const total = deseos.reduce((s, d) => s + d.estimatedPrice, 0);

  type Grupo = { id: string; name: string; color: string | null; icon: string | null; total: number; count: number };
  const gruposMap = new Map<string, Grupo>();
  for (const d of deseos) {
    const key = d.categoryId || "sin-categoria";
    const existente = gruposMap.get(key);
    if (existente) {
      existente.total += d.estimatedPrice;
      existente.count += 1;
    } else {
      gruposMap.set(key, {
        id: key,
        name: d.category?.name || "Sin categoría",
        color: d.category?.color || null,
        icon: d.category?.icon || null,
        total: d.estimatedPrice,
        count: 1,
      });
    }
  }
  const grupos = Array.from(gruposMap.values()).sort((a, b) => b.total - a.total);
  const maxGrupo = grupos.length > 0 ? grupos[0].total : 0;

  const totalNecesario = deseos.filter((d) => d.isNecessary).reduce((s, d) => s + d.estimatedPrice, 0);
  const totalInnecesario = total - totalNecesario;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Gift size={22} strokeWidth={1.75} />Deseos</h1>
          <p className="text-muted text-sm mt-1">{deseos.length} deseo{deseos.length === 1 ? "" : "s"} · S/ {formatMonto(total, decimales)} en total</p>
        </div>
        <DeseoModal categorias={categorias} />
      </div>

      {deseos.length > 0 && (
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">¿Dónde se te va la plata soñada?</p>
            <p className="text-xs text-muted">
              <span className="text-foreground font-medium">S/ {formatMonto(totalNecesario, decimales)}</span> necesario ·{" "}
              <span className="text-foreground font-medium">S/ {formatMonto(totalInnecesario, decimales)}</span> innecesario
            </p>
          </div>
          <div className="space-y-2.5">
            {grupos.map((g) => {
              const pct = maxGrupo > 0 ? Math.round((g.total / maxGrupo) * 100) : 0;
              const pctDelTotal = total > 0 ? Math.round((g.total / total) * 100) : 0;
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: g.color || "#F2F2F3" }}>
                        <CategoryIcon icon={g.icon} size={11} />
                      </span>
                      {g.name}
                      <span className="text-muted font-normal">· {g.count} deseo{g.count === 1 ? "" : "s"}</span>
                    </p>
                    <p className="text-xs text-muted">
                      S/ {formatMonto(g.total, decimales)} <span className="text-muted">({pctDelTotal}%)</span>
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-background overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: g.color || "var(--accent)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
