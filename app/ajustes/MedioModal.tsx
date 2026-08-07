"use client";

import { useState } from "react";
import { createMedioDePago, updateMedioDePago } from "@/lib/actions";

type Medio = { id: string; name: string; type: string; bankOrIssuer: string | null; closingDay?: number | null; billingDay?: number | null };

export default function MedioModal({ medio, onClose }: { medio: Medio | null; onClose: () => void }) {
  const esEdicion = !!medio;
  const [guardando, setGuardando] = useState(false);
  const [tipo, setTipo] = useState(medio?.type || "debito");

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={onClose}>
      <form
        action={async (fd) => {
          setGuardando(true);
          if (esEdicion) {
            fd.set("id", medio!.id);
            await updateMedioDePago(fd);
          } else {
            await createMedioDePago(fd);
          }
          onClose();
        }}
        className="w-[380px] bg-surface rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <span className="text-base font-semibold">{esEdicion ? "Editar medio de pago" : "Nuevo medio de pago"}</span>
          <button type="button" onClick={onClose} className="text-muted">✕</button>
        </div>

        <label className="text-xs text-muted block mb-1.5">Nombre</label>
        <input
          name="name"
          required
          defaultValue={medio?.name || ""}
          placeholder="Yape, BCP débito..."
          className="w-full border border-border rounded-lg px-3.5 py-2.5 bg-background text-sm mb-4"
        />

        <label className="text-xs text-muted block mb-1.5">Tipo</label>
        <select name="type" value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full border border-border rounded-lg px-3.5 py-2.5 bg-background text-sm mb-4">
          <option value="debito">Débito</option>
          <option value="credito">Crédito</option>
          <option value="billetera_digital">Billetera digital</option>
          <option value="efectivo">Efectivo</option>
        </select>

        <label className="text-xs text-muted block mb-1.5">Banco o emisor</label>
        <input
          name="bankOrIssuer"
          defaultValue={medio?.bankOrIssuer || ""}
          placeholder="BCP, Interbank..."
          className="w-full border border-border rounded-lg px-3.5 py-2.5 bg-background text-sm mb-2"
        />
        <p className="text-xs text-muted mb-4">Débito y billetera digital aparecen también en Cuentas.</p>

        {tipo === "credito" && (
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <label className="text-xs text-muted block mb-1.5">Último día de pago</label>
              <input
                name="closingDay"
                type="number"
                min={1}
                max={31}
                defaultValue={medio?.closingDay ?? undefined}
                placeholder="10"
                className="w-full border border-border rounded-lg px-3.5 py-2.5 bg-background text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted block mb-1.5">Fecha de facturación</label>
              <input
                name="billingDay"
                type="number"
                min={1}
                max={31}
                defaultValue={medio?.billingDay ?? undefined}
                placeholder="15"
                className="w-full border border-border rounded-lg px-3.5 py-2.5 bg-background text-sm"
              />
            </div>
          </div>
        )}

        <button disabled={guardando} className="w-full py-3 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-60">
          {esEdicion ? "Guardar cambios" : "Crear medio de pago"}
        </button>
      </form>
    </div>
  );
}
