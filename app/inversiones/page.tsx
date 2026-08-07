"use client";

import { useState } from "react";

export default function InversionesPage() {
  const [holdingsAbiertos, setHoldingsAbiertos] = useState(false);
  const [tipo, setTipo] = useState<"variable" | "fija">("variable");

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-semibold">📈 Inversiones</h1>
          <p className="text-muted text-sm mt-1">S/ 4,300 invertido · valor actual S/ 4,570 · +6.3%</p>
        </div>
        <button className="text-sm px-4 py-2 rounded-lg border border-border hover:border-accent transition-colors">+ Nuevo aporte</button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-3">
          <p className="text-xs text-muted mb-1">Invertido</p>
          <p className="text-base font-medium">S/ 4,300</p>
        </div>
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-3">
          <p className="text-xs text-muted mb-1">Valor actual</p>
          <p className="text-base font-medium">S/ 4,570</p>
        </div>
        <div className="bg-positive-soft rounded-xl p-3">
          <p className="text-xs text-positive mb-1">Rentabilidad</p>
          <p className="text-base font-medium text-positive">+6.3%</p>
        </div>
      </div>

      <div className="space-y-2.5 mb-6">
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4 cursor-pointer" onClick={() => setHoldingsAbiertos(!holdingsAbiertos)}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Trii <span className="text-xs text-muted font-normal">· variable</span></p>
              <p className="text-xs text-muted">Acciones EEUU</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm">S/ 2,240 <span className="text-muted text-xs">de S/ 2,000</span></p>
                <p className="text-xs text-positive">+12%</p>
              </div>
              <span className="text-muted text-xs">{holdingsAbiertos ? "▲" : "▼"}</span>
            </div>
          </div>
          {holdingsAbiertos && (
            <div className="mt-2.5 pt-2.5 border-t border-border">
              <div className="flex justify-between text-sm py-1"><span>Apple (AAPL)</span><span>S/ 980</span></div>
              <div className="flex justify-between text-sm py-1"><span>Tesla (TSLA)</span><span>S/ 640</span></div>
              <div className="flex justify-between text-sm py-1"><span>NVIDIA (NVDA)</span><span>S/ 620</span></div>
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">Depósito a plazo fijo BCP <span className="text-xs text-muted font-normal">· renta fija, TEA 4%</span></p>
            <p className="text-xs text-muted">Ganancia calculada por la tasa, sin actualizar a mano</p>
          </div>
          <div className="text-right">
            <p className="text-sm">S/ 1,560 <span className="text-muted text-xs">de S/ 1,500</span></p>
            <p className="text-xs text-positive">+4% al año</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-sm text-muted mb-3">Nuevo aporte</p>
        <div className="flex gap-2 mb-2.5">
          <div className="flex-1">
            <label className="text-xs text-muted block mb-1">Plataforma</label>
            <input className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm" placeholder="Trii, BCP, BVL..." />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted block mb-1">Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as "variable" | "fija")} className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm">
              <option value="variable">Acciones / bolsa / fondo variable</option>
              <option value="fija">Renta fija (plazo fijo, fondo con TEA)</option>
            </select>
          </div>
        </div>
        {tipo === "variable" ? (
          <div className="mb-2.5">
            <label className="text-xs text-muted block mb-1">Monto aportado</label>
            <input type="number" placeholder="500" className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm" />
          </div>
        ) : (
          <div className="mb-2.5">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">Monto aportado</label>
                <input type="number" placeholder="1500" className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">Tasa (TEA %)</label>
                <input type="number" placeholder="4" className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm" />
              </div>
            </div>
            <p className="text-xs text-accent mt-1.5">Ganancia estimada al año: calculada sola con la tasa.</p>
          </div>
        )}
        <button className="text-sm px-4 py-2 rounded-lg border border-border hover:border-accent transition-colors">Agregar aporte</button>
      </div>
    </div>
  );
}
