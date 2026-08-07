"use client";

import { useState } from "react";
import { createSimulationItem, updateSimulationItem } from "@/lib/actions";

type Categoria = { id: string; name: string };
type Medio = { id: string; name: string; type: string };
type DeudaOpcion = { id: string; counterpartName: string | null; type: string };
type Item = {
  id: string;
  type: string;
  description: string;
  amount: number;
  categoryId: string | null;
  paymentMethodId: string | null;
  debtId: string | null;
};

const TIPOS = [
  { value: "gasto", label: "Gasto" },
  { value: "ingreso", label: "Ingreso extra" },
  { value: "pago_deuda", label: "Pago extra a deuda" },
];

export default function SimulationItemModal({
  month,
  categorias,
  medios,
  deudas,
  item,
  onClose,
}: {
  month: string;
  categorias: Categoria[];
  medios: Medio[];
  deudas: DeudaOpcion[];
  item?: Item;
  onClose?: () => void;
}) {
  const esEdicion = !!item;
  const [abierto, setAbierto] = useState(esEdicion);
  const [type, setType] = useState(item?.type || "gasto");

  function cerrar() {
    setAbierto(false);
    onClose?.();
  }

  return (
    <>
      {!esEdicion && (
        <button onClick={() => setAbierto(true)} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">
          + Agregar
        </button>
      )}

      {abierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={cerrar}>
          <form
            action={async (fd) => {
              fd.set("month", month);
              fd.set("type", type);
              if (esEdicion) {
                fd.set("id", item!.id);
                await updateSimulationItem(fd);
              } else {
                await createSimulationItem(fd);
              }
              cerrar();
            }}
            className="w-[380px] bg-surface rounded-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">{esEdicion ? "Editar ítem" : "Nuevo ítem hipotético"}</span>
              <button type="button" onClick={cerrar} className="text-muted">✕</button>
            </div>

            <label className="text-xs text-muted block mb-1">Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5">
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <label className="text-xs text-muted block mb-1">Descripción</label>
            <input name="description" required defaultValue={item?.description} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder={type === "ingreso" ? "Chamba freelance" : type === "pago_deuda" ? "Pago extra a Interbank" : "Celular nuevo"} />

            <label className="text-xs text-muted block mb-1">Monto</label>
            <input name="amount" type="number" step="any" required defaultValue={item?.amount} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="500" />

            {type === "gasto" && (
              <>
                <label className="text-xs text-muted block mb-1">Categoría (opcional)</label>
                <select name="categoryId" defaultValue={item?.categoryId || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5">
                  <option value="">Sin categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <label className="text-xs text-muted block mb-1">Medio de pago (opcional)</label>
                <select name="paymentMethodId" defaultValue={item?.paymentMethodId || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5">
                  <option value="">Sin definir</option>
                  {medios.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted mb-2.5 -mt-1.5">Si eliges una tarjeta de crédito, este gasto sube el saldo proyectado de esa tarjeta.</p>
              </>
            )}

            {type === "pago_deuda" && (
              <>
                <label className="text-xs text-muted block mb-1">¿A qué deuda aplica?</label>
                <select name="debtId" required defaultValue={item?.debtId || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5">
                  <option value="" disabled>Elige una deuda</option>
                  {deudas.map((d) => (
                    <option key={d.id} value={d.id}>{d.counterpartName || (d.type === "tarjeta_credito" ? "Tarjeta de crédito" : "Préstamo")}</option>
                  ))}
                </select>
              </>
            )}

            <button className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium mt-1">{esEdicion ? "Guardar cambios" : "Agregar"}</button>
          </form>
        </div>
      )}
    </>
  );
}
