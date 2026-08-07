"use client";

import { useState } from "react";
import { createCuenta } from "@/lib/actions";

export default function NuevaCuentaModal() {
  const [abierto, setAbierto] = useState(false);
  const [esCredito, setEsCredito] = useState(false);

  return (
    <>
      <button onClick={() => setAbierto(true)} className="text-sm px-4 py-2 rounded-lg border border-border hover:border-accent transition-colors">
        + Agregar cuenta
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={() => setAbierto(false)}>
          <div className="w-[380px] bg-surface rounded-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">Nueva cuenta</span>
              <button onClick={() => setAbierto(false)} className="text-muted">✕</button>
            </div>

            <label className="text-xs text-muted block mb-1.5">Tipo</label>
            <div className="flex gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => setEsCredito(false)}
                className={`flex-1 text-xs py-2 rounded-lg border ${!esCredito ? "bg-accent-soft text-accent border-accent" : "border-border"}`}
              >
                Cuenta o billetera
              </button>
              <button
                type="button"
                onClick={() => setEsCredito(true)}
                className={`flex-1 text-xs py-2 rounded-lg border ${esCredito ? "bg-accent-soft text-accent border-accent" : "border-border"}`}
              >
                Tarjeta de crédito
              </button>
            </div>

            {esCredito ? (
              <div className="bg-accent-soft rounded-xl p-3.5">
                <p className="text-xs text-accent mb-2.5 leading-relaxed">
                  Una tarjeta de crédito es una deuda, no una cuenta con saldo propio. Regístrala en Debo para llevar el control de cuánto debes.
                </p>
                <a href="/debo" className="block text-center text-xs py-2 rounded-lg border border-border">Ir a Debo →</a>
              </div>
            ) : (
              <form
                action={async (fd) => {
                  await createCuenta(fd);
                  setAbierto(false);
                }}
              >
                <label className="text-xs text-muted block mb-1">Nombre</label>
                <input name="name" required className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="Cuenta corriente, Guardadito..." />
                <label className="text-xs text-muted block mb-1">Banco o emisor</label>
                <input name="bank" required className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="BCP, Interbank, BBVA..." />
                <label className="text-xs text-muted block mb-1">Tipo de cuenta</label>
                <select name="type" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5">
                  <option value="corriente">Corriente</option>
                  <option value="ahorro">Ahorro</option>
                  <option value="billetera">Billetera digital</option>
                  <option value="puntos">Recompensas / puntos</option>
                </select>
                <label className="text-xs text-muted block mb-1">Saldo actual</label>
                <input name="balance" type="number" placeholder="1200" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3" />
                <button className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium">Guardar cuenta</button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
