"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { eliminarPlannedExpense, marcarRealizadoPlannedExpense } from "@/lib/actions";
import RowMenu from "../components/RowMenu";
import { useDecimales } from "../components/DecimalesProvider";
import { formatMonto, etiquetaMes } from "@/lib/format";
import PlannedExpenseModal from "./PlannedExpenseModal";

type Categoria = { id: string; name: string };
type Medio = { id: string; name: string; type: string; billingDay?: number | null };
type Item = {
  id: string;
  description: string;
  amount: number;
  kind: string;
  categoryId: string | null;
  paymentMethodId: string | null;
  counterpartName: string | null;
  date?: string | Date | null;
  category: { name: string } | null;
  paymentMethod: { name: string; type?: string; billingDay?: number | null } | null;
};

function mesDeFacturacionCliente(fecha: Date, billingDay: number | null | undefined) {
  const y = fecha.getFullYear();
  const m = fecha.getMonth();
  const dia = fecha.getDate();
  if (!billingDay) return `${y}-${String(m + 1).padStart(2, "0")}`;
  if (dia <= billingDay) return `${y}-${String(m + 1).padStart(2, "0")}`;
  const sig = new Date(y, m + 1, 1);
  return `${sig.getFullYear()}-${String(sig.getMonth() + 1).padStart(2, "0")}`;
}

function borrarConConfirmacion(id: string, etiqueta: string) {
  if (!window.confirm(`¿Eliminar "${etiqueta}" de tus gastos planificados?`)) return;
  const fd = new FormData();
  fd.set("id", id);
  void eliminarPlannedExpense(fd);
}

function marcarRealizado(id: string, etiqueta: string, kind: string) {
  const msg =
    kind === "prestamo"
      ? `¿Ya le prestaste este dinero a ${etiqueta}? Esto lo va a registrar en Deuda → Préstamos personales.`
      : `¿Ya hiciste este gasto? Esto lo va a registrar como un gasto real.`;
  if (!window.confirm(msg)) return;
  const fd = new FormData();
  fd.set("id", id);
  void marcarRealizadoPlannedExpense(fd);
}

export default function PlannedExpenseRow({ item, categorias, medios, ultimo }: { item: Item; categorias: Categoria[]; medios: Medio[]; ultimo: boolean }) {
  const [editando, setEditando] = useState(false);
  const decimales = useDecimales();
  const esPrestamo = item.kind === "prestamo";
  const esCredito = item.paymentMethod?.type === "credito";
  const corteLabel = esCredito && item.date ? etiquetaMes(mesDeFacturacionCliente(new Date(item.date), item.paymentMethod?.billingDay)) : null;

  return (
    <div className={`flex justify-between items-center px-4 py-3 ${!ultimo ? "border-b border-border" : ""}`}>
      <div>
        <p className="text-sm font-medium flex items-center gap-1.5">
          {item.description}
          {esPrestamo && <span className="bg-accent-soft text-accent text-[10px] px-1.5 py-0.5 rounded">Préstamo</span>}
        </p>
        <p className="text-xs text-muted">
          {esPrestamo ? item.counterpartName : item.category?.name}
          {item.paymentMethod ? ` · ${item.paymentMethod.name}` : ""}
        </p>
        {corteLabel && <p className="text-[11px] text-accent mt-0.5">Se factura en tu corte de {corteLabel}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">S/ {formatMonto(item.amount, decimales)}</span>
        <button
          onClick={() => marcarRealizado(item.id, item.counterpartName || item.description, item.kind)}
          title="Marcar como realizado"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-positive transition-colors"
        >
          <Check size={15} />
        </button>
        <RowMenu onEdit={() => setEditando(true)} onDelete={() => borrarConConfirmacion(item.id, item.description)} />
      </div>
      {editando && <PlannedExpenseModal categorias={categorias} medios={medios} item={item} onClose={() => setEditando(false)} />}
    </div>
  );
}
