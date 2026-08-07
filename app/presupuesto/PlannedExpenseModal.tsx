"use client";

import { useState } from "react";
import { createPlannedExpense, updatePlannedExpense } from "@/lib/actions";

type Categoria = { id: string; name: string };
type Medio = { id: string; name: string; type: string };
type PlannedExpense = {
  id: string;
  description: string;
  amount: number;
  kind: string;
  categoryId: string | null;
  paymentMethodId: string | null;
  counterpartName: string | null;
};

export default function PlannedExpenseModal({
  categorias,
  medios,
  item,
  onClose,
}: {
  categorias: Categoria[];
  medios: Medio[];
  item?: PlannedExpense;
  onClose?: () => void;
}) {
  const esEdicion = !!item;
  const [abierto, setAbierto] = useState(esEdicion);
  const [kind, setKind] = useState<"gasto" | "prestamo">((item?.kind as "gasto" | "prestamo") || "gasto");

  function cerrar() {
    setAbierto(false);
    onClose?.();
  }

  return (
    <>
      {!esEdicion && (
        <button onClick={() => setAbierto(true)} className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          + Nuevo gasto planificado
        </button>
      )}

      {abierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={cerrar}>
          <form
            action={async (fd) => {
              fd.set("kind", kind);
              if (esEdicion) {
                fd.set("id", item!.id);
                await updatePlannedExpense(fd);
              } else {
                await createPlannedExpense(fd);
              }
              cerrar();
            }}
            className="w-[380px] bg-surface rounded-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">{esEdicion ? "Editar gasto planificado" : "Nuevo gasto planificado"}</span>
              <button type="button" onClick={cerrar} className="text-muted">✕</button>
            </div>

            <div className="flex gap-1.5 mb-2.5">
              <button type="button" onClick={() => setKind("gasto")} className={`flex-1 text-xs py-2 rounded-lg border ${kind === "gasto" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}>
                Gasto
              </button>
              <button type="button" onClick={() => setKind("prestamo")} className={`flex-1 text-xs py-2 rounded-lg border ${kind === "prestamo" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}>
                Préstamo que doy
              </button>
            </div>

            <label className="text-xs text-muted block mb-1">Descripción</label>
            <input name="description" required defaultValue={item?.description} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder={kind === "prestamo" ? "Pago a papá si no llega su parte" : "Recarga tarjeta de transporte"} />

            <label className="text-xs text-muted block mb-1">Monto estimado</label>
            <input name="amount" type="number" step="any" required defaultValue={item?.amount} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="1100" />

            {kind === "prestamo" ? (
              <>
                <label className="text-xs text-muted block mb-1">¿A quién le prestas?</label>
                <input name="counterpartName" required defaultValue={item?.counterpartName || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="Papá" />
              </>
            ) : (
              <>
                <label className="text-xs text-muted block mb-1">Categoría</label>
                <select name="categoryId" required defaultValue={item?.categoryId || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5">
                  <option value="" disabled>Elige una categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </>
            )}

            <label className="text-xs text-muted block mb-1">
              Medio de pago {kind === "prestamo" ? "(opcional, de dónde saldría)" : ""}
            </label>
            <select name="paymentMethodId" required={kind === "gasto"} defaultValue={item?.paymentMethodId || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3.5">
              <option value="">{kind === "prestamo" ? "Sin definir aún" : "Elige un medio de pago"}</option>
              {medios.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <button className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium">{esEdicion ? "Guardar cambios" : "Agregar"}</button>
          </form>
        </div>
      )}
    </>
  );
}
