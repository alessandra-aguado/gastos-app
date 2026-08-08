import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Target } from "lucide-react";
import { getMetaPorId, getSettings } from "@/lib/queries";
import { formatMonto } from "@/lib/format";
import MetaAbonoForm from "../MetaAbonoForm";

export const dynamic = "force-dynamic";

export default async function MetaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [meta, settings] = await Promise.all([getMetaPorId(id), getSettings()]);
  if (!meta) notFound();

  const decimales = settings?.decimales ?? 0;
  const pct = Math.min(100, Math.round((meta.currentAmount / meta.targetAmount) * 100));
  const cumplida = meta.status === "completada" || meta.currentAmount >= meta.targetAmount;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Link href="/metas" className="text-sm text-muted hover:text-accent flex items-center gap-1.5">
        <ArrowLeft size={14} /> Todas las metas
      </Link>

      <div className="flex justify-between items-start mt-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Target size={22} strokeWidth={1.75} />{meta.name}</h1>
          <p className="text-muted text-sm mt-1">
            {meta.targetDate
              ? `Meta para ${new Date(meta.targetDate).toLocaleDateString("es-PE", { month: "long", year: "numeric" })}`
              : "Sin fecha objetivo"}
          </p>
        </div>
        {cumplida && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-positive-soft text-positive shrink-0">Cumplida</span>
        )}
      </div>

      {meta.motivo && (
        <p className="text-sm text-muted mt-3 bg-surface border border-border rounded-xl p-4">{meta.motivo}</p>
      )}

      <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5 mt-4">
        <div className="h-2 rounded-full bg-background overflow-hidden mb-3">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cumplida ? "var(--positive)" : "var(--accent)" }} />
        </div>
        <div className="flex justify-between items-center">
          <p className="text-2xl font-semibold">S/ {formatMonto(meta.currentAmount, decimales)}</p>
          <p className="text-sm text-muted">de S/ {formatMonto(meta.targetAmount, decimales)} · {pct}%</p>
        </div>
      </div>

      <div className="mt-6">
        <MetaAbonoForm metaId={meta.id} contribuciones={meta.contributions} />
      </div>
    </div>
  );
}
