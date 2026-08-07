"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { eliminarFundMovement } from "@/lib/actions";
import RowMenu from "../../components/RowMenu";
import { useDecimales } from "../../components/DecimalesProvider";
import { formatMonto } from "@/lib/format";
import MovimientoModal from "./MovimientoModal";

type Movimiento = {
  id: string;
  type: string;
  amount: number;
  date: Date;
  description: string | null;
  imageUrl?: string | null;
};

function borrarConConfirmacion(id: string, etiqueta: string) {
  if (!window.confirm(`¿Eliminar el movimiento "${etiqueta}"? Esta acción no se puede deshacer.`)) return;
  const fd = new FormData();
  fd.set("id", id);
  void eliminarFundMovement(fd);
}

export default function MovimientoRow({ accountId, movimiento, ultimo }: { accountId: string; movimiento: Movimiento; ultimo: boolean }) {
  const [editando, setEditando] = useState(false);
  const decimales = useDecimales();
  const etiqueta = movimiento.description || (movimiento.type === "ingreso" ? "Entrada" : "Gasto");
  const esIngreso = movimiento.type === "ingreso";

  return (
    <div className={`flex justify-between items-center px-4 py-3 ${!ultimo ? "border-b border-border" : ""}`}>
      <div>
        <p className="text-sm font-medium flex items-center gap-1.5">
          {movimiento.description || (esIngreso ? "Entrada de dinero" : "Gasto")}
          {movimiento.imageUrl && (
            <a href={`/api/movimiento-foto/ver?url=${encodeURIComponent(movimiento.imageUrl)}`} target="_blank" rel="noopener noreferrer" title="Ver foto del comprobante" className="text-muted hover:text-accent">
              <ImageIcon size={13} />
            </a>
          )}
        </p>
        <p className="text-xs text-muted">
          {new Date(movimiento.date).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <span className={`text-sm font-medium ${esIngreso ? "text-positive" : ""}`}>
          {esIngreso ? "+" : "-"} S/ {formatMonto(movimiento.amount, decimales)}
        </span>
        <RowMenu onEdit={() => setEditando(true)} onDelete={() => borrarConConfirmacion(movimiento.id, etiqueta)} />
      </div>
      {editando && <MovimientoModal accountId={accountId} movimiento={movimiento} onClose={() => setEditando(false)} />}
    </div>
  );
}
