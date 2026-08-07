"use client";

import { useState } from "react";

const fijos = [
  { icon: "🏠", nombre: "Alquiler", cat: "Vivienda · vence el 5", monto: 500, pagado: true },
  { icon: "📶", nombre: "Internet", cat: "Suscripciones · vence el 10", monto: 90, pagado: true },
  { icon: "🔁", nombre: "Netflix + Spotify", cat: "Suscripciones · vence el 12", monto: 60, pagado: true },
  { icon: "🚌", nombre: "Transporte fijo", cat: "Incluye micro + taxi + corredor · sin vencimiento fijo", monto: 120, pagado: false },
  { icon: "🏋️", nombre: "Gimnasio", cat: "Salud física · vence el 20", monto: 130, pagado: false },
];

export default function FijosPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [comoVence, setComoVence] = useState<"unica" | "rango">("rango");

  const pagados = fijos.filter((f) => f.pagado).length;
  const total = fijos.reduce((s, f) => s + f.monto, 0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-semibold">🔁 Fijos</h1>
          <p className="text-muted text-sm mt-1">S/ {total} comprometidos este mes · {pagados} de {fijos.length} pagados</p>
        </div>
        <button onClick={() => setModalAbierto(true)} className="text-sm px-4 py-2 rounded-full border border-border hover:border-accent transition-colors">+ Nuevo fijo</button>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {fijos.map((f, i) => (
          <div key={f.nombre} className={`flex justify-between items-center px-4 py-3 ${i < fijos.length - 1 ? "border-b border-border" : ""}`}>
            <div className="flex gap-2.5 items-center">
              <span className="text-lg">{f.icon}</span>
              <div>
                <p className="text-sm font-medium">{f.nombre}</p>
                <p className="text-xs text-muted">{f.cat}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm">S/ {f.monto}</span>
              {f.pagado ? (
                <span className="bg-positive-soft text-positive text-[10px] font-medium px-2 py-1 rounded-md">Pagado</span>
              ) : (
                <button className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">Marcar pagado</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={() => setModalAbierto(false)}>
          <div className="w-[380px] bg-surface rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">Nuevo fijo</span>
              <button onClick={() => setModalAbierto(false)} className="text-muted">✕</button>
            </div>

            <label className="text-xs text-muted block mb-1">Nombre</label>
            <input defaultValue="Internet" className="w-full border border-border rounded-xl px-3 py-2 bg-background text-sm mb-2.5" />

            <div className="flex gap-2 mb-2.5">
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">Categoría</label>
                <select className="w-full border border-border rounded-xl px-3 py-2 bg-background text-sm"><option>Suscripciones</option></select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">Monto</label>
                <input type="number" defaultValue={90} className="w-full border border-border rounded-xl px-3 py-2 bg-background text-sm" />
              </div>
            </div>

            <label className="text-xs text-muted block mb-1">Medio de pago</label>
            <select className="w-full border border-border rounded-xl px-3 py-2 bg-background text-sm mb-1">
              <option>Interbank (crédito)</option><option>BCP (débito)</option><option>Yape, sale de BCP</option><option>Efectivo</option>
            </select>
            <p className="text-xs text-muted mb-3">Tus medios de pago se agregan en Ajustes.</p>

            <label className="text-xs text-muted block mb-1.5">¿Cómo se paga?</label>
            <div className="flex gap-2 mb-2.5">
              <button onClick={() => setComoVence("unica")} className={`flex-1 text-xs py-2 rounded-lg border ${comoVence === "unica" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}>Fecha única</button>
              <button onClick={() => setComoVence("rango")} className={`flex-1 text-xs py-2 rounded-lg border ${comoVence === "rango" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}>Rango de pago</button>
            </div>

            {comoVence === "unica" ? (
              <div className="mb-2.5">
                <label className="text-xs text-muted block mb-1">¿Qué día del mes vence?</label>
                <input type="number" defaultValue={5} className="w-full border border-border rounded-xl px-3 py-2 bg-background text-sm" />
              </div>
            ) : (
              <div className="mb-2.5">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted block mb-1">Se emite el día</label>
                    <input type="number" defaultValue={5} className="w-full border border-border rounded-xl px-3 py-2 bg-background text-sm" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted block mb-1">Vence el día</label>
                    <input type="number" defaultValue={20} className="w-full border border-border rounded-xl px-3 py-2 bg-background text-sm" />
                  </div>
                </div>
                <p className="text-xs text-muted mt-1.5">Puedes pagarlo cualquier día dentro de ese rango.</p>
              </div>
            )}

            <label className="text-xs text-muted block mb-1">¿Cuántos días antes te recuerdo?</label>
            <input type="number" defaultValue={0} placeholder="0 = el mismo día" className="w-full border border-border rounded-xl px-3 py-2 bg-background text-sm mb-2.5" />

            <label className="flex items-start gap-2 text-xs text-muted mb-3">
              <input type="checkbox" defaultChecked className="mt-0.5" />
              Enviar recordatorio a Google Calendar
            </label>

            <div className="bg-accent-soft rounded-xl p-3 mb-3.5">
              <p className="text-xs text-accent leading-relaxed">Al marcarlo pagado se registra solo en Gastos, con esta categoría y medio de pago.</p>
            </div>

            <button className="w-full py-2.5 bg-accent text-white rounded-full text-sm font-medium">Guardar fijo</button>
          </div>
        </div>
      )}
    </div>
  );
}
