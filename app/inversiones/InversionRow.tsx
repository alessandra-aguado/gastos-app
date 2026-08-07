"use client";

import { useState } from "react";
import { eliminarInversion } from "@/lib/actions";
import RowMenu from "../components/RowMenu";
import ActualizarValorForm from "./ActualizarValorForm";
import InversionModal from "./InversionModal";

type Inversion = {
  id: string;
  platform: string;
  instrumentType: string;
  kind: string;
  amountContributed: number;
  currentValue: number | null;
  tea: number | null;
  termMonths: number | null;
  maturityDate: Date | null;
};

function borrarConConfirmacion(id: string, nombre: string) {
  if (!window.confirm(`¿Eliminar el aporte en "${nombre}"? Esta acción no se puede deshacer.`)) return;
  const fd = new FormData();
  fd.set("id", id);
  void eliminarInversion(fd);
}

export default function InversionRow({ inv, valorActual, gananciaPct }: { inv: Inversion; valorActual: number; gananciaPct: number }) {
  const [editando, setEditando] = useState(false);
  const vencimiento = inv.maturityDate ? new Date(inv.maturityDate).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium">
            {inv.platform} <span className="text-xs text-muted font-normal">· {inv.kind === "fija" ? `renta fija, TEA ${inv.tea ?? 0}%` : "variable"}</span>
          </p>
          <p className="text-xs text-muted">{inv.instrumentType}{vencimiento ? ` · vence ${vencimiento}` : ""}</p>
        </div>
        <div className="text-right">
          <p className="text-sm">S/ {valorActual.toFixed(0)} <span className="text-muted text-xs">de S/ {inv.amountContributed.toFixed(0)}</span></p>
          <p className={`text-xs ${gananciaPct >= 0 ? "text-positive" : "text-warning"}`}>{gananciaPct >= 0 ? "+" : ""}{gananciaPct.toFixed(1)}%</p>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
        {inv.kind === "variable" ? (
          <ActualizarValorForm id={inv.id} valorActual={inv.currentValue ?? inv.amountContributed} />
        ) : <span />}
        <RowMenu onEdit={() => setEditando(true)} onDelete={() => borrarConConfirmacion(inv.id, inv.platform)} />
      </div>
      {editando && <InversionModal inversion={inv} onClose={() => setEditando(false)} />}
    </div>
  );
}
