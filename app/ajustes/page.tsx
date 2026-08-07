"use client";

import { useState } from "react";

const categorias = [
  { icon: "🛒", nombre: "Supermercado", desc: "Compras tipo Tottus, Plaza Vea, Metro, Wong. Se usa para que la IA clasifique mejor." },
  { icon: "💻", nombre: "Tecnología", desc: "Accesorios, celular, laptop, cargadores, trípodes, luces." },
  { icon: "👗", nombre: "Ropa", desc: "Prendas, calzado, accesorios de moda." },
];

const medios = [
  { nombre: "Yape, sale de BCP", tipo: "billetera digital" },
  { nombre: "BCP", tipo: "débito" },
  { nombre: "Interbank", tipo: "crédito" },
];

export default function AjustesPage() {
  const [tab, setTab] = useState<"categorias" | "medios">("categorias");

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">⚙️ Ajustes</h1>

      <div className="flex gap-1 border-b border-border mb-4">
        <button onClick={() => setTab("categorias")} className={`px-3.5 py-2 text-sm ${tab === "categorias" ? "text-accent font-medium border-b-2 border-accent" : "text-muted"}`}>Categorías</button>
        <button onClick={() => setTab("medios")} className={`px-3.5 py-2 text-sm ${tab === "medios" ? "text-accent font-medium border-b-2 border-accent" : "text-muted"}`}>Medios de pago</button>
      </div>

      {tab === "categorias" ? (
        <>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-3">
            {categorias.map((c, i) => (
              <div key={c.nombre} className={`flex justify-between items-start px-4 py-3 ${i < categorias.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex gap-2.5">
                  <span className="text-base">{c.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{c.nombre}</p>
                    <p className="text-xs text-muted max-w-[280px]">{c.desc}</p>
                  </div>
                </div>
                <span className="text-muted text-xs">✎</span>
              </div>
            ))}
          </div>
          <div className="bg-surface border border-dashed border-border rounded-2xl p-4">
            <p className="text-xs text-muted mb-2">Nueva categoría</p>
            <div className="flex gap-2 mb-2">
              <input placeholder="Ícono" className="w-16 border border-border rounded-lg px-2 py-1.5 bg-background text-sm" />
              <input placeholder="Nombre" className="flex-1 border border-border rounded-lg px-2 py-1.5 bg-background text-sm" />
            </div>
            <textarea placeholder="Descripción para la IA: qué tipo de compras van aquí..." className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-sm mb-2 h-11" />
            <button className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">Agregar categoría</button>
          </div>
        </>
      ) : (
        <>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-3">
            {medios.map((m, i) => (
              <div key={m.nombre} className={`flex justify-between items-center px-4 py-3 ${i < medios.length - 1 ? "border-b border-border" : ""}`}>
                <p className="text-sm">{m.nombre} <span className="text-muted text-xs">· {m.tipo}</span></p>
                <span className="text-muted text-xs">✎</span>
              </div>
            ))}
          </div>
          <div className="bg-surface border border-dashed border-border rounded-2xl p-4">
            <p className="text-xs text-muted mb-2">Nuevo medio de pago</p>
            <div className="flex gap-2 mb-2">
              <input placeholder="Nombre" className="flex-1 border border-border rounded-lg px-2 py-1.5 bg-background text-sm" />
              <select className="flex-1 border border-border rounded-lg px-2 py-1.5 bg-background text-sm">
                <option>Débito</option><option>Crédito</option><option>Billetera digital</option><option>Efectivo</option>
              </select>
            </div>
            <input placeholder="Banco o emisor" className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-sm mb-2" />
            <button className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">Agregar medio de pago</button>
          </div>
        </>
      )}
    </div>
  );
}
