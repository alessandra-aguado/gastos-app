"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatMonto } from "@/lib/format";
import TransactionRow from "./TransactionRow";

type Categoria = { id: string; name: string };
type Medio = { id: string; name: string; type: string };
type Transaccion = {
  id: string;
  amount: number;
  date: Date;
  merchant: string | null;
  notes: string | null;
  categoryId: string | null;
  paymentMethodId: string | null;
  category: { name: string; icon: string | null; color: string | null } | null;
  paymentMethod: { name: string } | null;
};
type Dia = { dia: number; date: string; total: number; transacciones: Transaccion[] };

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

function labelMes(mesKey: string) {
  const [y, m] = mesKey.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
}

function mesAdyacente(mesKey: string, delta: number) {
  const [y, m] = mesKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function GastoCalendario({
  mesKey,
  dias,
  primerDiaSemana,
  decimales,
  categorias,
  medios,
  maxTotal,
  totalMes,
}: {
  mesKey: string;
  dias: Dia[];
  primerDiaSemana: number; // 0 = lunes ... 6 = domingo
  decimales: number;
  categorias: Categoria[];
  medios: Medio[];
  maxTotal: number;
  totalMes: number;
}) {
  const [diaSeleccionado, setDiaSeleccionado] = useState<Dia | null>(null);

  const celdasVacias = Array.from({ length: primerDiaSemana });

  return (
    <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Link href={`/gastos?vista=calendario&mes=${mesAdyacente(mesKey, -1)}`} className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-accent transition-colors">
            <ChevronLeft size={14} />
          </Link>
          <p className="text-sm font-medium capitalize w-32 text-center">{labelMes(mesKey)}</p>
          <Link href={`/gastos?vista=calendario&mes=${mesAdyacente(mesKey, 1)}`} className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-accent transition-colors">
            <ChevronRight size={14} />
          </Link>
        </div>
        <p className="text-sm text-muted">Total del mes: <span className="text-foreground font-medium">S/ {formatMonto(totalMes, decimales)}</span></p>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="text-center text-[10px] text-muted font-medium">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {celdasVacias.map((_, i) => (
          <div key={`vacio-${i}`} />
        ))}
        {dias.map((d) => {
          const opacidad = d.total > 0 ? Math.min(1, 0.15 + (d.total / maxTotal) * 0.75) : 0;
          return (
            <button
              key={d.date}
              onClick={() => (d.transacciones.length > 0 ? setDiaSeleccionado(d) : undefined)}
              className={`relative h-16 rounded-lg border border-border p-1.5 text-left overflow-hidden transition-transform ${d.transacciones.length > 0 ? "hover:scale-[1.03] cursor-pointer" : "cursor-default"}`}
            >
              <div className="absolute inset-0" style={{ background: "var(--accent)", opacity: opacidad }} />
              <span className="relative text-[11px] text-muted">{d.dia}</span>
              {d.total > 0 && (
                <span className="relative block text-[11px] font-medium mt-1">S/ {formatMonto(d.total, decimales)}</span>
              )}
            </button>
          );
        })}
      </div>

      {diaSeleccionado && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={() => setDiaSeleccionado(null)}>
          <div className="w-[420px] max-h-[80vh] overflow-y-auto bg-surface rounded-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">
                {diaSeleccionado.dia} de {labelMes(mesKey)} · S/ {formatMonto(diaSeleccionado.total, decimales)}
              </span>
              <button onClick={() => setDiaSeleccionado(null)} className="text-muted"><X size={16} /></button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              {diaSeleccionado.transacciones.map((t) => (
                <TransactionRow key={t.id} transaccion={t} categorias={categorias} medios={medios} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
