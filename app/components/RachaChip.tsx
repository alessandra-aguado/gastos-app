"use client";

import { useState } from "react";
import { Flame, ChevronLeft, ChevronRight } from "lucide-react";

function claveDia(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mesActualKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function RachaChip({
  rachaActual,
  mejorRacha,
  diasConGasto,
  diasVencimiento,
}: {
  rachaActual: number;
  mejorRacha: number;
  diasConGasto: string[];
  diasVencimiento: number[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [mesKey, setMesKey] = useState(mesActualKey());

  const gastoSet = new Set(diasConGasto);
  const vencSet = new Set(diasVencimiento);
  const hoy = new Date();
  const hoyKey = claveDia(hoy);

  const [y, m] = mesKey.split("-").map(Number);
  const primerDia = new Date(y, m - 1, 1);
  const diasEnMes = new Date(y, m, 0).getDate();
  // 0 = domingo en JS; queremos que la semana empiece en lunes.
  const offset = (primerDia.getDay() + 6) % 7;
  const esMesActual = mesKey === mesActualKey();

  function cambiarMes(delta: number) {
    const d = new Date(y, m - 1 + delta, 1);
    setMesKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const nombreMes = primerDia.toLocaleDateString("es-PE", { month: "long", year: "numeric" });

  return (
    <>
      <button
        onClick={() => setAbierto((v) => !v)}
        className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5 text-left hover:border-accent transition-colors"
      >
        <p className="text-xs text-muted flex items-center gap-1.5"><Flame size={14} strokeWidth={1.75} className="text-accent" />Racha</p>
        <p className="text-3xl font-bold mt-1 text-accent">{rachaActual}</p>
        <p className="text-xs text-muted mt-0.5">{rachaActual === 1 ? "día" : "días"} seguidos</p>
      </button>

      {abierto && (
        <div className="col-span-full bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium flex items-center gap-1.5"><Flame size={16} strokeWidth={1.75} className="text-accent" />{rachaActual} {rachaActual === 1 ? "día" : "días"} registrando</p>
              <p className="text-xs text-muted mt-0.5">Mejor racha: {mejorRacha} {mejorRacha === 1 ? "día" : "días"}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => cambiarMes(-1)} aria-label="Mes anterior" className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:bg-hover transition-colors">
                <ChevronLeft size={16} strokeWidth={1.75} />
              </button>
              <span className="text-sm capitalize w-32 text-center">{nombreMes}</span>
              <button
                onClick={() => cambiarMes(1)}
                aria-label="Mes siguiente"
                disabled={esMesActual}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:bg-hover transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight size={16} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center mb-1.5">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <span key={i} className="text-[10px] text-muted">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: offset }, (_, i) => <div key={`vacio-${i}`} />)}
            {Array.from({ length: diasEnMes }, (_, i) => {
              const dayNum = i + 1;
              const fecha = new Date(y, m - 1, dayNum);
              const key = claveDia(fecha);
              const tieneGasto = gastoSet.has(key);
              const esFuturo = key > hoyKey;
              const esHoy = key === hoyKey;
              const tieneVencimiento = vencSet.has(dayNum);

              return (
                <div key={key} className="aspect-square rounded-md flex items-center justify-center relative text-[10px]"
                  style={{
                    background: tieneGasto ? "var(--positive)" : esFuturo ? "transparent" : "var(--border)",
                    border: esHoy ? "1.5px solid var(--accent)" : esFuturo ? "1px dashed var(--border)" : "none",
                    color: tieneGasto ? "#fff" : "var(--muted)",
                  }}
                  title={tieneVencimiento ? "Pago próximo a vencer" : undefined}
                >
                  {dayNum}
                  {tieneVencimiento && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--warning)" }} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--positive)" }} />Con gasto registrado</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--warning)" }} />Pago por vencer ese día del mes</span>
          </div>
        </div>
      )}
    </>
  );
}
