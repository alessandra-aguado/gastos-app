"use client";

import { useState } from "react";
import { addContribucion, marcarMetaCompletada, eliminarMeta } from "@/lib/actions";
import RowMenu from "../components/RowMenu";
import MetaModal from "./MetaModal";

type Meta = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date | null;
  status: string;
  motivo?: string | null;
};

function borrarConConfirmacion(id: string, nombre: string) {
  if (!window.confirm(`¿Eliminar la meta "${nombre}"? Esta acción no se puede deshacer.`)) return;
  const fd = new FormData();
  fd.set("id", id);
  void eliminarMeta(fd);
}

export default function MetaCard({ meta }: { meta: Meta }) {
  const [abonando, setAbonando] = useState(false);
  const [editando, setEditando] = useState(false);
  const pct = Math.min(100, Math.round((meta.currentAmount / meta.targetAmount) * 100));
  const cumplida = meta.status === "completada" || meta.currentAmount >= meta.targetAmount;

  return (
    <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4">
      <div className="flex justify-between items-start mb-2.5">
        <div>
          <p className="text-sm font-medium">{meta.name}</p>
          <p className="text-xs text-muted">
            {meta.targetDate ? new Date(meta.targetDate).toLocaleDateString("es-PE", { month: "short", year: "numeric" }) : "sin fecha"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cumplida && (
            <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-positive-soft text-positive">Cumplida</span>
          )}
          <RowMenu onEdit={() => setEditando(true)} onDelete={() => borrarConConfirmacion(meta.id, meta.name)} />
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-background overflow-hidden mb-2">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cumplida ? "var(--positive)" : "var(--accent)" }} />
      </div>
      <div className="flex justify-between text-xs text-muted mb-2.5">
        <span>
          <span className="text-foreground font-medium">S/ {meta.currentAmount.toLocaleString("es-PE")}</span> de S/ {meta.targetAmount.toLocaleString("es-PE")}
        </span>
        <span>{pct}%</span>
      </div>

      {cumplida ? (
        <form action={marcarMetaCompletada}>
          <input type="hidden" name="id" value={meta.id} />
          <button className="w-full text-xs py-1.5 rounded-lg border border-border hover:border-accent transition-colors">
            Marcar como comprada
          </button>
        </form>
      ) : abonando ? (
        <form
          action={async (fd) => {
            await addContribucion(fd);
            setAbonando(false);
          }}
          className="flex gap-1.5"
        >
          <input type="hidden" name="savingsGoalId" value={meta.id} />
          <input
            name="amount"
            type="number"
            step="1"
            autoFocus
            placeholder="Monto"
            className="flex-1 border border-border rounded-lg px-2 py-1.5 bg-background text-xs"
          />
          <button className="text-xs px-3 py-1.5 rounded-lg bg-accent text-white">Abonar</button>
        </form>
      ) : (
        <button
          onClick={() => setAbonando(true)}
          className="w-full text-xs py-1.5 rounded-lg border border-border hover:border-accent transition-colors"
        >
          + Abonar
        </button>
      )}
      {editando && <MetaModal meta={meta} onClose={() => setEditando(false)} />}
    </div>
  );
}
