"use client";

import { useState } from "react";
import { updateMeta } from "@/lib/actions";

type Meta = {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: Date | null;
  motivo?: string | null;
};

function toDateInput(d: Date | null) {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export default function MetaModal({ meta, onClose }: { meta: Meta; onClose: () => void }) {
  const [guardando, setGuardando] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={onClose}>
      <form
        action={async (fd) => {
          setGuardando(true);
          fd.set("id", meta.id);
          await updateMeta(fd);
          onClose();
        }}
        className="w-[380px] bg-surface rounded-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3.5">
          <span className="text-sm font-medium">Editar meta</span>
          <button type="button" onClick={onClose} className="text-muted">✕</button>
        </div>

        <label className="text-xs text-muted block mb-1">¿Para qué estás ahorrando?</label>
        <input name="name" required defaultValue={meta.name} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3" />

        <label className="text-xs text-muted block mb-1">¿Cuánto necesitas en total?</label>
        <input name="targetAmount" type="number" required defaultValue={meta.targetAmount} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3" />

        <label className="text-xs text-muted block mb-1">¿Para cuándo te gustaría lograrlo?</label>
        <input name="targetDate" type="date" defaultValue={toDateInput(meta.targetDate)} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3" />

        <label className="text-xs text-muted block mb-1">¿Por qué te importa esta meta?</label>
        <textarea name="motivo" defaultValue={meta.motivo || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3.5 h-12" />

        <button disabled={guardando} className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-60">Guardar cambios</button>
      </form>
    </div>
  );
}
