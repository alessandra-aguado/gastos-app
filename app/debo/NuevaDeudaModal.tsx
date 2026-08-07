"use client";

import { useState } from "react";
import { createDeuda } from "@/lib/actions";

export default function NuevaDeudaModal() {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<"tarjeta_credito" | "prestamo_personal">("tarjeta_credito");

  return (
    <>
      <button onClick={() => setAbierto(true)} className="text-sm px-4 py-2 rounded-lg border border-border hover:border-accent transition-colors">
        + Nueva deuda
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={() => setAbierto(false)}>
          <form
            action={async (fd) => {
              await createDeuda(fd);
              setAbierto(false);
            }}
            className="w-[380px] bg-surface rounded-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">Nueva deuda</span>
              <button type="button" onClick={() => setAbierto(false)} className="text-muted">✕</button>
            </div>

            <div className="flex gap-1.5 mb-3">
              <button type="button" onClick={() => setTipo("tarjeta_credito")} className={`flex-1 text-xs py-2 rounded-lg border ${tipo === "tarjeta_credito" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}>Tarjeta de crédito</button>
              <button type="button" onClick={() => setTipo("prestamo_personal")} className={`flex-1 text-xs py-2 rounded-lg border ${tipo === "prestamo_personal" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}>Préstamo personal</button>
            </div>
            <input type="hidden" name="type" value={tipo} />

            <label className="text-xs text-muted block mb-1">{tipo === "tarjeta_credito" ? "Banco emisor" : "Nombre de la persona"}</label>
            <input name="counterpartName" required className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder={tipo === "tarjeta_credito" ? "Interbank, Falabella..." : "Juan, Sofía..."} />

            {tipo === "prestamo_personal" && (
              <>
                <label className="text-xs text-muted block mb-1.5">¿Quién debe?</label>
                <select name="direction" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5">
                  <option value="yo_debo">Yo debo</option>
                  <option value="me_deben">Me deben</option>
                </select>
              </>
            )}

            <label className="text-xs text-muted block mb-1">{tipo === "tarjeta_credito" ? "Deuda actual" : "Monto"}</label>
            <input name="balance" type="number" required className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="230" />
            <input type="hidden" name="principalAmount" value="" />

            {tipo === "tarjeta_credito" && (
              <>
                <div className="flex gap-2 mb-2.5">
                  <div className="flex-1">
                    <label className="text-xs text-muted block mb-1">Línea total</label>
                    <input name="creditLimit" type="number" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm" placeholder="5000" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted block mb-1">Cuota mínima</label>
                    <input name="minPayment" type="number" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm" placeholder="230" />
                  </div>
                </div>
                <label className="text-xs text-muted block mb-1">Día de vencimiento</label>
                <input name="dueDay" type="number" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3" placeholder="20" />
              </>
            )}

            <button className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium mt-1">Guardar deuda</button>
          </form>
        </div>
      )}
    </>
  );
}
