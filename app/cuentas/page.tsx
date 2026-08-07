"use client";

import { useState } from "react";

export default function CuentasPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipo, setTipo] = useState<"cuenta" | "credito">("cuenta");

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-semibold">👛 Cuentas</h1>
          <p className="text-muted text-sm mt-1">S/ 4,750 en total · sin contar deudas</p>
        </div>
        <button onClick={() => setModalAbierto(true)} className="text-sm px-4 py-2 rounded-lg border border-border hover:border-accent transition-colors">+ Agregar cuenta</button>
      </div>

      <p className="text-xs text-muted mb-2">BCP</p>
      <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden mb-4">
        <div className="flex justify-between items-center px-4 py-3 border-b border-border">
          <div><p className="text-sm font-medium">Cuenta corriente</p><p className="text-xs text-muted">Actualizado hace 5 días</p></div>
          <span className="text-sm">S/ 1,200</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3">
          <div><p className="text-sm font-medium">Guardadito</p><p className="text-xs text-muted">Ahorro automático dentro de BCP</p></div>
          <span className="text-sm">S/ 450</span>
        </div>
      </div>

      <p className="text-xs text-muted mb-2">Interbank</p>
      <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden mb-4">
        <div className="flex justify-between items-center px-4 py-3 border-b border-border">
          <div><p className="text-sm font-medium">Cuenta normal</p><p className="text-xs text-muted">Actualizado hace 5 días</p></div>
          <span className="text-sm">S/ 300</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3 border-b border-border">
          <div><p className="text-sm font-medium">Cuenta de ahorro</p><p className="text-xs text-muted">Actualizado hace 5 días</p></div>
          <span className="text-sm">S/ 2,000</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3 bg-background">
          <div><p className="text-sm text-muted font-medium">Tarjeta de crédito</p><p className="text-xs text-muted">Es una deuda, no suma al patrimonio</p></div>
          <a href="/debo" className="text-xs text-muted">Ver en Debo →</a>
        </div>
      </div>

      <p className="text-xs text-muted mb-2">BBVA</p>
      <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden mb-4">
        <div className="flex justify-between items-center px-4 py-3">
          <div><p className="text-sm font-medium">Cuenta familiar</p><p className="text-xs text-muted">Compartida con mamá y hermana, la administras tú</p></div>
          <span className="text-sm">S/ 800</span>
        </div>
      </div>

      <p className="text-xs text-muted mb-2">Recompensas</p>
      <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3">
          <div><p className="text-sm font-medium">Puntos BCP</p><p className="text-xs text-muted">≈ S/ 60 en beneficios</p></div>
          <span className="text-sm">1,200 pts</span>
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={() => setModalAbierto(false)}>
          <div className="w-[380px] bg-surface rounded-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">Nueva cuenta</span>
              <button onClick={() => setModalAbierto(false)} className="text-muted">✕</button>
            </div>
            <label className="text-xs text-muted block mb-1">Nombre</label>
            <input className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="Cuenta corriente, Guardadito..." />
            <label className="text-xs text-muted block mb-1">Banco o emisor</label>
            <select className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3">
              <option>BCP</option><option>Interbank</option><option>BBVA</option><option>Otro</option>
            </select>
            <label className="text-xs text-muted block mb-1.5">Tipo de cuenta</label>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {[
                { id: "cuenta", label: "Corriente o ahorro" },
                { id: "ahorro-auto", label: "Ahorro automático" },
                { id: "recompensas", label: "Recompensas" },
                { id: "credito", label: "Tarjeta de crédito" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTipo(t.id === "credito" ? "credito" : "cuenta")}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                    (t.id === "credito" ? tipo === "credito" : tipo === "cuenta" && t.id === "cuenta") ? "bg-accent-soft text-accent border-accent" : "border-border"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tipo === "cuenta" ? (
              <>
                <label className="text-xs text-muted block mb-1">Saldo actual</label>
                <input type="number" placeholder="1200" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" />
                <label className="text-xs text-muted block mb-1">Nota (opcional)</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="Cuenta compartida con mamá y hermana..." />
                <label className="flex items-start gap-2 text-xs text-muted mb-3">
                  <input type="checkbox" defaultChecked className="mt-0.5" />
                  Incluir en mi patrimonio total
                </label>
                <label className="text-xs text-muted block mb-1">¿Cuántos días antes de fin de mes te recuerdo?</label>
                <input type="number" defaultValue={3} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3" />
                <button className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium">Guardar cuenta</button>
              </>
            ) : (
              <div className="bg-accent-soft rounded-xl p-3.5">
                <p className="text-xs text-accent mb-2.5 leading-relaxed">
                  Una tarjeta de crédito es una deuda, no una cuenta con saldo propio. Regístrala en Debo para llevar el control de cuánto debes en cada una.
                </p>
                <a href="/debo" className="block text-center text-xs py-2 rounded-lg border border-border">Ir a Debo →</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
