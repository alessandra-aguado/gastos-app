"use client";

import { useState } from "react";

type Serie = {
  key: string;
  label: string;
  color: string;
  data: number[];
  esReal: boolean;
};

export default function TendenciaGeneral({
  meses,
  gastoReal,
}: {
  meses: string[];
  gastoReal: number[];
}) {
  const series: Serie[] = [
    { key: "gasto", label: "Gasto", color: "#f05b53", data: gastoReal, esReal: true },
    { key: "ahorro", label: "Ahorro", color: "#10b981", data: [8200, 8900, 9600, 10300, 11000, 11720], esReal: false },
    { key: "inversion", label: "Inversión", color: "#5b8ff0", data: [3200, 3500, 3800, 4000, 4300, 4570], esReal: false },
    { key: "deuda", label: "Deuda", color: "#e0793f", data: [3400, 3300, 3150, 3050, 2950, 2890], esReal: false },
  ];

  const [activas, setActivas] = useState<Set<string>>(new Set(["gasto"]));

  const toggle = (key: string) => {
    const next = new Set(activas);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    if (next.size > 0) setActivas(next);
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

  const puntos = (data: number[]) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const rango = max - min || 1;
    return data.map((v, i) => {
      const x = padL + (i / Math.max(1, n - 1)) * innerW;
      const norm = (v - min) / rango;
      const y = padT + innerH - norm * innerH;
      return { x, y };
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">Tendencia general</p>
        <p className="text-xs text-muted">Gasto es real · el resto es referencia</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {series.map((s) => {
          const activo = activas.has(s.key);
          const ultimo = s.data[s.data.length - 1];
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
              <span className="font-medium">S/ {ultimo.toLocaleString("es-PE")}</span>
              {!s.esReal && <span className="opacity-60">ref.</span>}
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
            const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
            return (
              <g key={s.key}>
                <path d={path} fill="none" stroke={s.color} strokeWidth={2.5} strokeDasharray={s.esReal ? undefined : "5 4"} />
                {pts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={3} fill={s.color} />
                ))}
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
    </div>
  );
}
