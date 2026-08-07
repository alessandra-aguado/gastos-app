"use client";

import { useState } from "react";
import { eliminarIngreso } from "@/lib/actions";
import RowMenu from "../components/RowMenu";
import { useDecimales } from "../components/DecimalesProvider";
import { formatMonto } from "@/lib/format";
import IngresoModal from "./IngresoModal";

type Ingreso = {
  id: string;
  amount: number;
  date: Date;
  type: string;
  source: string | null;
  notes: string | null;
};

function borrarConConfirmacion(id: string, nombre: string) {
  if (!window.confirm(`¿Eliminar el ingreso "${nombre}"? Esta acción no se puede deshacer.`)) return;
  const fd = new FormData();
  fd.set("id", id);
  void eliminarIngreso(fd);
}

export default function IngresoRow({ ingreso, ultimo }: { ingreso: Ingreso; ultimo: boolean }) {
  const [editando, setEditando] = useState(false);
  const decimales = useDecimales();
  const nombre = ingreso.source || "Ingreso";

  return (
    <div className={`flex justify-between items-center px-4 py-3 ${!ultimo ? "border-b border-border" : ""}`}>
      <div>
        <p className="text-sm font-medium">{nombre}</p>
        <p className="text-xs text-muted">
          {new Date(ingreso.date).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
          {" · "}
          {ingreso.type === "fijo" ? "fijo" : "variable"}
          {ingreso.notes ? ` · ${ingreso.notes}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-medium text-positive">+ S/ {formatMonto(ingreso.amount, decimales)}</span>
        <RowMenu onEdit={() => setEditando(true)} onDelete={() => borrarConConfirmacion(ingreso.id, nombre)} />
      </div>
      {editando && <IngresoModal ingreso={ingreso} onClose={() => setEditando(false)} />}
    </div>
  );
}
