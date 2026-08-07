"use client";

import { useState } from "react";
import { updateCuenta } from "@/lib/actions";

type Cuenta = { id: string; name: string; bank: string; type: string };

export default function CuentaModal({ cuenta, onClose }: { cuenta: Cuenta; onClose: () => void }) {
  const [guardando, setGuardando] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={onClose}>
      <form
        action={async (fd) => {
          setGuardando(true);
          fd.set("id", cuenta.id);
          await updateCuenta(fd);
          onClose();
        }}
        className="w-[380px] bg-surface rounded-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3.5">
          <span className="text-sm font-medium">Editar cuenta</span>
          <button type="button" onClick={onClose} className="text-muted">✕</button>
        </div>

        <label className="text-xs text-muted block mb-1">Nombre</label>
        <input name="name" required defaultValue={cuenta.name} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" />
        <label className="text-xs text-muted block mb-1">Banco o emisor</label>
        <input name="bank" required defaultValue={cuenta.bank} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" />
        <label className="text-xs text-muted block mb-1">Tipo de cuenta</label>
        <select name="type" defaultValue={cuenta.type} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3">
          <option value="corriente">Corriente</option>
          <option value="ahorro">Ahorro</option>
          <option value="billetera">Billetera digital</option>
          <option value="puntos">Recompensas / puntos</option>
          <option value="custodia">Fondo de terceros (plata que administras para alguien más)</option>
        </select>

        <button disabled={guardando} className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-60">Guardar cambios</button>
      </form>
    </div>
  );
}
