"use client";

import { useState, ReactNode } from "react";

export default function MetodoSelector({ manual }: { manual: ReactNode }) {
  const [metodo, setMetodo] = useState<"foto" | "voz" | "texto" | "manual">("manual");

  const metodos: { id: "foto" | "voz" | "texto" | "manual"; label: string; icon: string }[] = [
    { id: "foto", label: "Foto", icon: "📷" },
    { id: "voz", label: "Voz", icon: "🎤" },
    { id: "texto", label: "Texto", icon: "💬" },
    { id: "manual", label: "Manual", icon: "✍️" },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {metodos.map((m) => (
          <button
            key={m.id}
            onClick={() => setMetodo(m.id)}
            className={`flex-1 text-xs py-2.5 rounded-xl border flex flex-col items-center gap-1 ${
              metodo === m.id ? "bg-accent-soft text-accent border-accent" : "border-border text-muted"
            }`}
          >
            <span className="text-base">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {metodo === "foto" && (
        <div>
          <div className="bg-positive-soft rounded-xl px-3 py-2.5 flex items-center gap-2 mb-4">
            <span className="text-positive">✓</span>
            <span className="text-xs text-positive">boleta_tottus.jpg · leída con IA, confianza 92%</span>
          </div>
          <div className="flex gap-2 mb-2.5">
            <div className="flex-1"><label className="text-xs text-muted block mb-1">Comercio</label><input defaultValue="Tottus" className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm" /></div>
            <div className="flex-1"><label className="text-xs text-muted block mb-1">Monto total</label><input defaultValue="S/ 87.40" className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm" /></div>
          </div>
          <div className="flex gap-2 mb-3">
            <div className="flex-1"><label className="text-xs text-muted block mb-1">Categoría</label><select className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm"><option>Supermercado</option></select></div>
            <div className="flex-1"><label className="text-xs text-muted block mb-1">Medio de pago</label><select className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm"><option>BCP débito</option></select></div>
          </div>
          <p className="text-xs text-muted mb-1.5">Productos detectados</p>
          <div className="bg-surface border border-border rounded-xl px-3 mb-3">
            <div className="flex justify-between text-sm py-2 border-b border-border"><span>Leche</span><span className="text-muted">S/ 8.50</span></div>
            <div className="flex justify-between text-sm py-2 border-b border-border"><span>Palta</span><span className="text-muted">S/ 6.20</span></div>
            <div className="flex justify-between text-sm py-2"><span>Detergente</span><span className="text-muted">S/ 22.90</span></div>
          </div>
          <p className="text-xs text-muted mb-3">Corrige lo que haga falta antes de guardar — así la IA aprende para la próxima.</p>
          <button className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium">Guardar</button>
        </div>
      )}

      {metodo === "voz" && (
        <div>
          <div className="flex flex-col items-center py-4 mb-3">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-2 text-white">🎤</div>
            <p className="text-xs text-muted">Escuchando...</p>
          </div>
          <div className="bg-background rounded-xl px-3 py-2.5 text-sm italic mb-3.5">&quot;Gasté 45 soles en un almuerzo con Marco, pagué con Yape.&quot;</div>
          <div className="flex gap-2 mb-2.5">
            <div className="flex-1"><label className="text-xs text-muted block mb-1">Monto</label><input defaultValue="S/ 45" className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm" /></div>
            <div className="flex-1"><label className="text-xs text-muted block mb-1">Categoría</label><select className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm"><option>Salidas a comer</option></select></div>
          </div>
          <div className="flex gap-2 mb-3">
            <div className="flex-1"><label className="text-xs text-muted block mb-1">Medio de pago</label><select className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm"><option>Yape, sale de BCP</option></select></div>
            <div className="flex-1"><label className="text-xs text-muted block mb-1">Notas</label><input defaultValue="Almuerzo con Marco" className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm" /></div>
          </div>
          <p className="text-xs text-muted mb-3">Mismo motor que texto libre — pasa por el mismo procesamiento.</p>
          <button className="w-full py-2.5 bg-accent text-white rounded-full text-sm font-medium">Guardar</button>
        </div>
      )}

      {metodo === "texto" && (
        <div>
          <label className="text-xs text-muted block mb-1">Escribe qué gastaste</label>
          <textarea placeholder="Compré pan y leche en Tottus por 18 soles" className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm mb-3 h-16" />
          <p className="text-xs text-muted mb-3">La IA lo lee y te pre-llena los campos, igual que Foto y Voz. Revisas y guardas.</p>
          <button className="w-full py-2.5 bg-accent text-white rounded-full text-sm font-medium">Guardar</button>
        </div>
      )}

      {metodo === "manual" && manual}
    </div>
  );
}
