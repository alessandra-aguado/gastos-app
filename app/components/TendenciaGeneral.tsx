"use client";

import { useState } from "react";
import { useDecimales } from "./DecimalesProvider";
import { formatMonto } from "@/lib/format";

type Punto = { x: number; y: number } | null;

type Serie = {
  key: string;
  label: string;
  color: string;
  data: (number | null)[];
};

export default function TendenciaGeneral({
  meses,
  gastoReal,
  ahorro,
  inversion,
  deuda,
}: {
  meses: string[];
  gastoReal: number[];
  ahorro: (number | null)[];
  inversion: (number | null)[];
  deuda: (number | null)[];
}) {
  const decimales = useDecimales();
  const series: Serie[] = [
    { key: "gasto", label: "Gasto", color: "#111111", data: gastoReal },
    { key: "ahorro", label: "Ahorro", color: "#16a34a", data: ahorro },
    { key: "inversion", label: "Inversión", color: "#5b6cff", data: inversion },
    { key: "deuda", label: "Deuda", color: "#f97316", data: deuda },
  ];

  const hayHistorialParcial = [ahorro, inversion, deuda].some((s) => s.some((v) => v === null));

  const [activas, setActivas] = useState<Set<string>>(new Set(["gasto"]));
  const [seleccion, setSeleccion] = useState<{ serieKey: string; index: number } | null>(null);

  const toggle = (key: string) => {
    const next = new Set(activas);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    if (next.size > 0) setActivas(next);
    setSeleccion(null);
  };

  const W = 600;
  const H = 220;
  const padL = 8;
  const padR = 8;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = meses.length;

  const puntos = (data: (number | null)[]): Punto[] => {
    const valores = data.filter((v): v is number => v !== null);
    if (valores.length === 0) return data.map(() => null);
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const rango = max - min || 1;
    return data.map((v, i) => {
      if (v === null) return null;
      const x = padL + (i / Math.max(1, n - 1)) * innerW;
      const norm = (v - min) / rango;
      const y = padT + innerH - norm * innerH;
      return { x, y };
    });
  };

  const ultimoValor = (data: (number | null)[]) => {
    const valores = data.filter((v): v is number => v !== null);
    return valores.length > 0 ? valores[valores.length - 1] : null;
  };

  const seleccionInfo = seleccion ? series.find((s) => s.key === seleccion.serieKey) : null;
  const valorSeleccion = seleccionInfo ? seleccionInfo.data[seleccion!.index] : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">Tendencia general</p>
        {seleccionInfo && (
          <p className="text-xs text-muted">
            {seleccionInfo.label} · {meses[seleccion!.index]}:{" "}
            <span className="text-foreground font-medium">
              {valorSeleccion === null ? "sin datos" : `S/ ${formatMonto(valorSeleccion, decimales)}`}
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {series.map((s) => {
          const activo = activas.has(s.key);
          const ultimo = ultimoValor(s.data);
          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs border transition-colors"
              style={{
                borderColor: activo ? s.color : "var(--border)",
                background: activo ? `${s.color}1a` : "transparent",
                color: activo ? s.color : "var(--muted)",
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              {s.label}
              <span className="font-medium">{ultimo === null ? "—" : `S/ ${formatMonto(ultimo, decimales)}`}</span>
            </button>
          );
        })}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padL}
            x2={W - padR}
            y1={padT + innerH * f}
            y2={padT + innerH * f}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}

        {series
          .filter((s) => activas.has(s.key))
          .map((s) => {
            const pts = puntos(s.data);
            let path = "";
            pts.forEach((p, i) => {
              if (!p) return;
              const anterior = i > 0 ? pts[i - 1] : null;
              path += `${anterior ? "L" : "M"}${p.x},${p.y} `;
            });
            return (
              <g key={s.key}>
                <path d={path} fill="none" stroke={s.color} strokeWidth={2.5} />
                {pts.map((p, i) => {
                  if (!p) return null;
                  const activo = seleccion?.serieKey === s.key && seleccion?.index === i;
                  return (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={activo ? 5 : 3}
                      fill={s.color}
                      className="cursor-pointer"
                      onClick={() => setSeleccion({ serieKey: s.key, index: i })}
                    />
                  );
                })}
              </g>
            );
          })}

        {meses.map((m, i) => {
          const x = padL + (i / Math.max(1, n - 1)) * innerW;
          return (
            <text key={m} x={x} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--muted)">
              {m}
            </text>
          );
        })}
      </svg>

      {hayHistorialParcial && (
        <p className="text-xs text-muted mt-3">
          El historial de ahorro, inversión y deuda se completa mes a mes a partir de agosto de 2026.
        </p>
      )}
    </div>
  );
}
