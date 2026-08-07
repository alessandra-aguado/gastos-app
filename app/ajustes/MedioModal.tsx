"use client";

import { useState } from "react";
import { createMedioDePago, updateMedioDePago } from "@/lib/actions";

type Medio = { id: string; name: string; type: string; bankOrIssuer: string | null };

export default function MedioModal({ medio, onClose }: { medio: Medio | null; onClose: () => void }) {
  const esEdicion = !!medio;
  const [guardando, setGuardando] = useState(false);

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
        <select name="type" defaultValue={medio?.type || "debito"} className="w-full border border-border rounded-lg px-3.5 py-2.5 bg-background text-sm mb-4">
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
        <p className="text-xs text-muted mb-5">Débito y billetera digital aparecen también en Cuentas.</p>

        <button disabled={guardando} className="w-full py-3 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-60">
          {esEdicion ? "Guardar cambios" : "Crear medio de pago"}
        </button>
      </form>
    </div>
  );
}
