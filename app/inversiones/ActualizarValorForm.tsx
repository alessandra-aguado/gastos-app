"use client";

import { useState } from "react";
import { updateValorInversion } from "@/lib/actions";

export default function ActualizarValorForm({ id, valorActual }: { id: string; valorActual: number }) {
  const [editando, setEditando] = useState(false);

  if (!editando) {
    return (
      <button onClick={() => setEditando(true)} className="text-xs text-muted underline underline-offset-2">
        Actualizar valor
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await updateValorInversion(fd);
        setEditando(false);
      }}
      className="flex gap-1.5 items-center"
    >
      <input type="hidden" name="id" value={id} />
      <input
        name="currentValue"
        type="number"
        defaultValue={valorActual}
        autoFocus
        className="w-24 border border-border rounded-lg px-2 py-1 bg-background text-xs"
      />
      <button className="text-xs px-2 py-1 rounded-lg bg-accent text-white">Guardar</button>
    </form>
  );
}
