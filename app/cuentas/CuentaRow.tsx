"use client";

import { useState } from "react";
import Link from "next/link";
import { updateSaldoCuenta, eliminarCuenta } from "@/lib/actions";
import RowMenu from "../components/RowMenu";
import CuentaModal from "./CuentaModal";

type Cuenta = { id: string; name: string; bank: string; type: string; balance: number; lastCheckIn: Date | null };

function borrarConConfirmacion(id: string, nombre: string) {
  if (!window.confirm(`¿Eliminar la cuenta "${nombre}"? Esta acción no se puede deshacer.`)) return;
  const fd = new FormData();
  fd.set("id", id);
  void eliminarCuenta(fd);
}

export default function CuentaRow({ cuenta, ultimo, dias }: { cuenta: Cuenta; ultimo: boolean; dias: number | null }) {
  const [editando, setEditando] = useState(false);
  const [editandoDatos, setEditandoDatos] = useState(false);

  return (
    <div className={`flex justify-between items-center px-4 py-3 ${!ultimo ? "border-b border-border" : ""}`}>
      <div>
        {cuenta.type === "custodia" ? (
          <Link href={`/cuentas/${cuenta.id}`} className="text-sm font-medium hover:text-accent transition-colors">
            {cuenta.name} <span className="text-xs text-muted">· ver movimientos →</span>
          </Link>
        ) : (
          <p className="text-sm font-medium">{cuenta.name}</p>
        )}
        <p className="text-xs text-muted">{dias === null ? "Sin actualizar" : dias === 0 ? "Actualizado hoy" : `Actualizado hace ${dias} día${dias === 1 ? "" : "s"}`}</p>
      </div>
      {editando ? (
        <form
          action={async (fd) => {
            await updateSaldoCuenta(fd);
            setEditando(false);
          }}
          className="flex gap-1.5 items-center"
        >
          <input type="hidden" name="id" value={cuenta.id} />
          <input name="balance" type="number" defaultValue={cuenta.balance} autoFocus className="w-24 border border-border rounded-lg px-2 py-1 bg-background text-xs" />
          <button className="text-xs px-2 py-1 rounded-lg bg-accent text-white">Guardar</button>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <button onClick={() => setEditando(true)} className="text-sm hover:text-accent transition-colors">
            S/ {cuenta.balance.toLocaleString("es-PE")}
          </button>
          <RowMenu onEdit={() => setEditandoDatos(true)} onDelete={() => borrarConConfirmacion(cuenta.id, cuenta.name)} />
        </div>
      )}
      {editandoDatos && <CuentaModal cuenta={cuenta} onClose={() => setEditandoDatos(false)} />}
    </div>
  );
}
