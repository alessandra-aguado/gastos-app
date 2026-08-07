"use client";

import { useState } from "react";
import { createCategoria, createMedioDePago } from "@/lib/actions";

type Categoria = { id: string; name: string; icon: string | null; description: string | null };
type Medio = { id: string; name: string; type: string; bankOrIssuer: string | null };

export default function AjustesTabs({ categorias, medios }: { categorias: Categoria[]; medios: Medio[] }) {
  const [tab, setTab] = useState<"categorias" | "medios">("categorias");

  return (
    <>
      <div className="flex gap-1 border-b border-border mb-4">
        <button onClick={() => setTab("categorias")} className={`px-3.5 py-2 text-sm ${tab === "categorias" ? "text-accent font-medium border-b-2 border-accent" : "text-muted"}`}>Categorías</button>
        <button onClick={() => setTab("medios")} className={`px-3.5 py-2 text-sm ${tab === "medios" ? "text-accent font-medium border-b-2 border-accent" : "text-muted"}`}>Medios de pago</button>
      </div>

      {tab === "categorias" ? (
        <>
          <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden mb-3">
            {categorias.map((c, i) => (
              <div key={c.id} className={`flex justify-between items-start px-4 py-3 ${i < categorias.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex gap-2.5">
                  <span className="text-base">{c.icon || "🔹"}</span>
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.description && <p className="text-xs text-muted max-w-[280px]">{c.description}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <form action={createCategoria} className="bg-surface border border-dashed border-border rounded-xl p-4">
            <p className="text-xs text-muted mb-2">Nueva categoría</p>
            <div className="flex gap-2 mb-2">
              <input name="icon" placeholder="Ícono" className="w-16 border border-border rounded-lg px-2 py-1.5 bg-background text-sm" />
              <input name="name" required placeholder="Nombre" className="flex-1 border border-border rounded-lg px-2 py-1.5 bg-background text-sm" />
            </div>
            <textarea name="description" placeholder="Descripción para la IA: qué tipo de compras van aquí..." className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-sm mb-2 h-11" />
            <button className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">Agregar categoría</button>
          </form>
        </>
      ) : (
        <>
          <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden mb-3">
            {medios.map((m, i) => (
              <div key={m.id} className={`flex justify-between items-center px-4 py-3 ${i < medios.length - 1 ? "border-b border-border" : ""}`}>
                <p className="text-sm">{m.name} <span className="text-muted text-xs">· {m.type.replace("_", " ")}</span></p>
              </div>
            ))}
          </div>
          <form action={createMedioDePago} className="bg-surface border border-dashed border-border rounded-xl p-4">
            <p className="text-xs text-muted mb-2">Nuevo medio de pago</p>
            <div className="flex gap-2 mb-2">
              <input name="name" required placeholder="Nombre" className="flex-1 border border-border rounded-lg px-2 py-1.5 bg-background text-sm" />
              <select name="type" className="flex-1 border border-border rounded-lg px-2 py-1.5 bg-background text-sm">
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="billetera_digital">Billetera digital</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>
            <input name="bankOrIssuer" placeholder="Banco o emisor" className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-sm mb-2" />
            <button className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">Agregar medio de pago</button>
          </form>
        </>
      )}
    </>
  );
}
