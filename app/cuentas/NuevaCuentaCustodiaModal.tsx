"use client";

import { useState } from "react";
import { createCuenta } from "@/lib/actions";

export default function NuevaCuentaCustodiaModal() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button onClick={() => setAbierto(true)} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">
        + Añadir cuenta de terceros
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={() => setAbierto(false)}>
          <form
            action={async (fd) => {
              fd.set("type", "custodia");
              await createCuenta(fd);
              setAbierto(false);
            }}
            className="w-[380px] bg-surface rounded-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">Nueva cuenta de terceros</span>
              <button type="button" onClick={() => setAbierto(false)} className="text-muted">✕</button>
            </div>

            <p className="text-xs text-muted mb-3 leading-relaxed">
              Para plata que administras para alguien más. No cuenta en tu patrimonio ni en tu reconciliación mensual.
            </p>

            <label className="text-xs text-muted block mb-1">Nombre</label>
            <input name="name" required className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="Fondo Alexis - Mamá" />
            <label className="text-xs text-muted block mb-1">Banco o emisor donde está la plata</label>
            <input name="bank" required className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="BBVA, efectivo..." />
            <label className="text-xs text-muted block mb-1">Saldo actual</label>
            <input name="balance" type="number" placeholder="1000" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3" />

            <button className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium">Guardar cuenta</button>
          </form>
        </div>
      )}
    </>
  );
}
