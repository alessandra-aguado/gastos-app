"use client";

import { useState } from "react";
import { eliminarSimulationItem } from "@/lib/actions";
import RowMenu from "../components/RowMenu";
import { useDecimales } from "../components/DecimalesProvider";
import { formatMonto } from "@/lib/format";
import SimulationItemModal from "./SimulationItemModal";

type Categoria = { id: string; name: string };
type Medio = { id: string; name: string; type: string };
type DeudaOpcion = { id: string; counterpartName: string | null; type: string };
type Item = {
  id: string;
  type: string;
  description: string;
  amount: number;
  categoryId: string | null;
  paymentMethodId: string | null;
  debtId: string | null;
  category: { name: string } | null;
  paymentMethod: { name: string } | null;
  debt: { counterpartName: string | null; type: string } | null;
};

function borrarConConfirmacion(id: string, etiqueta: string) {
  if (!window.confirm(`¿Eliminar "${etiqueta}" de este escenario?`)) return;
  const fd = new FormData();
  fd.set("id", id);
  void eliminarSimulationItem(fd);
}

const BADGE: Record<string, { label: string; className: string }> = {
  ingreso: { label: "Ingreso", className: "bg-accent-soft text-positive" },
  gasto: { label: "Gasto", className: "bg-accent-soft text-accent" },
  prestamo: { label: "Préstamo", className: "bg-warning/15 text-warning" },
  pago_deuda: { label: "Pago extra", className: "bg-accent-soft text-accent" },
};

export default function SimulationItemRow({ item, month, categorias, medios, deudas, ultimo }: { item: Item; month: string; categorias: Categoria[]; medios: Medio[]; deudas: DeudaOpcion[]; ultimo: boolean }) {
  const [editando, setEditando] = useState(false);
  const decimales = useDecimales();
  const badge = BADGE[item.type];
  const esIngreso = item.type === "ingreso";

  return (
    <div className={`flex justify-between items-center px-4 py-3 ${!ultimo ? "border-b border-border" : ""}`}>
      <div>
        <p className="text-sm font-medium flex items-center gap-1.5">
          {item.description}
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.className}`}>{badge.label}</span>
        </p>
        <p className="text-xs text-muted">
          {item.category?.name || item.debt?.counterpartName || ""}
          {item.paymentMethod ? ` · ${item.paymentMethod.name}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${esIngreso ? "text-positive" : ""}`}>
          {esIngreso ? "+" : "−"} S/ {formatMonto(item.amount, decimales)}
        </span>
        <RowMenu onEdit={() => setEditando(true)} onDelete={() => borrarConConfirmacion(item.id, item.description)} />
      </div>
      {editando && <SimulationItemModal month={month} categorias={categorias} medios={medios} deudas={deudas} item={item} onClose={() => setEditando(false)} />}
    </div>
  );
}
