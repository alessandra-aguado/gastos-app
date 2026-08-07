"use client";

import { useState } from "react";
import { updateTransaction } from "@/lib/actions";

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
};

export default function TransactionModal({
  transaccion,
  categorias,
  medios,
  onClose,
}: {
  transaccion: Transaccion;
  categorias: Categoria[];
  medios: Medio[];
  onClose: () => void;
}) {
  const [guardando, setGuardando] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={onClose}>
      <form
        action={async (fd) => {
          setGuardando(true);
          fd.set("id", transaccion.id);
          await updateTransaction(fd);
          onClose();
        }}
        className="w-[380px] bg-surface rounded-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3.5">
          <span className="text-sm font-medium">Editar gasto</span>
          <button type="button" onClick={onClose} className="text-muted">✕</button>
        </div>

        <label className="text-xs text-muted block mb-1">Monto (S/)</label>
        <input
          name="amount"
          type="number"
          step="0.01"
          required
          defaultValue={transaccion.amount}
          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5"
        />

        <label className="text-xs text-muted block mb-1">Fecha</label>
        <input
          name="date"
          type="date"
          required
          defaultValue={transaccion.date.toISOString().slice(0, 10)}
          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5"
        />

        <label className="text-xs text-muted block mb-1">Categoría</label>
        <select
          name="categoryId"
          required
          defaultValue={transaccion.categoryId ?? undefined}
          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5"
        >
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="text-xs text-muted block mb-1">Medio de pago</label>
        <select
          name="paymentMethodId"
          required
          defaultValue={transaccion.paymentMethodId ?? undefined}
          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5"
        >
          {medios.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} · {m.type.replace("_", " ")}
            </option>
          ))}
        </select>

        <label className="text-xs text-muted block mb-1">Comercio (opcional)</label>
        <input
          name="merchant"
          type="text"
          defaultValue={transaccion.merchant ?? ""}
          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5"
        />

        <label className="text-xs text-muted block mb-1">Notas (opcional)</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={transaccion.notes ?? ""}
          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3"
        />

        <button disabled={guardando} className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-60">
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
