"use client";

import { useState } from "react";
import { marcarFijoPagado, eliminarFijo } from "@/lib/actions";
import RowMenu from "../components/RowMenu";
import CategoryIcon from "../components/CategoryIcon";
import { useDecimales } from "../components/DecimalesProvider";
import { formatMonto } from "@/lib/format";
import FijoModal from "./FijoModal";

type Fijo = {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  paymentMethodId: string | null;
  dueMode: string;
  dueDay: number | null;
  rangeStart: number | null;
  rangeEnd: number | null;
  reminderDays: number;
  syncCalendar: boolean;
  lastPaidMonth: string | null;
  category: { name: string; icon: string | null; color: string | null };
};

type Categoria = { id: string; name: string };
type Medio = { id: string; name: string };

function borrarConConfirmacion(id: string, nombre: string) {
  if (!window.confirm(`¿Eliminar el fijo "${nombre}"? Esta acción no se puede deshacer.`)) return;
  const fd = new FormData();
  fd.set("id", id);
  void eliminarFijo(fd);
}

export default function FijoRow({
  fijo,
  ultimo,
  mesActual,
  categorias,
  medios,
}: {
  fijo: Fijo;
  ultimo: boolean;
  mesActual: string;
  categorias: Categoria[];
  medios: Medio[];
}) {
  const [editando, setEditando] = useState(false);
  const decimales = useDecimales();
  const pagado = fijo.lastPaidMonth === mesActual;
  const vence = fijo.dueMode === "unica" ? (fijo.dueDay ? `vence el ${fijo.dueDay}` : "sin vencimiento fijo") : `pagas entre el ${fijo.rangeStart} y el ${fijo.rangeEnd}`;

  return (
    <div className={`flex justify-between items-center px-4 py-3 ${!ultimo ? "border-b border-border" : ""}`}>
      <div className="flex gap-2.5 items-center">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: fijo.category.color || "#F2F2F3" }}>
          <CategoryIcon icon={fijo.category.icon} size={16} />
        </div>
        <div>
          <p className="text-sm font-medium">{fijo.name}</p>
          <p className="text-xs text-muted">{fijo.category.name} · {vence}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-sm">S/ {formatMonto(fijo.amount, decimales)}</span>
        {pagado ? (
          <span className="bg-positive-soft text-positive text-[10px] font-medium px-2 py-1 rounded-md">Pagado</span>
        ) : (
          <form action={marcarFijoPagado}>
            <input type="hidden" name="id" value={fijo.id} />
            <button className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">Marcar pagado</button>
          </form>
        )}
        <RowMenu onEdit={() => setEditando(true)} onDelete={() => borrarConConfirmacion(fijo.id, fijo.name)} />
      </div>
      {editando && <FijoModal categorias={categorias} medios={medios} fijo={fijo} onClose={() => setEditando(false)} />}
    </div>
  );
}
