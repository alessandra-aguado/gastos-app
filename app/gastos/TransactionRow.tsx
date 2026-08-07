"use client";

import { useState } from "react";
import { eliminarTransaccion } from "@/lib/actions";
import RowMenu from "../components/RowMenu";
import TransactionModal from "./TransactionModal";

type Categoria = { id: string; name: string };
type Medio = { id: string; name: string; type: string };
type Transaccion = {
  id: string;
  amount: number;
  date: Date;
  merchant: string | null;
  notes: string | null;
  categoryId: string | null;
  paymentMethodId: string | null;
  category: { name: string } | null;
  paymentMethod: { name: string } | null;
};

function borrarConConfirmacion(id: string, etiqueta: string) {
  if (!window.confirm(`¿Eliminar el gasto "${etiqueta}"? Esta acción no se puede deshacer.`)) return;
  const fd = new FormData();
  fd.set("id", id);
  void eliminarTransaccion(fd);
}

export default function TransactionRow({
  transaccion,
  categorias,
  medios,
}: {
  transaccion: Transaccion;
  categorias: Categoria[];
  medios: Medio[];
}) {
  const [editando, setEditando] = useState(false);
  const etiqueta = transaccion.merchant || transaccion.category?.name || "gasto";

  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{transaccion.merchant || transaccion.category?.name}</p>
        <p className="text-xs text-muted">
          {transaccion.date.toISOString().slice(0, 10)} · {transaccion.paymentMethod?.name}
          {transaccion.notes ? ` · ${transaccion.notes}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <p className="font-semibold">S/ {transaccion.amount.toFixed(0)}</p>
        <RowMenu onEdit={() => setEditando(true)} onDelete={() => borrarConConfirmacion(transaccion.id, etiqueta)} />
      </div>
      {editando && (
        <TransactionModal
          transaccion={transaccion}
          categorias={categorias}
          medios={medios}
          onClose={() => setEditando(false)}
        />
      )}
    </div>
  );
}
